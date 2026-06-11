#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// MOMent 최종 시연 버전
const int BUTTON_PIN = 2;
const int RGB_R_PIN = 3;
const int HUMIDIFIER_PIN = 4;
const int RGB_G_PIN = 5;
const int RGB_B_PIN = 6;
const int DEHUMIDIFIER_OFF_RED_LED_PIN = 7;

// ULN2003 모터 채널
const int DRYER_MOTOR_PIN = 8;       // D8  -> IN4, ON/OFF
const int AIRCON_MOTOR_PIN = 9;      // D9  -> IN1, PWM 1·2·3단
const int PURIFIER_MOTOR_PIN = 10;   // D10 -> IN2, PWM 1·2·3단
const int WASHING_MOTOR_PIN = 11;    // D11 -> IN3, ON/OFF

const int DEHUMIDIFIER_ON_GREEN_LED_PIN = 12;
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
  int dryerPower = 0;
} state;

void setup() {
  Serial.begin(9600);
  Wire.begin();

  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(RGB_R_PIN, OUTPUT);
  pinMode(HUMIDIFIER_PIN, OUTPUT);
  pinMode(RGB_G_PIN, OUTPUT);
  pinMode(RGB_B_PIN, OUTPUT);
  pinMode(DEHUMIDIFIER_OFF_RED_LED_PIN, OUTPUT);
  pinMode(DRYER_MOTOR_PIN, OUTPUT);
  pinMode(AIRCON_MOTOR_PIN, OUTPUT);
  pinMode(PURIFIER_MOTOR_PIN, OUTPUT);
  pinMode(WASHING_MOTOR_PIN, OUTPUT);
  pinMode(DEHUMIDIFIER_ON_GREEN_LED_PIN, OUTPUT);
  pinMode(CONNECTION_LED_PIN, OUTPUT);

  stopAllMotors();
  updateDehumidifierLeds();

  lcd.init();
  lcd.backlight();
  lcd.clear();
  printPadded("MOMent 4 Motors");
  lcd.setCursor(0, 1);
  printPadded("USB Serial 9600");
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
  if (!command.startsWith("SYNC;")) return;

  parseTriple(command, "ML=", state.moodPower, state.moodBrightness, state.moodColor);
  parseTriple(command, "AC=", state.airconPower, state.airconTemp, state.airconFan);
  parseTriple(command, "HU=", state.humidifierPower, state.humidifierHumidity, state.humidifierIntensity);
  parseTriple(command, "DH=", state.dehumidifierPower, state.dehumidifierHumidity, state.dehumidifierIntensity);
  parseTriple(command, "AP=", state.purifierPower, state.purifierSpeed, state.purifierMode);
  parseSingle(command, "WM=", state.washingPower);
  parseSingle(command, "DR=", state.dryerPower);

  // 제습기가 ON이면 가습기는 반드시 OFF입니다.
  // 반대로 가습기가 ON이면 제습기는 OFF 상태를 유지합니다.
  if (state.dehumidifierPower) {
    state.humidifierPower = 0;
  } else if (state.humidifierPower) {
    state.dehumidifierPower = 0;
  }

  digitalWrite(CONNECTION_LED_PIN, HIGH);
  applyOutputs();
  Serial.println("OK");
}

void parseTriple(String command, String key, int &first, int &second, int &third) {
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

void parseSingle(String command, String key, int &value) {
  int start = command.indexOf(key);
  if (start < 0) return;
  start += key.length();
  int end = command.indexOf(';', start);
  if (end < 0) end = command.length();
  value = command.substring(start, end).toInt();
}

void applyOutputs() {
  applyMoodLight();
  applyVariableMotor(
    AIRCON_MOTOR_PIN,
    state.airconPower,
    state.airconFan,
    appliedAirconPower,
    appliedAirconLevel
  );
  applyVariableMotor(
    PURIFIER_MOTOR_PIN,
    state.purifierPower,
    state.purifierMode == 2 ? 3 : state.purifierSpeed,
    appliedPurifierPower,
    appliedPurifierLevel
  );

  digitalWrite(WASHING_MOTOR_PIN, state.washingPower ? HIGH : LOW);
  digitalWrite(DRYER_MOTOR_PIN, state.dryerPower ? HIGH : LOW);
  digitalWrite(HUMIDIFIER_PIN, state.humidifierPower ? HIGH : LOW);
  updateDehumidifierLeds();

  displayIndex = 0;
  lastDisplayUpdate = 0;
  updateDisplay();
}

void updateDehumidifierLeds() {
  digitalWrite(DEHUMIDIFIER_OFF_RED_LED_PIN, state.dehumidifierPower ? LOW : HIGH);
  digitalWrite(DEHUMIDIFIER_ON_GREEN_LED_PIN, state.dehumidifierPower ? HIGH : LOW);
}

void applyVariableMotor(int pin, int power, int levelValue, int &appliedPower, int &appliedLevel) {
  if (!power) {
    analogWrite(pin, 0);
    appliedPower = 0;
    appliedLevel = 0;
    return;
  }

  int level = constrain(levelValue, 1, 3);
  int pwmValue = level == 1 ? 150 : (level == 2 ? 205 : 255);

  if (!appliedPower || appliedLevel != level) {
    analogWrite(pin, 255);
    delay(180);
  }

  analogWrite(pin, pwmValue);
  appliedPower = 1;
  appliedLevel = level;
}

void stopAllMotors() {
  digitalWrite(DRYER_MOTOR_PIN, LOW);
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
  if (state.dryerPower) count++;
  return count;
}

void printPadded(const String &text) {
  lcd.print(text);
  for (int i = text.length(); i < 16; i++) lcd.print(" ");
}

void printDevice(int index) {
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
      printPadded("Fan Level " + String(state.airconFan));
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
      printPadded("Speed Level " + String(state.purifierSpeed));
      return;
    }
    current++;
  }
  if (state.washingPower) {
    if (current == index) {
      printPadded("WASHING MOTOR ON");
      lcd.setCursor(0, 1);
      printPadded("Power ON");
      return;
    }
    current++;
  }
  if (state.dryerPower && current == index) {
    printPadded("DRYER MOTOR ON");
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
  printDevice(displayIndex);
}

void clearDemoState() {
  state.moodPower = 0;
  state.airconPower = 0;
  state.humidifierPower = 0;
  state.dehumidifierPower = 0;
  state.purifierPower = 0;
  state.washingPower = 0;
  state.dryerPower = 0;
}

void runManualDemo() {
  static int demoMode = 0;
  demoMode = (demoMode + 1) % 11;
  clearDemoState();

  // 에어컨 1·2·3단 -> 공기청정기 1·2·3단
  // -> 세탁기 ON -> 건조기 ON -> 가습기 ON -> 제습기 ON -> 전체 OFF
  if (demoMode >= 1 && demoMode <= 3) {
    state.airconPower = 1;
    state.airconFan = demoMode;
  } else if (demoMode >= 4 && demoMode <= 6) {
    state.purifierPower = 1;
    state.purifierSpeed = demoMode - 3;
  } else if (demoMode == 7) {
    state.washingPower = 1;
  } else if (demoMode == 8) {
    state.dryerPower = 1;
  } else if (demoMode == 9) {
    state.humidifierPower = 1;
  } else if (demoMode == 10) {
    state.dehumidifierPower = 1;
  }

  applyOutputs();
}
