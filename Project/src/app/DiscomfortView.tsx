import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle, Search, X } from "lucide-react";
import { AppUser, PartnerStatus, Screen } from "./types";
import { BottomNav } from "./App";
//오늘의 상태 체크 
const API_BASE_URL = "http://localhost:8000";

type ApplianceKey = "moodLight" | "aircon" | "humidifier" | "dehumidifier" | "airPurifier";
type ApplianceState = Record<ApplianceKey, boolean>;
type ApplianceSettingsState = Record<ApplianceKey, any>;

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

const getUserId = (user?: AppUser | null) => (user as any)?.id || user?.user_id;

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
      settings: Object.keys(settings).map((key) => ({
        user_id: userId,
        appliance_name: key,
        control_command: JSON.stringify({ ...settings[key as ApplianceKey], power: power[key as ApplianceKey] }),
        execution_status: power[key as ApplianceKey] ? "ON" : "OFF",
      })),
    }),
  });
};

function PageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 bg-card/90 backdrop-blur-sm sticky top-0 z-10 border-b border-border">
      <button onClick={onBack} className="p-2 rounded-xl hover:bg-secondary transition-colors">
        <ArrowLeft size={20} className="text-foreground" />
      </button>
      <h1 className="font-semibold text-foreground">{title}</h1>
    </div>
  );
}

