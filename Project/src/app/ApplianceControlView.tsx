import { API_BASE_URL } from "./api";
import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw, ShoppingBag, Usb, X } from "lucide-react";
import { AppUser, Screen } from "./types";
import { BottomNav } from "./App";

type ApplianceKey = "moodLight" | "aircon" | "humidifier" | "dehumidifier" | "airPurifier";
type ApplianceState = Record<ApplianceKey, boolean>;
type ApplianceSettingsState = Record<ApplianceKey, any>;
type ArduinoSerialStatus = {
  connected: boolean;
  port: string | null;
  last_command: string | null;
  last_error: string | null;
};

const DEFAULT_APPLIANCE_POWER: ApplianceState = {
  moodLight: false,
  aircon: true,
  humidifier: false,
  dehumidifier: false,
  airPurifier: true,
};

const DEFAULT_APPLIANCE_SETTINGS: ApplianceSettingsState = {
  moodLight: { brightness: 50, color: "따뜻한 화이트", power: false },
  aircon: { temp: 24, mode: "냉방", fan: 2, power: true },
  humidifier: { humidity: 55, intensity: 2, power: false },
  dehumidifier: { humidity: 50, intensity: 2, power: false },
  airPurifier: { speed: 2, mode: "자동", power: true },
};

const APPLIANCE_LIST: Array<{ key: ApplianceKey; name: string; icon: string }> = [
  { key: "moodLight", name: "무드등", icon: "💡" },
  { key: "aircon", name: "에어컨", icon: "❄️" },
  { key: "humidifier", name: "가습기", icon: "💧" },
  { key: "dehumidifier", name: "제습기", icon: "🌊" },
  { key: "airPurifier", name: "공기청정기", icon: "💨" },
];

const getUserId = (user?: AppUser | null) => (user as any)?.id || user?.user_id;

const buildAppliancePayload = (
  userId: number | undefined,
  power: ApplianceState,
  settings: ApplianceSettingsState,
) => Object.keys(settings).map((key) => ({
  user_id: userId,
  appliance_name: key,
  control_command: JSON.stringify({ ...settings[key as ApplianceKey], power: power[key as ApplianceKey] }),
  execution_status: power[key as ApplianceKey] ? "ON" : "OFF",
}));

const hydrateAppliances = (rows: any[]) => {
  const power = { ...DEFAULT_APPLIANCE_POWER };
  const settings: ApplianceSettingsState = {
    moodLight: { ...DEFAULT_APPLIANCE_SETTINGS.moodLight },
    aircon: { ...DEFAULT_APPLIANCE_SETTINGS.aircon },
    humidifier: { ...DEFAULT_APPLIANCE_SETTINGS.humidifier },
    dehumidifier: { ...DEFAULT_APPLIANCE_SETTINGS.dehumidifier },
    airPurifier: { ...DEFAULT_APPLIANCE_SETTINGS.airPurifier },
  };

  rows.forEach((row) => {
    const key = row.appliance_name as ApplianceKey;
    if (!settings[key]) return;

    let command = {};
    try {
      command = JSON.parse(row.control_command || "{}");
    } catch {
      command = {};
    }

    const isOn = row.execution_status === "ON";
    power[key] = isOn;
    settings[key] = { ...settings[key], ...command, power: isOn };
  });

  return { power, settings };
};

const fetchApplianceSettings = async (userId?: number | null) => {
  if (!userId) {
    return { power: { ...DEFAULT_APPLIANCE_POWER }, settings: { ...DEFAULT_APPLIANCE_SETTINGS } };
  }

  const res = await fetch(`${API_BASE_URL}/api/appliances/${userId}`);
  if (!res.ok) throw new Error("Failed to load appliance settings");
  const data = await res.json();
  return hydrateAppliances(data.settings || []);
};

const saveApplianceSettings = async (
  userId: number | undefined,
  power: ApplianceState,
  settings: ApplianceSettingsState,
) => {
  if (!userId) return;

  await fetch(`${API_BASE_URL}/api/appliances/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      settings: buildAppliancePayload(userId, power, settings),
    }),
  });
};

const syncArduinoSettings = async (
  userId: number | undefined,
  power: ApplianceState,
  settings: ApplianceSettingsState,
) => {
  const res = await fetch(`${API_BASE_URL}/api/appliances/arduino/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ settings: buildAppliancePayload(userId, power, settings) }),
  });
  const data = await res.json();
  if (!res.ok || data.status !== "Success") {
    throw new Error(data.detail || data.message || "Arduino 설정 전송에 실패했습니다.");
  }
  return data.serial as ArduinoSerialStatus;
};

