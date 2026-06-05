#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// Change this to the address found by I2C_LCD_Scanner.
LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("MOMent LCD OK");
  lcd.setCursor(0, 1);
  lcd.print("I2C test");
}

void loop() {
}
