#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Stepper.h>

// Arduino UNO pin map
const int BUTTON_PIN = 2;
const int RGB_R_PIN = 3;
const int HUMIDIFIER_PIN = 4;
const int RGB_G_PIN = 5;
const int RGB_B_PIN = 6;
const int DEHUMIDIFIER_LED_PIN = 7;
const int AIRCON_STEPPER_IN1 = 8;
const int AIRCON_STEPPER_IN2 = 9;
const int AIRCON_STEPPER_IN3 = 10;
const int AIRCON_STEPPER_IN4 = 11;
const int AIR_PURIFIER_LED_PIN = 12;
const int CONNECTION_LED_PIN = 13;
const int PURIFIER_STEPPER_IN1 = A0;
const int PURIFIER_STEPPER_IN2 = A1;
const int PURIFIER_STEPPER_IN3 = A2;
const int PURIFIER_STEPPER_IN4 = A3;

const int STEPS_PER_REVOLUTION = 2048;
Stepper airconStepper(STEPS_PER_REVOLUTION, AIRCON_STEPPER_IN1, AIRCON_STEPPER_IN3, AIRCON_STEPPER_IN2, AIRCON_STEPPER_IN4);
Stepper purifierStepper(STEPS_PER_REVOLUTION, PURIFIER_STEPPER_IN1, PURIFIER_STEPPER_IN3, PURIFIER_STEPPER_IN2, PURIFIER_STEPPER_IN4);
LiquidCrystal_I2C lcd(0x27, 16, 2);

String serialLine = "";
int displayIndex = 0;
unsigned long lastDisplayUpdate = 0;
const unsigned long DISPLAY_INTERVAL_MS = 2500;
unsigned long lastAirconStep = 0;
unsigned long lastPurifierStep = 0;

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
} state;

void setup() {
  Serial.begin(9600);
  Wire.begin();

  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(RGB_R_PIN, OUTPUT);
  pinMode(RGB_G_PIN, OUTPUT);
  pinMode(RGB_B_PIN, OUTPUT);
  pinMode(HUMIDIFIER_PIN, OUTPUT);
  pinMode(DEHUMIDIFIER_LED_PIN, OUTPUT);
  pinMode(AIR_PURIFIER_LED_PIN, OUTPUT);
  pinMode(CONNECTION_LED_PIN, OUTPUT);

  airconStepper.setSpeed(15);
  purifierStepper.setSpeed(15);

  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("MOMent Ready");
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

  // 앱 연결이 어려울 때 버튼으로 시연 모드를 순환합니다.
  static bool previousButton = HIGH;
  bool currentButton = digitalRead(BUTTON_PIN);
  if (previousButton == HIGH && currentButton == LOW) {
    runManualDemo();
    delay(250);
  }
  previousButton = currentButton;

  runContinuousSteppers();
  refreshDisplayCycle();
}

void handleCommand(String command) {
  if (!command.startsWith("SYNC;")) {
    return;
  }

  parseSection(command, "ML=", state.moodPower, state.moodBrightness, state.moodColor);
  parseSection(command, "AC=", state.airconPower, state.airconTemp, state.airconFan);
  parseSection(command, "HU=", state.humidifierPower, state.humidifierHumidity, state.humidifierIntensity);
  parseSection(command, "DH=", state.dehumidifierPower, state.dehumidifierHumidity, state.dehumidifierIntensity);
  parseSection(command, "AP=", state.purifierPower, state.purifierSpeed, state.purifierMode);

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

void applyOutputs() {
  applyMoodLight();
  digitalWrite(HUMIDIFIER_PIN, state.humidifierPower ? HIGH : LOW);
  digitalWrite(DEHUMIDIFIER_LED_PIN, state.dehumidifierPower ? HIGH : LOW);
  digitalWrite(AIR_PURIFIER_LED_PIN, state.purifierPower ? HIGH : LOW);
  displayIndex = 0;
  lastDisplayUpdate = 0;
  updateDisplay();
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

int stepIntervalMs(int speedLevel) {
  int level = constrain(speedLevel, 1, 3);
  if (level == 1) return 7;
  if (level == 2) return 4;
  return 2;
}

void runContinuousSteppers() {
  unsigned long now = millis();

  if (state.airconPower) {
    int fanLevel = constrain(state.airconFan, 1, 3);
    if (now - lastAirconStep >= (unsigned long)stepIntervalMs(fanLevel)) {
      airconStepper.step(1);
      lastAirconStep = now;
    }
  }

  if (state.purifierPower) {
    int purifierLevel = constrain(state.purifierSpeed, 1, 3);
    if (state.purifierMode == 2) {
      purifierLevel = 3;
    }
    
    if (now - lastPurifierStep >= (unsigned long)stepIntervalMs(purifierLevel)) {
      purifierStepper.step(1);
      lastPurifierStep = now;
    }
  }
}

int activeDeviceCount() {
  int count = 0;
  if (state.moodPower) count++;
  if (state.airconPower) count++;
  if (state.humidifierPower) count++;
  if (state.dehumidifierPower) count++;
  if (state.purifierPower) count++;
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
      printPadded("AIRCON ON");
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
      printPadded("Target " + String(state.humidifierHumidity) + "% Lv" + String(state.humidifierIntensity));
      return;
    }
    current++;
  }

  if (state.dehumidifierPower) {
    if (current == index) {
      printPadded("DEHUMIDIFY ON");
      lcd.setCursor(0, 1);
      printPadded("Target " + String(state.dehumidifierHumidity) + "% Lv" + String(state.dehumidifierIntensity));
      return;
    }
    current++;
  }

  if (state.purifierPower) {
    if (current == index) {
      printPadded("AIR CLEAN ON");
      lcd.setCursor(0, 1);
      printPadded("Speed " + String(state.purifierSpeed) + " Mode " + String(state.purifierMode));
      return;
    }
  }
}

void refreshDisplayCycle() {
  if (millis() - lastDisplayUpdate < DISPLAY_INTERVAL_MS) {
    return;
  }

  int count = activeDeviceCount();
  if (count > 0) {
    displayIndex = (displayIndex + 1) % count;
  } else {
    displayIndex = 0;
  }
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

  if (displayIndex >= count) {
    displayIndex = 0;
  }
  printActiveDeviceByIndex(displayIndex);
}

void runManualDemo() {
  static int demoMode = 0;
  demoMode = (demoMode + 1) % 5;

  state.moodPower = demoMode == 1;
  state.airconPower = demoMode == 2;
  state.humidifierPower = demoMode == 3;
  state.purifierPower = demoMode == 4;
  state.dehumidifierPower = 0;
  state.moodBrightness = 70;
  state.moodColor = demoMode % 4;
  state.airconTemp = 24;
  state.humidifierHumidity = 55;
  applyOutputs();
}
