import { API_BASE_URL } from "./api";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle, Search, X, Sparkles } from "lucide-react";
import { AppUser, PartnerStatus, Screen } from "./types";
// @ts-ignore
import { BottomNav } from "./App";

type ApplianceKey = "moodLight" | "aircon" | "humidifier" | "dehumidifier" | "airPurifier" | "washingMachine" | "dryer";
type ApplianceState = Record<ApplianceKey, boolean>;
type ApplianceSettingsState = Record<ApplianceKey, any>;

const MOOD_LIGHT_PRESETS = [
  { name: "따뜻한 화이트", rgb: { red: 255, green: 128, blue: 64 }, swatch: "#FFB06A" },
  { name: "차가운 화이트", rgb: { red: 128, green: 128, blue: 255 }, swatch: "#B9C7FF" },
  { name: "자연광", rgb: { red: 255, green: 255, blue: 128 }, swatch: "#FFF2A3" },
  { name: "수면 모드", rgb: { red: 85, green: 0, blue: 128 }, swatch: "#76439A" },
  { name: "독서 모드", rgb: { red: 255, green: 190, blue: 100 }, swatch: "#FFC678" },
  { name: "휴식 모드", rgb: { red: 120, green: 180, blue: 255 }, swatch: "#78B4FF" },
  { name: "집중 모드", rgb: { red: 180, green: 220, blue: 255 }, swatch: "#B4DCFF" },
  { name: "명상 모드", rgb: { red: 150, green: 100, blue: 220 }, swatch: "#9664DC" },
  { name: "새벽 수유", rgb: { red: 255, green: 70, blue: 15 }, swatch: "#FF561F" },
  { name: "로맨틱 모드", rgb: { red: 255, green: 45, blue: 100 }, swatch: "#FF2D64" },
];

const DEFAULT_APPLIANCE_POWER: ApplianceState = {
  moodLight: false,
  aircon: true,
  humidifier: false,
  dehumidifier: false,
  airPurifier: true,
  washingMachine: false,
  dryer: false,
};

const DEFAULT_APPLIANCE_SETTINGS: ApplianceSettingsState = {
  moodLight: { brightness: 50, color: "따뜻한 화이트", red: 255, green: 128, blue: 64, power: false },
  aircon: { temp: 24, mode: "냉방", fan: 2, power: true },
  humidifier: { humidity: 55, intensity: 2, power: false },
  dehumidifier: { humidity: 50, intensity: 2, power: false },
  airPurifier: { speed: 2, mode: "자동", power: true },
  washingMachine: { power: false },
  dryer: { power: false },
};

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

const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeoutMs = 6000,
  timeoutMessage = "요청 시간이 초과되었습니다. 서버 상태를 확인하세요.",
) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(timeoutMessage);
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const hydrateAppliances = (rows: any[]) => {
  const power = { ...DEFAULT_APPLIANCE_POWER };
  const settings: ApplianceSettingsState = {
    moodLight: { ...DEFAULT_APPLIANCE_SETTINGS.moodLight },
    aircon: { ...DEFAULT_APPLIANCE_SETTINGS.aircon },
    humidifier: { ...DEFAULT_APPLIANCE_SETTINGS.humidifier },
    dehumidifier: { ...DEFAULT_APPLIANCE_SETTINGS.dehumidifier },
    airPurifier: { ...DEFAULT_APPLIANCE_SETTINGS.airPurifier },
    washingMachine: { ...DEFAULT_APPLIANCE_SETTINGS.washingMachine },
    dryer: { ...DEFAULT_APPLIANCE_SETTINGS.dryer },
  };

  rows.forEach((row) => {
    const key = row.appliance_name as ApplianceKey;
    if (!settings[key]) return;
    let command = {};
    try { command = JSON.parse(row.control_command || "{}"); } catch { command = {}; }
    const isOn = row.execution_status === "ON";
    power[key] = isOn;
    settings[key] = { ...settings[key], ...command, power: isOn };
  });
  return { power, settings };
};

const fetchApplianceSettings = async (userId?: number | null) => {
  if (!userId) return { power: { ...DEFAULT_APPLIANCE_POWER }, settings: { ...DEFAULT_APPLIANCE_SETTINGS } };
  const res = await fetch(`${API_BASE_URL}/api/appliances/${userId}`);
  if (!res.ok) throw new Error("Failed to load appliance settings");
  const data = await res.json();
  return hydrateAppliances(data.settings || []);
};

