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
const int STEPPER_IN1 = 8;
const int STEPPER_IN2 = 9;
const int STEPPER_IN3 = 10;
const int STEPPER_IN4 = 11;
const int AIR_PURIFIER_LED_PIN = 12;
const int CONNECTION_LED_PIN = 13;

const int STEPS_PER_REVOLUTION = 2048;
Stepper modeStepper(STEPS_PER_REVOLUTION, STEPPER_IN1, STEPPER_IN3, STEPPER_IN2, STEPPER_IN4);
LiquidCrystal_I2C lcd(0x27, 16, 2);

String serialLine = "";
int currentModePosition = 0;

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

  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(RGB_R_PIN, OUTPUT);
  pinMode(RGB_G_PIN, OUTPUT);
  pinMode(RGB_B_PIN, OUTPUT);
  pinMode(HUMIDIFIER_PIN, OUTPUT);
  pinMode(DEHUMIDIFIER_LED_PIN, OUTPUT);
  pinMode(AIR_PURIFIER_LED_PIN, OUTPUT);
  pinMode(CONNECTION_LED_PIN, OUTPUT);

  modeStepper.setSpeed(10);
  lcd.init();
  lcd.backlight();
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

  // 현장에서 앱 연결이 어려울 때 버튼으로 시연 모드를 순환합니다.
  static bool previousButton = HIGH;
  bool currentButton = digitalRead(BUTTON_PIN);
  if (previousButton == HIGH && currentButton == LOW) {
    runManualDemo();
    delay(250);
  }
  previousButton = currentButton;
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
  applyModeStepper();
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

void applyModeStepper() {
  int target = 0;
  if (state.airconPower) target = 1;
  if (state.purifierPower) target = 2;
  if (state.humidifierPower) target = 3;
  if (state.dehumidifierPower) target = 4;

  int delta = target - currentModePosition;
  if (delta != 0) {
    modeStepper.step(delta * 256);
    currentModePosition = target;
  }
}

void updateDisplay() {
  lcd.clear();
  lcd.setCursor(0, 0);
  if (state.humidifierPower) {
    lcd.print("HUMIDIFIER ON");
  } else if (state.dehumidifierPower) {
    lcd.print("DRY MODE ON");
  } else if (state.airconPower) {
    lcd.print("AIRCON ON ");
    lcd.print(state.airconTemp);
    lcd.print("C");
  } else if (state.purifierPower) {
    lcd.print("AIR CLEAN ON");
  } else if (state.moodPower) {
    lcd.print("MOOD LIGHT ON");
  } else {
    lcd.print("ALL DEVICES OFF");
  }

  lcd.setCursor(0, 1);
  lcd.print("Target H:");
  lcd.print(state.humidifierPower ? state.humidifierHumidity : state.dehumidifierHumidity);
  lcd.print("%");
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