export default function ApplianceControlView({
  user,
  onNavigate,
}: {
  user?: AppUser | null;
  onNavigate: (s: Screen) => void;
}) {
  const userId = getUserId(user);
  const [appliances, setAppliances] = useState<ApplianceState>({ ...DEFAULT_APPLIANCE_POWER });
  const [applianceSettings, setApplianceSettings] = useState<ApplianceSettingsState>({ ...DEFAULT_APPLIANCE_SETTINGS });
  const [selectedAppliance, setSelectedAppliance] = useState<ApplianceKey | null>(null);
  const [arduinoStatus, setArduinoStatus] = useState<ArduinoSerialStatus>({
    connected: false,
    port: null,
    last_command: null,
    last_error: null,
  });
  const [arduinoMessage, setArduinoMessage] = useState("로컬 시연 시 USB로 Arduino를 연결하세요.");
  const [arduinoBusy, setArduinoBusy] = useState(false);

  useEffect(() => {
    fetchApplianceSettings(userId)
      .then(({ power, settings }) => {
        setAppliances(power);
        setApplianceSettings(settings);
      })
      .catch((error) => console.error("가전 설정 조회 실패:", error));
  }, [userId]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/appliances/arduino/status`)
      .then((res) => res.json())
      .then((data) => {
        if (data.serial) setArduinoStatus(data.serial);
      })
      .catch(() => {
        // Render 배포 환경에서는 로컬 USB를 조회할 수 없습니다.
      });
  }, []);

  const persistAppliances = (nextPower = appliances, nextSettings = applianceSettings) => {
    saveApplianceSettings(userId, nextPower, nextSettings).catch((error) => {
      console.error("가전 설정 저장 실패:", error);
    });
  };

  const updateSetting = (key: ApplianceKey, nextValue: any) => {
    setApplianceSettings((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...nextValue },
    }));
  };

  const toggleAppliance = (key: ApplianceKey) => {
    const nextPower = { ...appliances, [key]: !appliances[key] };
    const nextSettings = {
      ...applianceSettings,
      [key]: { ...applianceSettings[key], power: nextPower[key] },
    };
    setAppliances(nextPower);
    setApplianceSettings(nextSettings);
    persistAppliances(nextPower, nextSettings);
    if (arduinoStatus.connected) {
      syncArduinoSettings(userId, nextPower, nextSettings)
        .then((status) => setArduinoStatus(status))
        .catch((error) => setArduinoMessage(error.message));
    }
  };

  const connectArduino = async () => {
    setArduinoBusy(true);
    setArduinoMessage("Arduino USB 포트를 찾는 중입니다.");
    try {
      const res = await fetch(`${API_BASE_URL}/api/appliances/arduino/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baudrate: 9600 }),
      });
      const data = await res.json();
      if (!res.ok || data.status !== "Success") {
        throw new Error(data.detail || data.message || "Arduino 연결에 실패했습니다.");
      }
      setArduinoStatus(data.serial);
      setArduinoMessage(`${data.serial.port} 포트에 연결되었습니다.`);
    } catch (error) {
      setArduinoMessage(error instanceof Error ? error.message : "Arduino 연결에 실패했습니다.");
    } finally {
      setArduinoBusy(false);
    }
  };

  const sendCurrentSettings = async () => {
    setArduinoBusy(true);
    setArduinoMessage("현재 가전 설정을 Arduino로 전송하는 중입니다.");
    try {
      await saveApplianceSettings(userId, appliances, applianceSettings);
      const status = await syncArduinoSettings(userId, appliances, applianceSettings);
      setArduinoStatus(status);
      setArduinoMessage("현재 가전 설정을 Arduino 시연 장치에 전송했습니다.");
    } catch (error) {
      setArduinoMessage(error instanceof Error ? error.message : "Arduino 설정 전송에 실패했습니다.");
    } finally {
      setArduinoBusy(false);
    }
  };

  const getApplianceStatus = (key: ApplianceKey) => {
    const settings = applianceSettings[key];
    if (!settings) return "설정 없음";

    switch (key) {
      case "moodLight":
        return `${settings.color} • 밝기 ${settings.brightness}%`;
      case "aircon":
        return `목표 온도 ${settings.temp}℃ • 풍량 ${settings.fan}`;
      case "humidifier":
      case "dehumidifier":
        return `목표 습도 ${settings.humidity}% • 세기 ${settings.intensity}`;
      case "airPurifier":
        return `${settings.mode} • 풍량 ${settings.speed}`;
      default:
        return "설정 없음";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-5 pt-12 pb-6" style={{ background: "linear-gradient(160deg, #FFE8EE 0%, #FFF5F7 100%)" }}>
        <h2 className="text-2xl font-bold" style={{ fontFamily: "'Nanum Myeongjo', serif", color: "#2D1B33" }}>
          LG ThinQ 가전 제어
        </h2>
        <p className="text-sm text-muted-foreground mt-1">집안의 모든 가전을 한 곳에서 제어하세요</p>
      </div>

      <div className="px-5 py-5 flex-1 overflow-y-auto pb-20">
        <div className="mb-4 rounded-2xl p-4 border border-border bg-card">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: arduinoStatus.connected ? "rgba(46,157,98,0.12)" : "rgba(77,138,240,0.1)" }}
            >
              <Usb size={20} style={{ color: arduinoStatus.connected ? "#2E9D62" : "#4D8AF0" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-foreground">Arduino 로컬 시연 장치</p>
                <span
                  className="text-[11px] px-2 py-1 rounded-full font-semibold"
                  style={{
                    background: arduinoStatus.connected ? "rgba(46,157,98,0.12)" : "var(--secondary)",
                    color: arduinoStatus.connected ? "#2E9D62" : "var(--muted-foreground)",
                  }}
                >
                  {arduinoStatus.connected ? `연결됨 ${arduinoStatus.port || ""}` : "연결 안 됨"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{arduinoMessage}</p>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  onClick={connectArduino}
                  disabled={arduinoBusy}
                  className="inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border border-border disabled:opacity-50"
                >
                  <Usb size={14} />
                  USB 연결
                </button>
                <button
                  onClick={sendCurrentSettings}
                  disabled={arduinoBusy || !arduinoStatus.connected}
                  className="inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
                  style={{ background: "#4D8AF0" }}
                >
                  <RefreshCw size={14} className={arduinoBusy ? "animate-spin" : ""} />
                  현재 설정 전송
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {APPLIANCE_LIST.map((app) => (
            <div key={app.key} className="bg-card rounded-2xl p-4 border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{app.icon}</span>
                  <div>
                    <p className="font-medium text-sm text-foreground">{app.name}</p>
                    <p className="text-xs text-muted-foreground">{getApplianceStatus(app.key)}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleAppliance(app.key)}
                  className="relative w-12 h-6 rounded-full transition-all"
                  style={{ background: appliances[app.key] ? "#C94E70" : "#E5E7EB" }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                    style={{ transform: appliances[app.key] ? "translateX(24px)" : "translateX(0)" }}
                  />
                </button>
              </div>
              {appliances[app.key] && (
                <button
                  onClick={() => setSelectedAppliance(app.key)}
                  className="w-full mt-2 py-2 rounded-xl text-xs font-medium border border-border text-muted-foreground hover:bg-secondary/50 transition-colors"
                >
                  상세 설정
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl p-4 border border-border bg-card">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(201,78,112,0.1)", color: "#C94E70" }}>
              <ShoppingBag size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">LG 가전을 연동하여 더 많은 가전을 연결해보세요</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                에어컨, 공기청정기, 가습기처럼 임산부 생활 환경에 필요한 가전을 확장하면 더 정밀한 맞춤 제어가 가능합니다.
              </p>
              <a
                href="https://www.lge.co.kr/bestshop/store-finder/"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white"
                style={{ background: "#C94E70" }}
              >
                LG 가전 보러가기
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {selectedAppliance && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setSelectedAppliance(null)}>
          <div className="bg-background rounded-t-3xl p-5 w-full max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">
                {APPLIANCE_LIST.find((a) => a.key === selectedAppliance)?.name} 설정
              </h3>
              <button onClick={() => setSelectedAppliance(null)}>
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            {selectedAppliance === "moodLight" && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">밝기: {applianceSettings.moodLight.brightness}%</p>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={applianceSettings.moodLight.brightness}
                    onChange={(e) => updateSetting("moodLight", { brightness: parseInt(e.target.value) })}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: "#C94E70" }}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">색상</p>
                  <div className="grid grid-cols-2 gap-2">
                    {["따뜻한 화이트", "차가운 화이트", "자연광", "수면 모드"].map((color) => (
                      <button
                        key={color}
                        onClick={() => updateSetting("moodLight", { color })}
                        className="py-2 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: applianceSettings.moodLight.color === color ? "rgba(201,78,112,0.1)" : "var(--secondary)",
                          border: `1.5px solid ${applianceSettings.moodLight.color === color ? "#C94E70" : "transparent"}`,
                          color: applianceSettings.moodLight.color === color ? "#C94E70" : "var(--muted-foreground)",
                        }}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedAppliance === "aircon" && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">목표 온도</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateSetting("aircon", { temp: Math.max(16, applianceSettings.aircon.temp - 1) })}
                      className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="text-2xl font-bold flex-1 text-center" style={{ color: "#C94E70" }}>
                      {applianceSettings.aircon.temp}℃
                    </span>
                    <button
                      onClick={() => updateSetting("aircon", { temp: Math.min(30, applianceSettings.aircon.temp + 1) })}
                      className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">풍량</p>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((fan) => (
                      <button
                        key={fan}
                        onClick={() => updateSetting("aircon", { fan })}
                        className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: applianceSettings.aircon.fan === fan ? "rgba(201,78,112,0.1)" : "var(--secondary)",
                          border: `1.5px solid ${applianceSettings.aircon.fan === fan ? "#C94E70" : "transparent"}`,
                          color: applianceSettings.aircon.fan === fan ? "#C94E70" : "var(--muted-foreground)",
                        }}
                      >
                        {fan}단
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {(selectedAppliance === "humidifier" || selectedAppliance === "dehumidifier") && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">
                    목표 습도: {applianceSettings[selectedAppliance].humidity}%
                  </p>
                  <input
                    type="range"
                    min={selectedAppliance === "humidifier" ? "30" : "30"}
                    max={selectedAppliance === "humidifier" ? "70" : "60"}
                    value={applianceSettings[selectedAppliance].humidity}
                    onChange={(e) => updateSetting(selectedAppliance, { humidity: parseInt(e.target.value) })}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: "#C94E70" }}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">세기</p>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((intensity) => (
                      <button
                        key={intensity}
                        onClick={() => updateSetting(selectedAppliance, { intensity })}
                        className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: applianceSettings[selectedAppliance].intensity === intensity ? "rgba(201,78,112,0.1)" : "var(--secondary)",
                          border: `1.5px solid ${applianceSettings[selectedAppliance].intensity === intensity ? "#C94E70" : "transparent"}`,
                          color: applianceSettings[selectedAppliance].intensity === intensity ? "#C94E70" : "var(--muted-foreground)",
                        }}
                      >
                        {intensity}단
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedAppliance === "airPurifier" && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">모드</p>
                  <div className="grid grid-cols-2 gap-2">
                    {["자동", "수면", "강력"].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => updateSetting("airPurifier", { mode })}
                        className="py-2 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: applianceSettings.airPurifier.mode === mode ? "rgba(201,78,112,0.1)" : "var(--secondary)",
                          border: `1.5px solid ${applianceSettings.airPurifier.mode === mode ? "#C94E70" : "transparent"}`,
                          color: applianceSettings.airPurifier.mode === mode ? "#C94E70" : "var(--muted-foreground)",
                        }}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">풍량</p>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => updateSetting("airPurifier", { speed })}
                        className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: applianceSettings.airPurifier.speed === speed ? "rgba(201,78,112,0.1)" : "var(--secondary)",
                          border: `1.5px solid ${applianceSettings.airPurifier.speed === speed ? "#C94E70" : "transparent"}`,
                          color: applianceSettings.airPurifier.speed === speed ? "#C94E70" : "var(--muted-foreground)",
                        }}
                      >
                        {speed}단
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                persistAppliances();
                if (arduinoStatus.connected) {
                  syncArduinoSettings(userId, appliances, applianceSettings)
                    .then((status) => {
                      setArduinoStatus(status);
                      setArduinoMessage("상세 설정을 Arduino 시연 장치에 전송했습니다.");
                    })
                    .catch((error) => setArduinoMessage(error.message));
                }
                setSelectedAppliance(null);
              }}
              className="w-full mt-4 py-3 rounded-2xl font-semibold text-white"
              style={{ background: "#C94E70" }}
            >
              적용하기
            </button>
          </div>
        </div>
      )}

      <BottomNav current="appliance" onNavigate={onNavigate} />
    </div>
  );
}
