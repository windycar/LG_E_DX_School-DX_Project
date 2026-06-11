#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// MOMent Arduino UNO pin map
const int BUTTON_PIN = 2;
const int RGB_R_PIN = 3;
const int HUMIDIFIER_PIN = 4;
const int RGB_G_PIN = 5;
const int RGB_B_PIN = 6;
const int DEHUMIDIFIER_LED_PIN = 7;

// ULN2003 input channels
const int AIRCON_MOTOR_PIN = 9;       // D9  -> IN1 -> OUT1 -> aircon DC motor
const int PURIFIER_MOTOR_PIN = 10;    // D10 -> IN2 -> OUT2 -> purifier DC motor
const int WASHING_MOTOR_PIN = 11;     // D11 -> IN3 -> OUT3 -> washing-machine DC motor

const int AIR_PURIFIER_LED_PIN = 12;
const int CONNECTION_LED_PIN = 13;

LiquidCrystal_I2C lcd(0x27, 16, 2);

String serialLine = "";
int displayIndex = 0;
unsigned long lastDisplayUpdate = 0;
const unsigned long DISPLAY_INTERVAL_MS = 2500;

int appliedAirconPower = 0;
int appliedAirconLevel = 0;
int appliedPurifierPower = 0;
int appliedPurifierLevel = 0;

struct ApplianceState {
  int moodPower = 0;
  int moodBrightness = 50;
  int moodColor = 0;
  int airconPower = 0;
  int airconTemp = 24;
  int airconFan = 1;
  int humidifierPower = 0;
  int humidifierHumidity = 55;
  int humidifierIntensity = 1;
  int dehumidifierPower = 0;
  int dehumidifierHumidity = 50;
  int dehumidifierIntensity = 1;
  int purifierPower = 0;
  int purifierSpeed = 1;
  int purifierMode = 0;
  int washingPower = 0;
} state;

void setup() {
  Serial.begin(9600);
  Wire.begin();

  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(RGB_R_PIN, OUTPUT);
  pinMode(HUMIDIFIER_PIN, OUTPUT);
  pinMode(RGB_G_PIN, OUTPUT);
  pinMode(RGB_B_PIN, OUTPUT);
  pinMode(DEHUMIDIFIER_LED_PIN, OUTPUT);
  pinMode(AIRCON_MOTOR_PIN, OUTPUT);
  pinMode(PURIFIER_MOTOR_PIN, OUTPUT);
  pinMode(WASHING_MOTOR_PIN, OUTPUT);
  pinMode(AIR_PURIFIER_LED_PIN, OUTPUT);
  pinMode(CONNECTION_LED_PIN, OUTPUT);

  stopAllMotors();

  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("MOMent 3 Motors");
  lcd.setCursor(0, 1);
  lcd.print("USB Serial 9600");
}

void loop() {
  while (Serial.available() > 0) {
    char ch = Serial.read();
    if (ch == '\n') {
      handleCommand(serialLine);
      serialLine = "";
    } else if (ch != '\r') {
      serialLine += ch;
    }
  }

  static bool previousButton = HIGH;
  bool currentButton = digitalRead(BUTTON_PIN);
  if (previousButton == HIGH && currentButton == LOW) {
    runManualDemo();
    delay(250);
  }
  previousButton = currentButton;

  refreshDisplayCycle();
}

void handleCommand(String command) {
  command.trim();
  if (!command.startsWith("SYNC;")) {
    return;
  }

  parseSection(command, "ML=", state.moodPower, state.moodBrightness, state.moodColor);
  parseSection(command, "AC=", state.airconPower, state.airconTemp, state.airconFan);
  parseSection(command, "HU=", state.humidifierPower, state.humidifierHumidity, state.humidifierIntensity);
  parseSection(command, "DH=", state.dehumidifierPower, state.dehumidifierHumidity, state.dehumidifierIntensity);
  parseSection(command, "AP=", state.purifierPower, state.purifierSpeed, state.purifierMode);
  parseSingleValue(command, "WM=", state.washingPower);

  digitalWrite(CONNECTION_LED_PIN, HIGH);
  applyOutputs();
  Serial.println("OK");
}

void parseSection(String command, String key, int &first, int &second, int &third) {
  int start = command.indexOf(key);
  if (start < 0) return;
  start += key.length();
  int end = command.indexOf(';', start);
  if (end < 0) end = command.length();

  String values = command.substring(start, end);
  int comma1 = values.indexOf(',');
  int comma2 = values.indexOf(',', comma1 + 1);
  if (comma1 < 0 || comma2 < 0) return;

  first = values.substring(0, comma1).toInt();
  second = values.substring(comma1 + 1, comma2).toInt();
  third = values.substring(comma2 + 1).toInt();
}

void parseSingleValue(String command, String key, int &value) {
  int start = command.indexOf(key);
  if (start < 0) return;
  start += key.length();
  int end = command.indexOf(';', start);
  if (end < 0) end = command.length();
  value = command.substring(start, end).toInt();
}

void applyOutputs() {
  applyMoodLight();
  applyVariableMotor(AIRCON_MOTOR_PIN, state.airconPower, state.airconFan, appliedAirconPower, appliedAirconLevel);
  applyVariableMotor(
    PURIFIER_MOTOR_PIN,
    state.purifierPower,
    state.purifierMode == 2 ? 3 : state.purifierSpeed,
    appliedPurifierPower,
    appliedPurifierLevel
  );

  // 세탁기 모터는 단계 없이 ON/OFF만 사용합니다.
  digitalWrite(WASHING_MOTOR_PIN, state.washingPower ? HIGH : LOW);
  digitalWrite(HUMIDIFIER_PIN, state.humidifierPower ? HIGH : LOW);
  digitalWrite(DEHUMIDIFIER_LED_PIN, state.dehumidifierPower ? HIGH : LOW);
  digitalWrite(AIR_PURIFIER_LED_PIN, state.purifierPower ? HIGH : LOW);

  displayIndex = 0;
  lastDisplayUpdate = 0;
  updateDisplay();
}

