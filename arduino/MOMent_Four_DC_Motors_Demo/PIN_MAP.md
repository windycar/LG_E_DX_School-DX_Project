# MOMent DC 모터 4개 핀맵

| Arduino UNO | ULN2003 입력 | ULN2003 출력 | 가전 | 제어 방식 |
|---|---|---|---|---|
| D9 | IN1 | OUT1 | 에어컨 DC 모터 | OFF, 1단, 2단, 3단 |
| D10 | IN2 | OUT2 | 공기청정기 DC 모터 | OFF, 1단, 2단, 3단 |
| D11 | IN3 | OUT3 | 세탁기 DC 모터 | ON/OFF |
| D8 | IN4 | OUT4 | 건조기 DC 모터 | ON/OFF |
| GND | GND(-) | - | 공통 접지 | Arduino·외부 전원 공통 |

## 제습기 상태 LED 및 기타 장치

| Arduino UNO | 부품 | 연결 | 동작 |
|---|---|---|---|
| D7 | 빨간 LED | D7 → 220Ω 저항 → LED(+) / LED(-) → GND | 제습기 OFF일 때 켜짐 |
| D12 | 초록 LED | D12 → 220Ω 저항 → LED(+) / LED(-) → GND | 제습기 ON일 때 켜짐 |
| D4 | 가습기 제어 DIN | D4 → 가습기 모듈 DIN | 가습기 ON/OFF |
| A4 | I2C LCD SDA | LCD SDA | 상태 표시 |
| A5 | I2C LCD SCL | LCD SCL | 상태 표시 |
| 5V | I2C LCD VCC | LCD VCC | LCD 전원 |
| GND | 공통 GND | LCD·LED·모듈 GND | 공통 접지 |

## 모터 전원 연결

| 가전 모터 | 모터 첫 번째 선 | 모터 두 번째 선 |
|---|---|---|
| 에어컨 | 외부 5V(+) | ULN2003 OUT1 |
| 공기청정기 | 외부 5V(+) | ULN2003 OUT2 |
| 세탁기 | 외부 5V(+) | ULN2003 OUT3 |
| 건조기 | 외부 5V(+) | ULN2003 OUT4 |

## 전원 연결

- ULN2003 `COM` → 외부 5V(+)
- ULN2003 `GND(-)` → 외부 5V(-)
- Arduino `GND` → 외부 5V(-)
- 네 모터의 전원은 Arduino 5V 핀이 아닌 외부 5V 전원에서 공급
- 외부 전원은 네 모터의 합산 기동 전류를 감당할 수 있어야 함

## 가습기·제습기 동시 작동 방지

- 가습기를 켜면 제습기는 자동으로 OFF
- 제습기를 켜면 가습기는 자동으로 OFF
- 제습기 OFF: 빨간 LED ON, 초록 LED OFF
- 제습기 ON: 빨간 LED OFF, 초록 LED ON
- 백엔드 명령과 Arduino 스케치 양쪽에서 동시에 켜지는 상황을 차단