const saveApplianceSettings = async (userId: number | undefined, power: ApplianceState, settings: ApplianceSettingsState) => {
  if (!userId) return;
  await fetchWithTimeout(`${API_BASE_URL}/api/appliances/bulk`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      settings: buildAppliancePayload(userId, power, settings),
    }),
  }, 6000, "가전 설정 저장 시간이 초과되었습니다. 데이터베이스 연결 상태를 확인하세요.");
};

const connectArduino = async () => {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/appliances/arduino/connect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ baudrate: 9600 }),
  }, 7000, "Arduino 연결 시간이 초과되었습니다. COM 포트 점유 상태를 확인하세요.");
  const data = await res.json();
  if (!res.ok || data.status !== "Success") {
    throw new Error(data.detail || data.message || "Arduino 연결에 실패했습니다.");
  }
  return data.serial;
};

const getArduinoStatus = async () => {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/appliances/arduino/status`,
    {},
    3000,
    "Arduino 연결 상태 확인 시간이 초과되었습니다.",
  );
  const data = await res.json();
  if (!res.ok || data.status !== "Success") {
    throw new Error(data.detail || data.message || "Arduino 연결 상태를 확인하지 못했습니다.");
  }
  return data.serial;
};

const syncArduinoSettings = async (
  userId: number | undefined,
  power: ApplianceState,
  settings: ApplianceSettingsState,
) => {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/appliances/arduino/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ settings: buildAppliancePayload(userId, power, settings) }),
  }, 6000, "Arduino 응답 시간이 초과되었습니다. 보드 연결 상태와 업로드된 스케치를 확인하세요.");
  const data = await res.json();
  if (!res.ok || data.status !== "Success") {
    throw new Error(data.detail || data.message || "Arduino 설정 전송에 실패했습니다.");
  }
  return data.serial;
};

function PageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 bg-card/90 backdrop-blur-sm sticky top-0 z-10 border-b border-border">
      <button onClick={onBack} className="p-2 rounded-xl hover:bg-secondary transition-colors"><ArrowLeft size={20} className="text-foreground" /></button>
      <h1 className="font-semibold text-foreground">{title}</h1>
    </div>
  );
}

export default function DiscomfortView({ user, onBack, onNavigate, onStatusUpdate }: { user?: AppUser | null; onBack: () => void; onNavigate?: (s: Screen) => void; onStatusUpdate?: (status: PartnerStatus) => void; }) {
  const userId = getUserId(user);
  const ALL_SYMPTOMS = [
    "없음","입덧", "붓기", "두통", "피로감", "허리통증", "수면장애", "소화불량", "역류 증상",
    "변비", "어지러움", "빈혈", "가슴통증", "손발저림", "다리경련", "치질", "정맥류",
    "잇몸출혈", "코막힘", "코피", "배뇨통", "요실금", "질분비물", "골반통", "좌골신경통"
  ];
  const EMOTIONS = [
    { text: "행복", emoji: "😊" }, { text: "안정", emoji: "🙂" }, { text: "설렘", emoji: "🥰" }, { text: "중립", emoji: "😐" },
    { text: "불안", emoji: "😟" }, { text: "피로", emoji: "😫" }, { text: "우울", emoji: "😔" }, { text: "화남", emoji: "😡" },
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [selSymptoms, setSelSymptoms] = useState<string[]>([]);
  const [selEmotions, setSelEmotions] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [appliances, setAppliances] = useState<ApplianceState>({ ...DEFAULT_APPLIANCE_POWER });
  const [applianceSettings, setApplianceSettings] = useState<ApplianceSettingsState>({ ...DEFAULT_APPLIANCE_SETTINGS });
  const [selectedAppliance, setSelectedAppliance] = useState<string | null>(null);
  const [recommendApplyBusy, setRecommendApplyBusy] = useState(false);
  const [recommendApplyMessage, setRecommendApplyMessage] = useState("");

  const [aiEnvData, setAiEnvData] = useState<any>(null);
  const [aiEnvRecs, setAiEnvRecs] = useState<any[]>([]);

  useEffect(() => {
    fetchApplianceSettings(userId)
      .then(({ power, settings }) => { setAppliances(power); setApplianceSettings(settings); })
      .catch(console.error);

    if (userId) {
      fetch(`${API_BASE_URL}/api/ai/recommend-appliances/${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === "Success") {
            setAiEnvData({ optTemp: data.optimal_temp, optHum: data.optimal_humidity, curTemp: data.current_temp, curWeather: data.current_weather });
            setAiEnvRecs(data.recommendations || []);
          }
        }).catch(e => console.error("AI 추천 오류:", e));
    }
  }, [userId]);

  const persistDiscomfortAppliances = (nextPower = appliances, nextSettings = applianceSettings) => {
    saveApplianceSettings(userId, nextPower, nextSettings).catch(console.error);
  };

  const toggleDiscomfortAppliance = (key: ApplianceKey) => {
    const nextPower = { ...appliances, [key]: !appliances[key] };
    const nextSettings = { ...applianceSettings, [key]: { ...applianceSettings[key], power: nextPower[key] } };
    if (nextPower[key] && key === "humidifier") {
      nextPower.dehumidifier = false;
      nextSettings.dehumidifier = { ...nextSettings.dehumidifier, power: false };
    } else if (nextPower[key] && key === "dehumidifier") {
      nextPower.humidifier = false;
      nextSettings.humidifier = { ...nextSettings.humidifier, power: false };
    }
    setAppliances(nextPower); setApplianceSettings(nextSettings); persistDiscomfortAppliances(nextPower, nextSettings);
  };

  const toggleArr = (arr: string[], val: string, set: (v: string[]) => void) => set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  const getRecs = () => {
    const map: Record<string, any> = {};
    
    aiEnvRecs.forEach(r => { map[r.key] = { ...r }; });

    if (selSymptoms.includes("입덧")) {
      map.airPurifier = { key: "airPurifier", name: "공기청정기", action: "쾌적 모드", icon: "💨", reason: "냄새 차단으로 입덧 완화" };
      map.aircon = { key: "aircon", name: "에어컨", action: "18~20℃ 냉방", icon: "❄️", reason: "시원한 공기로 열기 차단" };
    }
    if (selSymptoms.includes("붓기")) map.dehumidifier = { key: "dehumidifier", name: "제습기", action: "45~50% 유지", icon: "🌊", reason: "붓기 완화를 위한 습도 조절" };
    if (selSymptoms.includes("수면장애")) {
      map.moodLight = { key: "moodLight", name: "무드등", action: "수면 모드", icon: "💡", reason: "편안한 수면 분위기 조성" };
      map.humidifier = { key: "humidifier", name: "가습기", action: "50~60% 유지", icon: "💧", reason: "쾌적한 수면 환경" };
    }
    if (selSymptoms.includes("코막힘") || selSymptoms.includes("코피")) {
      map.airPurifier = { key: "airPurifier", name: "공기청정기", action: "쾌적 모드", icon: "💨", reason: "신선한 공기로 호흡 개선" };
      map.humidifier = { key: "humidifier", name: "가습기", action: "55~60% 유지", icon: "💧", reason: "건조함 완화" };
    }
    if (!selSymptoms.includes("수면장애")) {
      if (selEmotions.includes("불안") || selEmotions.includes("우울")) {
        map.moodLight = { key: "moodLight", name: "무드등", action: "명상 모드", icon: "💡", reason: "차분한 보랏빛 조명으로 심리적 안정감 부여" };
      } else if (selEmotions.includes("피로") || selEmotions.includes("화남") || selSymptoms.includes("두통") || selSymptoms.includes("피로감")) {
        map.moodLight = { key: "moodLight", name: "무드등", action: "휴식 모드", icon: "💡", reason: "부드러운 조명으로 긴장과 피로 완화" };
      } else if (selEmotions.includes("설렘")) {
        map.moodLight = { key: "moodLight", name: "무드등", action: "로맨틱 모드", icon: "💡", reason: "따뜻한 분위기로 긍정적인 감정 강화" };
      } else if (selEmotions.includes("행복")) {
        map.moodLight = { key: "moodLight", name: "무드등", action: "따뜻한 화이트", icon: "💡", reason: "편안하고 따뜻한 분위기 유지" };
      } else if (selEmotions.includes("안정")) {
        map.moodLight = { key: "moodLight", name: "무드등", action: "자연광", icon: "💡", reason: "안정적인 상태에 맞는 자연스러운 조명 유지" };
      } else if (selEmotions.includes("중립")) {
        map.moodLight = { key: "moodLight", name: "무드등", action: "집중 모드", icon: "💡", reason: "선명한 조명으로 일상 활동 집중 지원" };
      }
    }

    if (selEmotions.includes("불안") || selEmotions.includes("피로") || selEmotions.includes("우울") || selEmotions.includes("화남")) {
      map.airPurifier = { key: "airPurifier", name: "공기청정기", action: "쾌적 모드", icon: "💨", reason: "신선한 공기로 기분 전환" };
    }
    return Object.values(map);
  };

  const getRecommendedSettingPatch = (recommendation: any) => {
    const key = recommendation.key as ApplianceKey;
    if (recommendation.settings) {
      return { ...recommendation.settings, power: true };
    }

    const action = String(recommendation.action || "");
    switch (key) {
      case "aircon":
        return {
          power: true,
          mode: action.includes("난방") ? "난방" : "냉방",
          temp: action.includes("18") ? 20 : applianceSettings.aircon.temp,
          fan: action.includes("강") ? 3 : 2,
        };
      case "humidifier":
        return {
          power: true,
          humidity: action.includes("55") || action.includes("60") ? 58 : 55,
          intensity: 2,
        };
      case "dehumidifier":
        return {
          power: true,
          humidity: action.includes("45") || action.includes("50") ? 48 : 50,
          intensity: 2,
        };
      case "airPurifier":
        return {
          power: true,
          mode: "자동",
          speed: action.includes("강") ? 3 : 2,
        };
      case "moodLight":
        const moodPresets: Record<string, { brightness: number; color: string; red: number; green: number; blue: number }> = {
          "따뜻한 화이트": { brightness: 50, color: "따뜻한 화이트", red: 255, green: 128, blue: 64 },
          "자연광": { brightness: 55, color: "자연광", red: 255, green: 255, blue: 128 },
          "수면 모드": { brightness: 30, color: "수면 모드", red: 85, green: 0, blue: 128 },
          "휴식 모드": { brightness: 45, color: "휴식 모드", red: 120, green: 180, blue: 255 },
          "집중 모드": { brightness: 65, color: "집중 모드", red: 180, green: 220, blue: 255 },
          "명상 모드": { brightness: 35, color: "명상 모드", red: 150, green: 100, blue: 220 },
          "로맨틱 모드": { brightness: 45, color: "로맨틱 모드", red: 255, green: 45, blue: 100 },
        };
        const recommendedMood = moodPresets[action] || moodPresets["휴식 모드"];
        return {
          power: true,
          ...recommendedMood,
        };
      default:
        return { power: true };
    }
  };

  const buildRecommendedApplianceState = () => {
    const nextPower: ApplianceState = {
      moodLight: false,
      aircon: false,
      humidifier: false,
      dehumidifier: false,
      airPurifier: false,
      washingMachine: false,
      dryer: false,
    };
    const nextSettings = { ...applianceSettings };
    const recs = getRecs();

    recs.forEach((r) => {
      const key = r.key as ApplianceKey;
      if (!nextSettings[key]) return;
      nextPower[key] = true;
      nextSettings[key] = { ...nextSettings[key], ...getRecommendedSettingPatch(r), power: true };
    });

    const hasHumidifier = recs.some((r) => r.key === "humidifier");
    const hasDehumidifier = recs.some((r) => r.key === "dehumidifier");
    if (hasHumidifier && hasDehumidifier) {
      const humidityRecommendation = aiEnvRecs.find((r) => r.key === "humidifier" || r.key === "dehumidifier");
      if (humidityRecommendation?.key === "dehumidifier") {
        nextPower.humidifier = false;
        nextSettings.humidifier = { ...nextSettings.humidifier, power: false };
      } else {
        nextPower.dehumidifier = false;
        nextSettings.dehumidifier = { ...nextSettings.dehumidifier, power: false };
      }
    }

    Object.keys(nextSettings).forEach((key) => {
      nextSettings[key as ApplianceKey] = {
        ...nextSettings[key as ApplianceKey],
        power: nextPower[key as ApplianceKey],
      };
    });

    return { nextPower, nextSettings };
  };

  const applyRecommendedApplianceMode = async () => {
    const { nextPower, nextSettings } = buildRecommendedApplianceState();
    setRecommendApplyBusy(true);
    setRecommendApplyMessage("추천 가전모드를 저장하고 Arduino로 전송하는 중입니다.");

    try {
      setAppliances(nextPower);
      setApplianceSettings(nextSettings);
      await saveApplianceSettings(userId, nextPower, nextSettings);
      const currentStatus = await getArduinoStatus();
      const connectedStatus = currentStatus.connected ? currentStatus : await connectArduino();
      const syncedStatus = await syncArduinoSettings(userId, nextPower, nextSettings);
      setRecommendApplyMessage(
        `추천 가전모드를 Arduino에 적용했습니다. (${syncedStatus.port || connectedStatus.port || "USB"})`,
      );
    } catch (error) {
      setRecommendApplyMessage(error instanceof Error ? error.message : "추천 가전모드 전송에 실패했습니다.");
    } finally {
      setRecommendApplyBusy(false);
    }
  };

  const handleSubmit = async () => {
    const { nextPower: next, nextSettings } = buildRecommendedApplianceState();
    
    setAppliances(next);
    setApplianceSettings(nextSettings);
    persistDiscomfortAppliances(next, nextSettings);

    if (userId) {
      try {
        await fetch(`${API_BASE_URL}/api/status-checks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            symptoms: selSymptoms,
            emotions: selEmotions,
          }),
        });
      } catch (error) {
        console.error("보호자 미션 생성 실패:", error);
      }
    }

    setSubmitted(true);

    if (onStatusUpdate) {
      // 🚀 stress 파라미터를 제외하고 넘기도록 수정!
      onStatusUpdate({ symptoms: selSymptoms, emotions: selEmotions, timestamp: new Date().toISOString() } as any);
    }
  };

  const APPLIANCE_LIST: { key: ApplianceKey; name: string; icon: string }[] = [
    { key: "moodLight", name: "무드등", icon: "💡" },
    { key: "aircon", name: "에어컨", icon: "❄️" },
    { key: "humidifier", name: "가습기", icon: "💧" },
    { key: "dehumidifier", name: "제습기", icon: "🌊" },
    { key: "airPurifier", name: "공기청정기", icon: "💨" },
    { key: "washingMachine", name: "세탁기", icon: "🧺" },
    { key: "dryer", name: "건조기", icon: "👕" },
  ];

  const getApplianceStatus = (key: ApplianceKey) => {
    const settings = applianceSettings[key];
    if (!settings) return "설정 없음";
    switch (key) {
      case "moodLight":
        return settings.color === "사용자 RGB"
          ? `수동 RGB · ${settings.red}, ${settings.green}, ${settings.blue} · 밝기 ${settings.brightness}%`
          : `${settings.color} · 밝기 ${settings.brightness}%`;
      case "airPurifier": return `${settings.mode} • 풍량 ${settings.speed}`;
      case "aircon": return `목표 온도 ${settings.temp}℃ • 풍량 ${settings.fan}`;
      case "humidifier": return `목표 습도 ${settings.humidity}% • 세기 ${settings.intensity}`;
      case "dehumidifier": return `목표 습도 ${settings.humidity}% • 세기 ${settings.intensity}`;
      case "washingMachine": return appliances.washingMachine ? "작동 중" : "전원 꺼짐";
      case "dryer": return appliances.dryer ? "건조 중" : "전원 꺼짐";
      default: return "설정됨";
    }
  };

  const filteredSymptoms = ALL_SYMPTOMS.filter((s) =>
    s.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader title="오늘의 상태 체크" onBack={onBack} />
      <div className="px-5 py-6 space-y-6 flex-1 overflow-y-auto pb-20">
        {!submitted ? (
          <>
            {aiEnvData && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-[rgba(123,104,181,0.2)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[rgba(123,104,181,0.05)] rounded-full -translate-y-10 translate-x-10"></div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={18} color="#7B68B5" />
                  <p className="font-bold text-[15px]" style={{ color: "#7B68B5" }}>나만의 AI 쾌적존 리포트</p>
                </div>
                <p className="text-[13px] text-[#555] leading-relaxed relative z-10">
                  과거 다이어리를 분석해보니, 회원님은 <b>{aiEnvData.optTemp}℃</b>, <b>{aiEnvData.optHum}%</b> 일 때 가장 안정감을 느끼셨어요!<br/>
                  현재 외부 날씨는 <b>{aiEnvData.curTemp}℃ ({aiEnvData.curWeather})</b> 예요. 최적의 환경으로 세팅해 드릴까요?
                </p>
              </div>
            )}

            <div>
              <p className="font-semibold text-foreground mb-3">현재 가전 상태</p>
              <div className="grid grid-cols-2 gap-2">
                {APPLIANCE_LIST.map((app) => (
                  <div key={app.key} className="bg-card rounded-xl p-3 border border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{app.icon}</span>
                      <p className="text-xs font-semibold text-foreground">{app.name}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">{getApplianceStatus(app.key)}</p>
                      <div className="w-2 h-2 rounded-full" style={{ background: applianceSettings[app.key]?.power ? "#69C99A" : "#E5E7EB" }} />
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
                  type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="증상 검색 (예: 허리, 붓기, 두통...)"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-card focus:outline-none focus:border-primary text-sm"
                />
                {searchTerm && <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X size={16} className="text-muted-foreground" /></button>}
              </div>
              <div className="flex flex-wrap gap-2">
                {filteredSymptoms.map((s) => (
                  <button
                    key={s} onClick={() => toggleArr(selSymptoms, s, setSelSymptoms)}
                    className="px-3 py-2 rounded-xl text-sm font-medium transition-all"
                    style={{ background: selSymptoms.includes(s) ? "rgba(201,78,112,0.1)" : "var(--card)", border: `1.5px solid ${selSymptoms.includes(s) ? "#C94E70" : "var(--border)"}`, color: selSymptoms.includes(s) ? "#C94E70" : "var(--muted-foreground)" }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-3">감정 상태</p>
              <div className="grid grid-cols-4 gap-2">
                {EMOTIONS.map((e) => (
                  <button
                    key={e.text} onClick={() => toggleArr(selEmotions, e.text, setSelEmotions)}
                    className="py-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center justify-center gap-1.5"
                    style={{ background: selEmotions.includes(e.text) ? "rgba(123,104,181,0.1)" : "var(--card)", border: `1.5px solid ${selEmotions.includes(e.text) ? "#7B68B5" : "var(--border)"}`, color: selEmotions.includes(e.text) ? "#7B68B5" : "var(--muted-foreground)" }}
                  >
                    <span className="text-2xl">{e.emoji}</span>
                    <span className="text-xs">{e.text}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full py-4 rounded-2xl font-semibold text-white shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #C94E70, #E8789A)" }}
            >
              <Sparkles size={18}/> AI 분석 및 가전 제어 시작
            </button>
          </>
        ) : (
          <>
            <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "rgba(105,201,154,0.1)", border: "1.5px solid rgba(105,201,154,0.3)" }}>
              <CheckCircle size={20} style={{ color: "#69C99A" }} />
              <div>
                <p className="font-semibold text-sm" style={{ color: "#2D5A4A" }}>스마트홈 세팅 완료!</p>
                <p className="text-xs text-muted-foreground">과거 일기 분석 기반으로 최적화했어요</p>
              </div>
            </div>

            {getRecs().length > 0 && (
              <div>
                <p className="font-semibold text-foreground mb-3">AI가 이렇게 조절했어요</p>
                <div className="space-y-2">
                  {getRecs().map((r) => (
                    <div key={r.key} className="bg-card rounded-xl p-3 border border-border flex items-center gap-3">
                      <span className="text-xl">{r.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{r.name} — <span style={{ color: "#C94E70" }}>{r.action}</span></p>
                        <p className="text-xs text-muted-foreground">{r.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={applyRecommendedApplianceMode}
                  disabled={recommendApplyBusy}
                  className="w-full mt-3 py-3 rounded-2xl font-semibold text-white shadow-sm transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #7B68B5, #4D8AF0)" }}
                >
                  <Sparkles size={17} />
                  {recommendApplyBusy ? "추천 가전모드 전송 중..." : "추천 가전모드로 제어"}
                </button>
                {recommendApplyMessage && (
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{recommendApplyMessage}</p>
                )}
              </div>
            )}

            <div>
              <p className="font-semibold text-foreground mb-3">LG ThinQ 가전 현황</p>
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
                        <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200" style={{ transform: appliances[app.key] ? "translateX(24px)" : "translateX(0)" }} />
                      </button>
                    </div>
                    {appliances[app.key] && app.key !== "washingMachine" && app.key !== "dryer" && (
                      <button onClick={() => setSelectedAppliance(app.key)} className="w-full mt-2 py-2 rounded-xl text-xs font-medium border border-border text-muted-foreground hover:bg-secondary/50 transition-colors">
                        상세 설정 변경
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setSubmitted(false)} className="w-full py-3.5 rounded-2xl font-semibold border-2 transition-all active:scale-95" style={{ borderColor: "#C94E70", color: "#C94E70" }}>
              다시 분석하기
            </button>
          </>
        )}
      </div>

      {selectedAppliance && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setSelectedAppliance(null)}>
          <div className="bg-background rounded-t-3xl p-5 w-full max-w-[430px] max-h-[78vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">{APPLIANCE_LIST.find((a) => a.key === selectedAppliance)?.name} 수동 설정</h3>
              <button onClick={() => setSelectedAppliance(null)}><X size={20} className="text-muted-foreground" /></button>
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
                    onChange={(e) => setApplianceSettings((prev) => ({
                      ...prev,
                      moodLight: { ...prev.moodLight, brightness: Number(e.target.value) },
                    }))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: "#C94E70" }}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">조명 모드</p>
                  <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2">
                    {MOOD_LIGHT_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => setApplianceSettings((prev) => ({
                          ...prev,
                          moodLight: { ...prev.moodLight, color: preset.name, ...preset.rgb },
                        }))}
                        className="py-2 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                        style={{
                          background: applianceSettings.moodLight.color === preset.name ? "rgba(201,78,112,0.1)" : "var(--secondary)",
                          border: `1.5px solid ${applianceSettings.moodLight.color === preset.name ? "#C94E70" : "transparent"}`,
                          color: applianceSettings.moodLight.color === preset.name ? "#C94E70" : "var(--muted-foreground)",
                        }}
                      >
                        <span className="w-3 h-3 rounded-full border border-black/10" style={{ background: preset.swatch }} />
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">RGB 직접 설정</p>
                    <span
                      className="w-8 h-8 rounded-full border border-border shadow-inner"
                      style={{ background: `rgb(${applianceSettings.moodLight.red}, ${applianceSettings.moodLight.green}, ${applianceSettings.moodLight.blue})` }}
                    />
                  </div>
                  {[
                    { key: "red", label: "R", color: "#EF4444" },
                    { key: "green", label: "G", color: "#22C55E" },
                    { key: "blue", label: "B", color: "#3B82F6" },
                  ].map((channel) => (
                    <div key={channel.key} className="grid grid-cols-[20px_1fr_64px] items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: channel.color }}>{channel.label}</span>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={applianceSettings.moodLight[channel.key]}
                        onChange={(e) => setApplianceSettings((prev) => ({
                          ...prev,
                          moodLight: {
                            ...prev.moodLight,
                            color: "사용자 RGB",
                            [channel.key]: Number(e.target.value),
                          },
                        }))}
                        className="w-full"
                        style={{ accentColor: channel.color }}
                      />
                      <input
                        type="number"
                        min="0"
                        max="255"
                        value={applianceSettings.moodLight[channel.key]}
                        onChange={(e) => setApplianceSettings((prev) => ({
                          ...prev,
                          moodLight: {
                            ...prev.moodLight,
                            color: "사용자 RGB",
                            [channel.key]: Math.max(0, Math.min(255, Number(e.target.value) || 0)),
                          },
                        }))}
                        className="w-full px-2 py-1.5 rounded-lg border border-border text-sm text-center bg-background"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedAppliance === "aircon" && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">모드</p>
                  <div className="grid grid-cols-3 gap-2">
                    {["냉방", "난방", "송풍"].map((mode) => (
                      <button key={mode} onClick={() => setApplianceSettings((prev) => ({ ...prev, aircon: { ...prev.aircon, mode } }))} className="py-2 rounded-xl text-sm font-medium transition-all" style={{ background: applianceSettings.aircon.mode === mode ? "rgba(201,78,112,0.1)" : "var(--secondary)", border: `1.5px solid ${applianceSettings.aircon.mode === mode ? "#C94E70" : "transparent"}`, color: applianceSettings.aircon.mode === mode ? "#C94E70" : "var(--muted-foreground)" }}>{mode}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">온도 설정</p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setApplianceSettings((prev) => ({ ...prev, aircon: { ...prev.aircon, temp: Math.max(16, prev.aircon.temp - 1) } }))} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-semibold">-</button>
                    <span className="text-3xl font-bold flex-1 text-center" style={{ color: "#C94E70" }}>{applianceSettings.aircon.temp}℃</span>
                    <button onClick={() => setApplianceSettings((prev) => ({ ...prev, aircon: { ...prev.aircon, temp: Math.min(30, prev.aircon.temp + 1) } }))} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-semibold">+</button>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">풍량</p>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((speed) => (
                      <button key={speed} onClick={() => setApplianceSettings((prev) => ({ ...prev, aircon: { ...prev.aircon, fan: speed } }))} className="flex-1 py-2 rounded-xl text-sm font-medium transition-all" style={{ background: applianceSettings.aircon.fan === speed ? "rgba(201,78,112,0.1)" : "var(--secondary)", border: `1.5px solid ${applianceSettings.aircon.fan === speed ? "#C94E70" : "transparent"}`, color: applianceSettings.aircon.fan === speed ? "#C94E70" : "var(--muted-foreground)" }}>{speed}단</button>
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
                      <button key={mode} onClick={() => setApplianceSettings((prev) => ({ ...prev, airPurifier: { ...prev.airPurifier, mode } }))} className="py-2 rounded-xl text-sm font-medium transition-all" style={{ background: applianceSettings.airPurifier.mode === mode ? "rgba(201,78,112,0.1)" : "var(--secondary)", border: `1.5px solid ${applianceSettings.airPurifier.mode === mode ? "#C94E70" : "transparent"}`, color: applianceSettings.airPurifier.mode === mode ? "#C94E70" : "var(--muted-foreground)" }}>{mode}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">풍량</p>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((speed) => (
                      <button key={speed} onClick={() => setApplianceSettings((prev) => ({ ...prev, airPurifier: { ...prev.airPurifier, speed } }))} className="flex-1 py-2 rounded-xl text-sm font-medium transition-all" style={{ background: applianceSettings.airPurifier.speed === speed ? "rgba(201,78,112,0.1)" : "var(--secondary)", border: `1.5px solid ${applianceSettings.airPurifier.speed === speed ? "#C94E70" : "transparent"}`, color: applianceSettings.airPurifier.speed === speed ? "#C94E70" : "var(--muted-foreground)" }}>{speed}단</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedAppliance === "humidifier" && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">목표 습도: {applianceSettings.humidifier.humidity}%</p>
                  <input type="range" min="40" max="70" value={applianceSettings.humidifier.humidity} onChange={(e) => setApplianceSettings((prev) => ({ ...prev, humidifier: { ...prev.humidifier, humidity: parseInt(e.target.value) } }))} className="w-full h-2 rounded-full appearance-none cursor-pointer" style={{ accentColor: "#C94E70" }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">강도</p>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((intensity) => (
                      <button key={intensity} onClick={() => setApplianceSettings((prev) => ({ ...prev, humidifier: { ...prev.humidifier, intensity } }))} className="flex-1 py-2 rounded-xl text-sm font-medium transition-all" style={{ background: applianceSettings.humidifier.intensity === intensity ? "rgba(201,78,112,0.1)" : "var(--secondary)", border: `1.5px solid ${applianceSettings.humidifier.intensity === intensity ? "#C94E70" : "transparent"}`, color: applianceSettings.humidifier.intensity === intensity ? "#C94E70" : "var(--muted-foreground)" }}>{intensity}단</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedAppliance === "dehumidifier" && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">목표 습도: {applianceSettings.dehumidifier.humidity}%</p>
                  <input type="range" min="30" max="60" value={applianceSettings.dehumidifier.humidity} onChange={(e) => setApplianceSettings((prev) => ({ ...prev, dehumidifier: { ...prev.dehumidifier, humidity: parseInt(e.target.value) } }))} className="w-full h-2 rounded-full appearance-none cursor-pointer" style={{ accentColor: "#C94E70" }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">강도</p>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((intensity) => (
                      <button key={intensity} onClick={() => setApplianceSettings((prev) => ({ ...prev, dehumidifier: { ...prev.dehumidifier, intensity } }))} className="flex-1 py-2 rounded-xl text-sm font-medium transition-all" style={{ background: applianceSettings.dehumidifier.intensity === intensity ? "rgba(201,78,112,0.1)" : "var(--secondary)", border: `1.5px solid ${applianceSettings.dehumidifier.intensity === intensity ? "#C94E70" : "transparent"}`, color: applianceSettings.dehumidifier.intensity === intensity ? "#C94E70" : "var(--muted-foreground)" }}>{intensity}단</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => { persistDiscomfortAppliances(); setSelectedAppliance(null); }}
              className="w-full mt-4 py-3 rounded-2xl font-semibold text-white" style={{ background: "#C94E70" }}
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