void applyVariableMotor(int pin, int power, int levelValue, int &appliedPower, int &appliedLevel) {
  if (!power) {
    analogWrite(pin, 0);
    appliedPower = 0;
    appliedLevel = 0;
    return;
  }

  int level = constrain(levelValue, 1, 3);
  int pwmValue = 150;
  if (level == 2) pwmValue = 205;
  if (level == 3) pwmValue = 255;

  // 정지 상태에서 켜거나 단계를 바꿀 때 기동 토크를 확보합니다.
  if (!appliedPower || appliedLevel != level) {
    analogWrite(pin, 255);
    delay(180);
  }

  analogWrite(pin, pwmValue);
  appliedPower = 1;
  appliedLevel = level;
}

void stopAllMotors() {
  analogWrite(AIRCON_MOTOR_PIN, 0);
  analogWrite(PURIFIER_MOTOR_PIN, 0);
  digitalWrite(WASHING_MOTOR_PIN, LOW);
}

void applyMoodLight() {
  if (!state.moodPower) {
    setRgb(0, 0, 0);
    return;
  }

  int brightness = map(constrain(state.moodBrightness, 0, 100), 0, 100, 0, 255);
  if (state.moodColor == 1) {
    setRgb(brightness / 2, brightness / 2, brightness);
  } else if (state.moodColor == 2) {
    setRgb(brightness, brightness, brightness / 2);
  } else if (state.moodColor == 3) {
    setRgb(brightness / 3, 0, brightness / 2);
  } else {
    setRgb(brightness, brightness / 2, brightness / 4);
  }
}

void setRgb(int red, int green, int blue) {
  analogWrite(RGB_R_PIN, constrain(red, 0, 255));
  analogWrite(RGB_G_PIN, constrain(green, 0, 255));
  analogWrite(RGB_B_PIN, constrain(blue, 0, 255));
}

int activeDeviceCount() {
  int count = 0;
  if (state.moodPower) count++;
  if (state.airconPower) count++;
  if (state.humidifierPower) count++;
  if (state.dehumidifierPower) count++;
  if (state.purifierPower) count++;
  if (state.washingPower) count++;
  return count;
}

void printPadded(const String &text) {
  lcd.print(text);
  for (int i = text.length(); i < 16; i++) {
    lcd.print(" ");
  }
}

void printActiveDeviceByIndex(int index) {
  int current = 0;

  if (state.moodPower) {
    if (current == index) {
      printPadded("MOOD LIGHT ON");
      lcd.setCursor(0, 1);
      printPadded("Bright " + String(state.moodBrightness) + "%");
      return;
    }
    current++;
  }

  if (state.airconPower) {
    if (current == index) {
      printPadded("AIRCON MOTOR ON");
      lcd.setCursor(0, 1);
      printPadded("Temp " + String(state.airconTemp) + "C Fan " + String(state.airconFan));
      return;
    }
    current++;
  }

  if (state.humidifierPower) {
    if (current == index) {
      printPadded("HUMIDIFIER ON");
      lcd.setCursor(0, 1);
      printPadded("Target " + String(state.humidifierHumidity) + "%");
      return;
    }
    current++;
  }

  if (state.dehumidifierPower) {
    if (current == index) {
      printPadded("DEHUMIDIFY ON");
      lcd.setCursor(0, 1);
      printPadded("Target " + String(state.dehumidifierHumidity) + "%");
      return;
    }
    current++;
  }

  if (state.purifierPower) {
    if (current == index) {
      printPadded("PURIFIER MOTOR");
      lcd.setCursor(0, 1);
      printPadded("Speed " + String(state.purifierSpeed));
      return;
    }
    current++;
  }

  if (state.washingPower && current == index) {
    printPadded("WASHING MOTOR ON");
    lcd.setCursor(0, 1);
    printPadded("Power ON");
  }
}

void refreshDisplayCycle() {
  if (millis() - lastDisplayUpdate < DISPLAY_INTERVAL_MS) return;

  int count = activeDeviceCount();
  displayIndex = count > 0 ? (displayIndex + 1) % count : 0;
  lastDisplayUpdate = millis();
  updateDisplay();
}

void updateDisplay() {
  int count = activeDeviceCount();
  lcd.setCursor(0, 0);

  if (count == 0) {
    printPadded("ALL DEVICES OFF");
    lcd.setCursor(0, 1);
    printPadded("");
    return;
  }

  if (displayIndex >= count) displayIndex = 0;
  printActiveDeviceByIndex(displayIndex);
}

void clearDemoState() {
  state.moodPower = 0;
  state.airconPower = 0;
  state.humidifierPower = 0;
  state.dehumidifierPower = 0;
  state.purifierPower = 0;
  state.washingPower = 0;
}

void runManualDemo() {
  static int demoMode = 0;
  demoMode = (demoMode + 1) % 8;
  clearDemoState();

  // 버튼 순서:
  // 에어컨 1단 -> 2단 -> 3단 -> 공기청정기 1단 -> 2단 -> 3단
  // -> 세탁기 ON -> 전체 OFF
  if (demoMode >= 1 && demoMode <= 3) {
    state.airconPower = 1;
    state.airconFan = demoMode;
  } else if (demoMode >= 4 && demoMode <= 6) {
    state.purifierPower = 1;
    state.purifierSpeed = demoMode - 3;
  } else if (demoMode == 7) {
    state.washingPower = 1;
  }

  applyOutputs();
}
