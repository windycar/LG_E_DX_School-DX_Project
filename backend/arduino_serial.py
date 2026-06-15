import json
import threading
import time
from typing import Any


class ArduinoSerialBridge:
    def __init__(self):
        self._serial = None
        self._port = None
        self._lock = threading.Lock()
        self._last_command = None
        self._last_response = None
        self._last_error = None

    def _load_serial(self):
        try:
            import serial
            from serial.tools import list_ports
        except ImportError as exc:
            raise RuntimeError("pyserial이 설치되어 있지 않습니다. pip install pyserial을 실행해 주세요.") from exc
        return serial, list_ports

    def available_ports(self):
        _, list_ports = self._load_serial()
        return [
            {
                "device": port.device,
                "description": port.description,
                "manufacturer": port.manufacturer,
            }
            for port in list_ports.comports()
        ]

    def _find_arduino_port(self):
        ports = self.available_ports()
        keywords = ("arduino", "ch340", "usb serial", "usb-serial", "wch", "cp210")
        for port in ports:
            text = f"{port.get('description') or ''} {port.get('manufacturer') or ''}".lower()
            if any(keyword in text for keyword in keywords):
                return port["device"]
        return ports[0]["device"] if ports else None

    def connect(self, port: str | None = None, baudrate: int = 9600):
        serial, _ = self._load_serial()
        target_port = port or self._find_arduino_port()
        if not target_port:
            raise RuntimeError("연결 가능한 Arduino USB 포트를 찾지 못했습니다.")

        with self._lock:
            if self._serial and self._serial.is_open:
                self._serial.close()
            self._serial = serial.Serial(target_port, baudrate=baudrate, timeout=0.25)
            self._port = target_port
            self._last_response = None
            self._last_error = None
            # Arduino Uno opens the bootloader when the serial port toggles DTR.
            # Wait until setup(), including the I2C LCD initialization, has finished.
            time.sleep(4)
        return self.status()

    def disconnect(self):
        with self._lock:
            if self._serial and self._serial.is_open:
                self._serial.close()
            self._serial = None
            self._port = None
        return self.status()

    def status(self):
        connected = bool(self._serial and self._serial.is_open)
        return {
            "connected": connected,
            "port": self._port if connected else None,
            "last_command": self._last_command,
            "last_response": self._last_response,
            "last_error": self._last_error,
        }

    def send_line(self, command: str):
        with self._lock:
            if not self._serial or not self._serial.is_open:
                raise RuntimeError("Arduino가 연결되어 있지 않습니다.")
            try:
                self._serial.reset_input_buffer()
                self._serial.write(f"{command}\n".encode("utf-8"))
                self._serial.flush()
                response = ""
                deadline = time.monotonic() + 3
                while time.monotonic() < deadline:
                    response = self._serial.readline().decode("utf-8", errors="replace").strip()
                    if response:
                        break
                if response != "OK":
                    raise RuntimeError(
                        f"Arduino 적용 확인 응답이 없습니다. 수신값: {response or '없음'}"
                    )
                self._last_command = command
                self._last_response = response
                self._last_error = None
            except Exception as exc:
                self._last_error = str(exc)
                raise RuntimeError(f"Arduino 명령 전송 실패: {exc}") from exc
        return self.status()


def _int_value(value: Any, default: int):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _power_value(status: str | None, command: dict[str, Any]):
    if "power" in command:
        return 1 if bool(command["power"]) else 0
    return 1 if str(status or "").upper() == "ON" else 0


def _color_code(color: str | None):
    colors = {
        "따뜻한 화이트": 0,
        "차가운 화이트": 1,
        "자연광": 2,
        "수면 모드": 3,
        "독서 모드": 4,
        "휴식 모드": 5,
        "집중 모드": 6,
        "명상 모드": 7,
        "새벽 수유": 8,
        "로맨틱 모드": 9,
        "사용자 RGB": 10,
    }
    return colors.get(color or "", 0)


def _mode_code(mode: str | None):
    modes = {"자동": 0, "수면": 1, "강력": 2}
    return modes.get(mode or "", 0)


def build_sync_command(settings):
    values = {
        "moodLight": {"power": 0, "brightness": 50, "color": 0, "red": 255, "green": 128, "blue": 64},
        "aircon": {"power": 0, "temp": 24, "fan": 1},
        "humidifier": {"power": 0, "humidity": 55, "intensity": 1},
        "dehumidifier": {"power": 0, "humidity": 50, "intensity": 1},
        "airPurifier": {"power": 0, "speed": 1, "mode": 0},
        "washingMachine": {"power": 0},
        "dryer": {"power": 0},
    }

    for item in settings:
        name = item.appliance_name
        if name not in values:
            continue
        try:
            command = json.loads(item.control_command or "{}")
        except json.JSONDecodeError:
            command = {}

        values[name]["power"] = _power_value(item.execution_status, command)
        if name == "moodLight":
            values[name]["brightness"] = _int_value(command.get("brightness"), 50)
            values[name]["color"] = _color_code(command.get("color"))
            values[name]["red"] = max(0, min(255, _int_value(command.get("red"), 255)))
            values[name]["green"] = max(0, min(255, _int_value(command.get("green"), 128)))
            values[name]["blue"] = max(0, min(255, _int_value(command.get("blue"), 64)))
        elif name == "aircon":
            values[name]["temp"] = _int_value(command.get("temp"), 24)
            values[name]["fan"] = _int_value(command.get("fan"), 1)
        elif name in ("humidifier", "dehumidifier"):
            values[name]["humidity"] = _int_value(command.get("humidity"), 50)
            values[name]["intensity"] = _int_value(command.get("intensity"), 1)
        elif name == "airPurifier":
            values[name]["speed"] = _int_value(command.get("speed"), 1)
            values[name]["mode"] = _mode_code(command.get("mode"))

    # 상반되는 습도 제어 장치가 동시에 동작하지 않도록 제습기를 우선합니다.
    if values["dehumidifier"]["power"]:
        values["humidifier"]["power"] = 0

    return (
        "SYNC"
        f";ML={values['moodLight']['power']},{values['moodLight']['brightness']},{values['moodLight']['color']}"
        f";RGB={values['moodLight']['red']},{values['moodLight']['green']},{values['moodLight']['blue']}"
        f";AC={values['aircon']['power']},{values['aircon']['temp']},{values['aircon']['fan']}"
        f";HU={values['humidifier']['power']},{values['humidifier']['humidity']},{values['humidifier']['intensity']}"
        f";DH={values['dehumidifier']['power']},{values['dehumidifier']['humidity']},{values['dehumidifier']['intensity']}"
        f";AP={values['airPurifier']['power']},{values['airPurifier']['speed']},{values['airPurifier']['mode']}"
        f";WM={values['washingMachine']['power']}"
        f";DR={values['dryer']['power']}"
    )


arduino_bridge = ArduinoSerialBridge()