export default function DiscomfortView({
  user,
  onBack,
  onNavigate,
  onStatusUpdate,
}: {
  user?: AppUser | null;
  onBack: () => void;
  onNavigate?: (s: Screen) => void;
  onStatusUpdate?: (status: PartnerStatus) => void;
}) {
  const userId = getUserId(user);
  const ALL_SYMPTOMS = [
    "입덧", "붓기", "두통", "피로감", "허리통증", "수면장애", "소화불량", "역류 증상",
    "변비", "어지러움", "빈혈", "가슴통증", "손발저림", "다리경련", "치질", "정맥류",
    "잇몸출혈", "코막힘", "코피", "배뇨통", "요실금", "질분비물", "골반통", "좌골신경통"
  ];
  const EMOTIONS = [
    { text: "불안", emoji: "😰" },
    { text: "예민함", emoji: "😤" },
    { text: "우울감", emoji: "😢" },
    { text: "스트레스", emoji: "😫" },
    { text: "외로움", emoji: "😔" },
    { text: "긴장", emoji: "😖" },
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [selSymptoms, setSelSymptoms] = useState<string[]>([]);
  const [selEmotions, setSelEmotions] = useState<string[]>([]);
  const [stress, setStress] = useState(5);
  const [submitted, setSubmitted] = useState(false);
  const [appliances, setAppliances] = useState<ApplianceState>({ ...DEFAULT_APPLIANCE_POWER });
  const [applianceSettings, setApplianceSettings] = useState<ApplianceSettingsState>({ ...DEFAULT_APPLIANCE_SETTINGS });
  const [selectedAppliance, setSelectedAppliance] = useState<string | null>(null);

  useEffect(() => {
    fetchApplianceSettings(userId)
      .then(({ power, settings }) => {
        setAppliances(power);
        setApplianceSettings(settings);
      })
      .catch((error) => console.error("상태체크 가전 설정 조회 실패:", error));
  }, [userId]);

  const persistDiscomfortAppliances = (nextPower = appliances, nextSettings = applianceSettings) => {
    saveApplianceSettings(userId, nextPower, nextSettings).catch((error) => {
      console.error("상태체크 가전 설정 저장 실패:", error);
    });
  };

  const toggleDiscomfortAppliance = (key: ApplianceKey) => {
    const nextPower = { ...appliances, [key]: !appliances[key] };
    const nextSettings = {
      ...applianceSettings,
      [key]: { ...applianceSettings[key], power: nextPower[key] },
    };
    setAppliances(nextPower);
    setApplianceSettings(nextSettings);
    persistDiscomfortAppliances(nextPower, nextSettings);
  };

  const filteredSymptoms = ALL_SYMPTOMS.filter((s) =>
    s.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleArr = (arr: string[], val: string, set: (v: string[]) => void) =>
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  // 🚀 수정 포인트 1: key의 타입을 string에서 ApplianceKey로 변경하여 안전성 확보!
  const getRecs = () => {
    const map: Record<string, { key: ApplianceKey; name: string; action: string; icon: string; reason: string }> = {};
    if (selSymptoms.includes("입덧")) {
      map.airPurifier = { key: "airPurifier", name: "공기청정기", action: "쾌적 모드", icon: "💨", reason: "냄새 차단으로 입덧 완화" };
      map.aircon = { key: "aircon", name: "에어컨", action: "18~20℃ 냉방", icon: "❄️", reason: "시원한 공기로 열기 차단" };
    }
    if (selSymptoms.includes("붓기")) {
      map.dehumidifier = { key: "dehumidifier", name: "제습기", action: "45~50% 유지", icon: "🌊", reason: "붓기 완화를 위한 습도 조절" };
    }
    if (selSymptoms.includes("수면장애")) {
      map.moodLight = { key: "moodLight", name: "무드등", action: "수면 모드", icon: "💡", reason: "편안한 수면 분위기 조성" };
      map.humidifier = { key: "humidifier", name: "가습기", action: "50~60% 유지", icon: "💧", reason: "쾌적한 수면 환경" };
    }
    if (selSymptoms.includes("코막힘") || selSymptoms.includes("코피")) {
      map.airPurifier = { key: "airPurifier", name: "공기청정기", action: "쾌적 모드", icon: "💨", reason: "신선한 공기로 호흡 개선" };
      map.humidifier = { key: "humidifier", name: "가습기", action: "55~60% 유지", icon: "💧", reason: "건조함 완화" };
    }
    if (selEmotions.includes("스트레스") || selEmotions.includes("불안") || stress >= 7) {
      map.moodLight = { key: "moodLight", name: "무드등", action: "이완 모드", icon: "💡", reason: "차분한 조명으로 스트레스 완화" };
      map.airPurifier = { key: "airPurifier", name: "공기청정기", action: "쾌적 모드", icon: "💨", reason: "신선한 공기로 기분 전환" };
    }
    return Object.values(map);
  };

  // 🚀 수정 포인트 2: as ApplianceKey를 명시하여 TS에게 에러를 내지 않도록 지시!
  const handleSubmit = () => {
    const next = { ...appliances };
    getRecs().forEach((r) => { next[r.key as ApplianceKey] = true; });
    const nextSettings = { ...applianceSettings };
    Object.keys(next).forEach((key) => {
      nextSettings[key as ApplianceKey] = { ...nextSettings[key as ApplianceKey], power: next[key as ApplianceKey] };
    });
    setAppliances(next);
    setApplianceSettings(nextSettings);
    persistDiscomfortAppliances(next, nextSettings);
    setSubmitted(true);

    if (onStatusUpdate) {
      onStatusUpdate({
        symptoms: selSymptoms,
        emotions: selEmotions,
        stress,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const APPLIANCE_LIST: { key: ApplianceKey; name: string; icon: string }[] = [
    { key: "moodLight", name: "무드등", icon: "💡" },
    { key: "aircon", name: "에어컨", icon: "❄️" },
    { key: "humidifier", name: "가습기", icon: "💧" },
    { key: "dehumidifier", name: "제습기", icon: "🌊" },
    { key: "airPurifier", name: "공기청정기", icon: "💨" },
  ];

  const getApplianceStatus = (key: ApplianceKey) => {
    const settings = applianceSettings[key];
    if (!settings) return "설정 없음";
    switch (key) {
      case "moodLight":
        return `${settings.color} • 밝기 ${settings.brightness}%`;
      case "airPurifier":
        return `${settings.mode} • 풍량 ${settings.speed}`;
      case "aircon":
        return `목표 온도 ${settings.temp}℃ • 풍량 ${settings.fan}`;
      case "humidifier":
        return `목표 습도 ${settings.humidity}% • 세기 ${settings.intensity}`;
      case "dehumidifier":
        return `목표 습도 ${settings.humidity}% • 세기 ${settings.intensity}`;
      default:
        return "설정됨";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader title="오늘의 상태 체크" onBack={onBack} />
      <div className="px-5 py-6 space-y-6 flex-1 overflow-y-auto pb-20">
        {!submitted ? (
          <>
            <div>
              <p className="font-semibold text-foreground mb-3">현재 가전 상태</p>
              <div className="grid grid-cols-2 gap-2">
                {APPLIANCE_LIST.map((app) => (
                  <div
                    key={app.key}
                    className="bg-card rounded-xl p-3 border border-border"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{app.icon}</span>
                      <p className="text-xs font-semibold text-foreground">{app.name}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">{getApplianceStatus(app.key)}</p>
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: applianceSettings[app.key]?.power ? "#69C99A" : "#E5E7EB" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-3">신체 불편 증상</p>
              <div className="relative mb-3">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="증상 검색 (예: 허리, 붓기, 두통...)"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-card focus:outline-none focus:border-primary text-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X size={16} className="text-muted-foreground" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {filteredSymptoms.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-3">검색 결과가 없습니다</p>
                ) : (
                  filteredSymptoms.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleArr(selSymptoms, s, setSelSymptoms)}
                      className="px-3 py-2 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: selSymptoms.includes(s) ? "rgba(201,78,112,0.1)" : "var(--card)",
                        border: `1.5px solid ${selSymptoms.includes(s) ? "#C94E70" : "var(--border)"}`,
                        color: selSymptoms.includes(s) ? "#C94E70" : "var(--muted-foreground)",
                      }}
                    >
                      {s}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-3">감정 상태</p>
              <div className="grid grid-cols-2 gap-2">
                {EMOTIONS.map((e) => (
                  <button
                    key={e.text}
                    onClick={() => toggleArr(selEmotions, e.text, setSelEmotions)}
                    className="px-3 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                    style={{
                      background: selEmotions.includes(e.text) ? "rgba(123,104,181,0.1)" : "var(--card)",
                      border: `1.5px solid ${selEmotions.includes(e.text) ? "#7B68B5" : "var(--border)"}`,
                      color: selEmotions.includes(e.text) ? "#7B68B5" : "var(--muted-foreground)",
                    }}
                  >
                    <span className="text-xl">{e.emoji}</span>
                    <span>{e.text}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-foreground">스트레스 지수</p>
                <span
                  className="text-lg font-bold px-3 py-1 rounded-xl"
                  style={{ background: "rgba(201,78,112,0.1)", color: "#C94E70" }}
                >
                  {stress}
                </span>
              </div>
              <input
                type="range" min="1" max="10" value={stress}
                onChange={(e) => setStress(parseInt(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: "#C94E70" }}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>매우 낮음</span><span>매우 높음</span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full py-4 rounded-2xl font-semibold text-white shadow-md transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #C94E70, #E8789A)" }}
            >
              분석하고 가전 제어하기
            </button>
          </>
        ) : (
          <>
            <div
              className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: "rgba(105,201,154,0.1)", border: "1.5px solid rgba(105,201,154,0.3)" }}
            >
              <CheckCircle size={20} style={{ color: "#69C99A" }} />
              <div>
                <p className="font-semibold text-sm" style={{ color: "#2D5A4A" }}>분석 완료!</p>
                <p className="text-xs text-muted-foreground">상태에 맞는 가전을 자동 설정했어요</p>
              </div>
            </div>

            {getRecs().length > 0 && (
              <div>
                <p className="font-semibold text-foreground mb-3">AI 추천 이유</p>
                <div className="space-y-2">
                  {getRecs().map((r) => (
                    <div key={r.key} className="bg-card rounded-xl p-3 border border-border flex items-center gap-3">
                      <span className="text-xl">{r.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{r.name} — {r.action}</p>
                        <p className="text-xs text-muted-foreground">{r.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="font-semibold text-foreground mb-3">LG ThinQ 가전 제어</p>
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
                        onClick={() => toggleDiscomfortAppliance(app.key as ApplianceKey)}
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
            </div>

            <button
              onClick={() => setSubmitted(false)}
              className="w-full py-3.5 rounded-2xl font-semibold border-2 transition-all active:scale-95"
              style={{ borderColor: "#C94E70", color: "#C94E70" }}
            >
              다시 입력하기
            </button>
          </>
        )}
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

            {selectedAppliance === "aircon" && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">모드</p>
                  <div className="grid grid-cols-3 gap-2">
                    {["냉방", "난방", "송풍"].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setApplianceSettings((prev) => ({
                          ...prev,
                          aircon: { ...prev.aircon, mode },
                        }))}
                        className="py-2 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: applianceSettings.aircon.mode === mode ? "rgba(201,78,112,0.1)" : "var(--secondary)",
                          border: `1.5px solid ${applianceSettings.aircon.mode === mode ? "#C94E70" : "transparent"}`,
                          color: applianceSettings.aircon.mode === mode ? "#C94E70" : "var(--muted-foreground)",
                        }}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">온도 설정</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setApplianceSettings((prev) => ({
                        ...prev,
                        aircon: { ...prev.aircon, temp: Math.max(16, prev.aircon.temp - 1) },
                      }))}
                      className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-semibold"
                    >
                      -
                    </button>
                    <span className="text-3xl font-bold flex-1 text-center" style={{ color: "#C94E70" }}>
                      {applianceSettings.aircon.temp}℃
                    </span>
                    <button
                      onClick={() => setApplianceSettings((prev) => ({
                        ...prev,
                        aircon: { ...prev.aircon, temp: Math.min(30, prev.aircon.temp + 1) },
                      }))}
                      className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-semibold"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">풍량</p>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => setApplianceSettings((prev) => ({
                          ...prev,
                          aircon: { ...prev.aircon, fan: speed },
                        }))}
                        className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: applianceSettings.aircon.fan === speed ? "rgba(201,78,112,0.1)" : "var(--secondary)",
                          border: `1.5px solid ${applianceSettings.aircon.fan === speed ? "#C94E70" : "transparent"}`,
                          color: applianceSettings.aircon.fan === speed ? "#C94E70" : "var(--muted-foreground)",
                        }}
                      >
                        {speed}단
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
                  <div className="grid grid-cols-3 gap-2">
                    {["자동", "수동", "수면"].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setApplianceSettings((prev) => ({
                          ...prev,
                          airPurifier: { ...prev.airPurifier, mode },
                        }))}
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
                        onClick={() => setApplianceSettings((prev) => ({
                          ...prev,
                          airPurifier: { ...prev.airPurifier, speed },
                        }))}
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

            {selectedAppliance === "humidifier" && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">목표 습도: {applianceSettings.humidifier.humidity}%</p>
                  <input
                    type="range"
                    min="40"
                    max="70"
                    value={applianceSettings.humidifier.humidity}
                    onChange={(e) => setApplianceSettings((prev) => ({
                      ...prev,
                      humidifier: { ...prev.humidifier, humidity: parseInt(e.target.value) },
                    }))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: "#C94E70" }}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">강도</p>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((intensity) => (
                      <button
                        key={intensity}
                        onClick={() => setApplianceSettings((prev) => ({
                          ...prev,
                          humidifier: { ...prev.humidifier, intensity },
                        }))}
                        className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: applianceSettings.humidifier.intensity === intensity ? "rgba(201,78,112,0.1)" : "var(--secondary)",
                          border: `1.5px solid ${applianceSettings.humidifier.intensity === intensity ? "#C94E70" : "transparent"}`,
                          color: applianceSettings.humidifier.intensity === intensity ? "#C94E70" : "var(--muted-foreground)",
                        }}
                      >
                        {intensity}단
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedAppliance === "dehumidifier" && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">목표 습도: {applianceSettings.dehumidifier.humidity}%</p>
                  <input
                    type="range"
                    min="30"
                    max="60"
                    value={applianceSettings.dehumidifier.humidity}
                    onChange={(e) => setApplianceSettings((prev) => ({
                      ...prev,
                      dehumidifier: { ...prev.dehumidifier, humidity: parseInt(e.target.value) },
                    }))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: "#C94E70" }}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">강도</p>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((intensity) => (
                      <button
                        key={intensity}
                        onClick={() => setApplianceSettings((prev) => ({
                          ...prev,
                          dehumidifier: { ...prev.dehumidifier, intensity },
                        }))}
                        className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: applianceSettings.dehumidifier.intensity === intensity ? "rgba(201,78,112,0.1)" : "var(--secondary)",
                          border: `1.5px solid ${applianceSettings.dehumidifier.intensity === intensity ? "#C94E70" : "transparent"}`,
                          color: applianceSettings.dehumidifier.intensity === intensity ? "#C94E70" : "var(--muted-foreground)",
                        }}
                      >
                        {intensity}단
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                persistDiscomfortAppliances();
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

      {onNavigate && <BottomNav current="dashboard" onNavigate={onNavigate} />}
    </div>
  );
}