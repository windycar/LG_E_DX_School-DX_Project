#include <Wire.h>

void setup() {
  Wire.begin();
  Serial.begin(9600);
  while (!Serial) {
    ;
  }

  Serial.println("I2C scanner started.");
  Serial.println("UNO wiring: SDA=A4, SCL=A5, VCC=5V, GND=GND");
}

void loop() {
  byte error;
  byte address;
  int foundCount = 0;

  Serial.println("Scanning...");

  for (address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    error = Wire.endTransmission();

    if (error == 0) {
      Serial.print("I2C device found at 0x");
      if (address < 16) {
        Serial.print("0");
      }
      Serial.println(address, HEX);
      foundCount++;
    } else if (error == 4) {
      Serial.print("Unknown error at 0x");
      if (address < 16) {
        Serial.print("0");
      }
      Serial.println(address, HEX);
    }
  }

  if (foundCount == 0) {
    Serial.println("No I2C devices found.");
  } else {
    Serial.println("Scan complete.");
  }

  delay(3000);
}
