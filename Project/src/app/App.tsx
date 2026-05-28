import { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft, LogOut, MessageCircle, Shield, ThumbsUp,
  Plus, CheckCircle, AlertTriangle, ChevronRight, Star,
  Home, User, Settings, BookOpen, Calendar, Search, X,
  Play, Send, Copy, Zap,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

// 🚀 분할한 파일 불러오기!
import { Screen, Role, AppUser, PartnerStatus } from "./types";
import LoginView from "./LoginView";
import DashboardView from "./DashboardView";
import SmallTalkView from "./SmallTalkView";
import CommunityView from "./CommunityView";
import SettingsView from "./SettingsView";
import DiaryView from './DiaryView.tsx';
// ── Mock data ──────────────────────────────────────────────────────────────
const DEMO_USERS: Array<AppUser & { password: string }> = [
  { email: "mom@demo.kr", password: "1234", name: "이수진", role: "pregnant", pregnancyWeek: 28, nickname: "행복한예비맘", babyNickname: "콩이", inviteCode: "MOMDAL28" },
  { email: "dad@demo.kr", password: "1234", name: "이준혁", role: "guardian", pregnancyWeek: 28, nickname: "든든한아빠", babyNickname: "콩이" },
];

const MOOD_HISTORY = [
  { day: "월", score: 3.2 }, { day: "화", score: 2.8 },
  { day: "수", score: 3.8 }, { day: "목", score: 2.5 },
  { day: "금", score: 4.1 }, { day: "토", score: 3.6 },
  { day: "일", score: 4.2 },
];

const POSTS_INIT = [
  {
    id: 1, week: 28, avatar: "🤰", author: "행복한예비맘",
    content: "28주차 접어들면서 좌골신경통이 너무 심한데 다들 어떻게 관리하시나요? 저는 옆으로 누워서 쿠션 끼는 게 제일 편하더라고요.",
    likes: 24, comments: 8, time: "2시간 전",
  },
  {
    id: 2, week: 27, avatar: "💕", author: "뽀짝맘",
    content: "임신 중 배가 고픈게 진짜 배고픈건지 입덧인건지 너무 헷갈려요. 조금씩 자주 먹는 게 최고인 것 같아요 🍎",
    likes: 36, comments: 12, time: "4시간 전",
  },
  {
    id: 3, week: 29, avatar: "⭐", author: "달빛엄마",
    content: "요즘 태동이 너무 강해서 잠을 못 자겠어요 ㅠㅠ 근데 느낄 때마다 신기하고 행복해서 참게 되네요 🌟",
    likes: 58, comments: 21, time: "6시간 전",
  },
  {
    id: 4, week: 28, avatar: "🌸", author: "초보예비맘",
    content: "첫 임신이라 모르는 게 너무 많아요. 이 앱 덕분에 많이 도움받고 있어요! 다들 건강한 임신하세요 💪",
    likes: 42, comments: 15, time: "8시간 전",
  },
];

const INFO_ITEMS = [
  { id: 1, category: "영양", emoji: "🥦", title: "임신 중 엽산 섭취의 중요성", summary: "엽산은 태아의 신경관 발달에 필수적입니다. 임신 초기부터 하루 400~600mcg 섭취가 권장됩니다.", source: "대한산부인과학회", badge: "의학 검증" },
  { id: 2, category: "운동", emoji: "🏊", title: "임산부 안전 운동 가이드", summary: "수영, 가벼운 걷기, 산전 요가는 임신 중 안전한 운동입니다. 주 3회, 30분 이내 권장.", source: "보건복지부", badge: "정부 공인" },
  { id: 3, category: "정신건강", emoji: "💙", title: "산전 우울증 이해하기", summary: "임산부 10~20%가 경험하는 산전 우울증. 전문가 상담이 중요하며 방치 시 산후 우울증으로 이어질 수 있습니다.", source: "WHO 가이드라인", badge: "WHO 인증" },
  { id: 4, category: "태아발달", emoji: "👶", title: "28주차 태아 발달 정보", summary: "임신 28주차에는 태아의 뇌가 빠르게 발달하며, 눈을 뜨고 감을 수 있게 됩니다. 체중은 약 1kg.", source: "대한산부인과학회", badge: "의학 검증" },
  { id: 5, category: "수면", emoji: "😴", title: "임산부 수면 가이드", summary: "좌측 수면 자세가 혈액순환에 가장 좋습니다. 무릎 사이에 베개를 끼우면 더욱 편안합니다.", source: "보건복지부", badge: "정부 공인" },
];


// ── Shared Components ──────────────────────────────────────────────────────
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

// 🚀 DashboardView에서 쓸 수 있도록 export 추가
export function BottomNav({ current, onNavigate }: { current: Screen; onNavigate: (s: Screen) => void }) {
  const tabs: Array<{ id: Screen; icon: typeof Home; label: string }> = [
    { id: "dashboard", icon: Home, label: "홈" },
    { id: "appliance", icon: Zap, label: "가전제어" },
    { id: "diary", icon: BookOpen, label: "다이어리" },
    { id: "profile", icon: User, label: "내정보" },
    { id: "settings", icon: Settings, label: "설정" },
  ];

  return (
    <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm border-t border-border px-2 py-2 flex justify-around">
      {tabs.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onNavigate(id)}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors"
          style={{
            color: current === id ? "#C94E70" : "var(--muted-foreground)",
          }}
        >
          <Icon size={20} />
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}

// ── APPLIANCE CONTROL VIEW ─────────────────────────────────────────────────
function ApplianceControlView({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [appliances, setAppliances] = useState<Record<string, boolean>>({
    moodLight: false,
    aircon: false,
    humidifier: false,
    dehumidifier: false,
    airPurifier: false,
  });
  const [applianceSettings, setApplianceSettings] = useState<Record<string, any>>({
    moodLight: { brightness: 50, color: "따뜻한 화이트", power: false },
    aircon: { temp: 24, mode: "냉방", fan: 2, power: true },
    humidifier: { humidity: 55, intensity: 2, power: false },
    dehumidifier: { humidity: 50, intensity: 2, power: false },
    airPurifier: { speed: 2, mode: "자동", power: true },
  });
  const [selectedAppliance, setSelectedAppliance] = useState<string | null>(null);

  const APPLIANCE_LIST = [
    { key: "moodLight", name: "무드등", icon: "💡" },
    { key: "aircon", name: "에어컨", icon: "❄️" },
    { key: "humidifier", name: "가습기", icon: "💧" },
    { key: "dehumidifier", name: "제습기", icon: "🌊" },
    { key: "airPurifier", name: "공기청정기", icon: "💨" },
  ];

  const getApplianceStatus = (key: string) => {
    const settings = applianceSettings[key];
    if (!settings) return "설정 없음";
    switch (key) {
      case "moodLight":
        return `${settings.color} • 밝기 ${settings.brightness}%`;
      case "airPurifier":
        return `${settings.mode} • 풍량 ${settings.speed}`;
      case "aircon":
        return `${settings.mode} ${settings.temp}℃ • 풍량 ${settings.fan}`;
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
      <div className="px-5 pt-12 pb-6" style={{ background: "linear-gradient(160deg, #FFE8EE 0%, #FFF5F7 100%)" }}>
        <h2 className="text-2xl font-bold" style={{ fontFamily: "'Nanum Myeongjo', serif", color: "#2D1B33" }}>
          LG ThinQ 가전 제어
        </h2>
        <p className="text-sm text-muted-foreground mt-1">집안의 모든 가전을 한 곳에서 제어하세요</p>
      </div>

      <div className="px-5 py-5 flex-1 overflow-y-auto pb-20">
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
                  onClick={() => setAppliances((prev) => ({ ...prev, [app.key]: !prev[app.key] }))}
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
                    onChange={(e) => setApplianceSettings((prev) => ({
                      ...prev,
                      moodLight: { ...prev.moodLight, brightness: parseInt(e.target.value) },
                    }))}
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
                        onClick={() => setApplianceSettings((prev) => ({
                          ...prev,
                          moodLight: { ...prev.moodLight, color },
                        }))}
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
                  <p className="text-sm font-medium text-foreground mb-2">온도 설정</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setApplianceSettings((prev) => ({
                        ...prev,
                        aircon: { ...prev.aircon, temp: Math.max(16, prev.aircon.temp - 1) },
                      }))}
                      className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="text-2xl font-bold flex-1 text-center" style={{ color: "#C94E70" }}>
                      {applianceSettings.aircon.temp}℃
                    </span>
                    <button
                      onClick={() => setApplianceSettings((prev) => ({
                        ...prev,
                        aircon: { ...prev.aircon, temp: Math.min(30, prev.aircon.temp + 1) },
                      }))}
                      className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
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

            {selectedAppliance === "humidifier" && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">목표 습도: {applianceSettings.humidifier.humidity}%</p>
                  <input
                    type="range"
                    min="30"
                    max="70"
                    value={applianceSettings.humidifier.humidity}
                    onChange={(e) => setApplianceSettings((prev) => ({
                      ...prev,
                      humidifier: { ...prev.humidifier, humidity: parseInt(e.target.value) },
                    }))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: "#C94E70" }}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>30%</span><span>70%</span>
                  </div>
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
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>30%</span><span>60%</span>
                  </div>
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

            {selectedAppliance === "airPurifier" && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">모드</p>
                  <div className="grid grid-cols-2 gap-2">
                    {["자동", "수면", "터보"].map((mode) => (
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

            <button
              onClick={() => setSelectedAppliance(null)}
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

// ── HOME VIEW ──────────────────────────────────────────────────────────────
function HomeView({
  onLogin, onRegister, onDemoLogin,
}: {
  onLogin: () => void;
  onRegister: () => void;
  onDemoLogin: (role: Role) => void;
}) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(160deg, #FFE8EE 0%, #FFF5F7 55%, #F5F0FF 100%)" }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="mb-8"
        >
          <div
            className="w-28 h-28 rounded-[2.5rem] flex items-center justify-center shadow-xl"
            style={{ background: "linear-gradient(135deg, #C94E70 0%, #E8789A 50%, #F4A4C0 100%)" }}
          >
            <span className="text-5xl">🌸</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-center mb-4"
        >
          <h1
            className="text-5xl font-bold mb-2"
            style={{ fontFamily: "'Nanum Myeongjo', serif", color: "#2D1B33" }}
          >
            맘달
          </h1>
          <p className="text-xs tracking-[0.3em] font-medium text-muted-foreground uppercase">MomDal Care</p>
        </motion.div>

        <motion.p
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-center text-muted-foreground leading-relaxed mb-8"
        >
          임신부터 출산까지,<br />당신의 모든 순간을 함께합니다
        </motion.p>

        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-2 justify-center mb-10"
        >
          {["🏠 스마트 가전", "💙 정신 케어 & 보호자", "🤖 AI 추천", "📋 검증 정보", "💬 커뮤니티"].map((f) => (
            <span
              key={f}
              className="text-xs px-3 py-1.5 rounded-full font-medium"
              style={{ background: "rgba(201, 78, 112, 0.1)", color: "#C94E70" }}
            >
              {f}
            </span>
          ))}
        </motion.div>

        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-xs flex flex-col gap-3"
        >
          <button
            onClick={onLogin}
            className="w-full py-4 rounded-2xl font-semibold text-white text-lg shadow-lg transition-all active:scale-95 hover:shadow-xl"
            style={{ background: "linear-gradient(135deg, #C94E70, #E8789A)" }}
          >
            로그인
          </button>
          <button
            onClick={onRegister}
            className="w-full py-4 rounded-2xl font-semibold text-lg transition-all active:scale-95 border-2 bg-white"
            style={{ borderColor: "#C94E70", color: "#C94E70" }}
          >
            회원가입
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-muted-foreground mb-3">데모 계정으로 빠른 체험</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => onDemoLogin("pregnant")}
              className="text-xs px-4 py-2 rounded-full border-2 transition-all hover:text-white"
              style={{ borderColor: "#C94E70", color: "#C94E70" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#C94E70"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              🤰 임산부 계정
            </button>
            <button
              onClick={() => onDemoLogin("guardian")}
              className="text-xs px-4 py-2 rounded-full border-2 transition-all hover:text-white"
              style={{ borderColor: "#7B68B5", color: "#7B68B5" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#7B68B5"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              👨 보호자 계정
            </button>
          </div>
        </motion.div>
      </div>

      <div className="py-6 text-center">
        <p className="text-xs text-muted-foreground">대한산부인과학회 · 보건복지부 · WHO 기반 검증 정보</p>
      </div>
    </div>
  );
}

// ── REGISTER VIEW ──────────────────────────────────────────────────────────
function RegisterView({ onBack, onSuccess }: { onBack: () => void; onSuccess: (u: AppUser) => void }) {
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [babyNickname, setBabyNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"pregnant" | "guardian">("pregnant");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    // 🚀 필수값 검증 로직만 수정 (태명은 임산부일 때만 필수)
    if (!name || !nickname || !email || !password || 
        (role === "pregnant" && !babyNickname) || 
        (role === "guardian" && !inviteCode)) {
      setError("모든 필수 항목을 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          password: password,
          name: name,
          role: role === "pregnant" ? "PREGNANT" : "GUARDIAN",
          start_date: startDate,
          baby_nickname: babyNickname, 
          input_connection_code: inviteCode
        }),
      });

      const result = await response.json();
      
      if (result.status === "Success") {
        const msg = result.connection_code 
          ? `회원가입 완료! 인증코드: ${result.connection_code}` 
          : "회원가입 완료!";
        alert(msg);
        onSuccess({ name, email, role, pregnancyWeek: 0 });
      } else {
        setError(result.error || "가입 실패");
      }
    } catch (e) {
      setError("서버와 통신할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #FFE8EE 0%, #FFF5F7 100%)" }}>
      <div className="px-5 py-4">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/60 transition-colors">
          <ArrowLeft size={22} style={{ color: "#C94E70" }} />
        </button>
      </div>

      <div className="px-8 pb-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold" style={{ fontFamily: "'Nanum Myeongjo', serif", color: "#2D1B33" }}>환영합니다! 🌸</h2>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-border space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {(["pregnant", "guardian"] as const).map((r) => {
              const [roleKey, emoji, label] = r === "pregnant" ? ["pregnant", "🤰", "임산부"] : ["guardian", "👨", "보호자"];
              return (
                <button key={roleKey} onClick={() => setRole(roleKey as any)} className="py-4 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all" style={{ borderColor: role === roleKey ? "#C94E70" : "var(--border)", background: role === roleKey ? "rgba(201, 78, 112, 0.06)" : "transparent" }}>
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-sm font-medium" style={{ color: role === roleKey ? "#C94E70" : "var(--muted-foreground)" }}>{label}</span>
                </button>
              );
            })}
          </div>

          <input placeholder="이름" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/40 text-sm" />
          <input placeholder="닉네임" value={nickname} onChange={e => setNickname(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/40 text-sm" />
          
          {role === "pregnant" && (
            <input placeholder="아기 태명" value={babyNickname} onChange={e => setBabyNickname(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/40 text-sm" />
          )}

          <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/40 text-sm" />
          <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/40 text-sm" />

          {role === "pregnant" ? (
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/40 text-sm" />
          ) : (
            <input placeholder="임산부 인증코드" value={inviteCode} onChange={e => setInviteCode(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-pink-300 bg-secondary/40 text-sm" />
          )}

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button onClick={handleRegister} disabled={loading} className="w-full py-3.5 rounded-xl font-semibold text-white mt-2" style={{ background: "linear-gradient(135deg, #C94E70, #E8789A)" }}>
            {loading ? "가입 중..." : "회원가입 완료"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── DISCOMFORT VIEW ────────────────────────────────────────────────────────
function DiscomfortView({
  onBack,
  onNavigate,
  onStatusUpdate,
}: {
  onBack: () => void;
  onNavigate?: (s: Screen) => void;
  onStatusUpdate?: (status: PartnerStatus) => void;
}) {
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
  const [appliances, setAppliances] = useState<Record<string, boolean>>({
    airPurifier: true, aircon: true, humidifier: false, dehumidifier: false,
  });
  const [applianceSettings, setApplianceSettings] = useState<Record<string, any>>({
    moodLight: { brightness: 50, color: "따뜻한 화이트", power: false },
    aircon: { temp: 24, mode: "냉방", fan: 2, power: true },
    humidifier: { humidity: 55, intensity: 2, power: false },
    dehumidifier: { humidity: 50, intensity: 2, power: false },
    airPurifier: { speed: 2, mode: "자동", power: true },
  });
  const [selectedAppliance, setSelectedAppliance] = useState<string | null>(null);

  const filteredSymptoms = ALL_SYMPTOMS.filter((s) =>
    s.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleArr = (arr: string[], val: string, set: (v: string[]) => void) =>
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  const getRecs = () => {
    const map: Record<string, { key: string; name: string; action: string; icon: string; reason: string }> = {};
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

  const handleSubmit = () => {
    const next = { ...appliances };
    getRecs().forEach((r) => { next[r.key] = true; });
    setAppliances(next);
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

  const APPLIANCE_LIST = [
    { key: "moodLight", name: "무드등", icon: "💡" },
    { key: "aircon", name: "에어컨", icon: "❄️" },
    { key: "humidifier", name: "가습기", icon: "💧" },
    { key: "dehumidifier", name: "제습기", icon: "🌊" },
    { key: "airPurifier", name: "공기청정기", icon: "💨" },
  ];

  const getApplianceStatus = (key: string) => {
    const settings = applianceSettings[key];
    if (!settings) return "설정 없음";
    switch (key) {
      case "moodLight":
        return `${settings.color} • 밝기 ${settings.brightness}%`;
      case "airPurifier":
        return `${settings.mode} • 풍량 ${settings.speed}`;
      case "aircon":
        return `${settings.mode} ${settings.temp}℃ • 풍량 ${settings.fan}`;
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
                        onClick={() => setAppliances((prev) => ({ ...prev, [app.key]: !prev[app.key] }))}
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
              onClick={() => setSelectedAppliance(null)}
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

// ── MENTAL CARE VIEW ───────────────────────────────────────────────────────
function MentalCareView({ user, onBack, onNavigate }: { user?: AppUser; onBack: () => void; onNavigate?: (s: Screen) => void }) {
  const [mood, setMood] = useState<number | null>(null);
  const [journal, setJournal] = useState("");
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"today" | "report" | "content">("today");

  const isGuardian = user?.role === "guardian";

  const MOODS = [
    { score: 1, emoji: "😔", label: "매우 힘든" },
    { score: 2, emoji: "😟", label: "힘든" },
    { score: 3, emoji: "😐", label: "보통" },
    { score: 4, emoji: "🙂", label: "좋은" },
    { score: 5, emoji: "😊", label: "매우 좋은" },
  ];

  const CONTENT = [
    { emoji: "🧘", title: "임산부 호흡 명상 5분", type: "명상", dur: "5분" },
    { emoji: "🌸", title: "긍정 확언 — 나는 좋은 엄마가 될 수 있어", type: "확언", dur: "3분" },
    { emoji: "🎵", title: "태교 음악 — 모차르트 클래식", type: "음악", dur: "20분" },
    { emoji: "📖", title: "산전 불안 이해하고 극복하기", type: "읽기", dur: "10분" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader title="정신 케어" onBack={onBack} />

      <div className="flex border-b border-border overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {([["today", "오늘의 감정"], ["report", "주간 리포트"], ["content", "추천 콘텐츠"]] as const).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="shrink-0 px-4 py-3 text-sm font-medium transition-colors"
            style={{
              color: tab === t ? "#7B68B5" : "var(--muted-foreground)",
              borderBottom: tab === t ? "2px solid #7B68B5" : "2px solid transparent",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="px-5 py-6 flex-1 overflow-y-auto pb-20">
        {tab === "today" && (
          <div className="space-y-6">
            <div>
              <p className="font-semibold text-foreground mb-3">오늘의 감정 일기</p>
              <p className="text-xs text-muted-foreground mb-3">
                💡 기분은 입력하신 내용에서 자동으로 분석됩니다
              </p>
              <textarea
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
                placeholder="오늘 마음이 어떤지 자유롭게 적어보세요. 여기서는 모든 감정이 유효해요 💙"
                rows={6}
                className="w-full px-4 py-3 rounded-2xl border border-border bg-card focus:outline-none focus:border-primary text-sm resize-none leading-relaxed"
              />
            </div>

            {!saved ? (
              <button
                onClick={() => { if (journal) setSaved(true); }}
                disabled={!journal}
                className="w-full py-4 rounded-2xl font-semibold text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #7B68B5, #9B8EC4)" }}
              >
                오늘의 감정 저장하기
              </button>
            ) : (
              <div
                className="rounded-2xl p-5 text-center"
                style={{ background: "rgba(123,104,181,0.08)", border: "1.5px solid rgba(123,104,181,0.2)" }}
              >
                <p className="text-2xl mb-2">💙</p>
                <p className="font-semibold text-foreground">오늘의 감정이 기록되었어요</p>
                <p className="text-sm text-muted-foreground mt-1">소중한 감정을 나눠주셔서 감사해요</p>
              </div>
            )}
          </div>
        )}

        {tab === "report" && (
          <div className="space-y-6">
            <div>
              <p className="font-semibold text-foreground mb-1">이번 주 감정 변화</p>
              <p className="text-xs text-muted-foreground mb-4">5점 만점 기준</p>
              <div className="bg-card rounded-2xl p-4 border border-border">
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={MOOD_HISTORY}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#967A86" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[1, 5]} tick={{ fontSize: 11, fill: "#967A86" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ border: "none", borderRadius: "12px", background: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                      formatter={(v: number) => [`${v}점`, "기분"]}
                    />
                    <Line type="monotone" dataKey="score" stroke="#7B68B5" strokeWidth={2.5} dot={{ fill: "#7B68B5", r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "평균 기분", value: "3.5점", emoji: "🙂" },
                { label: "최고의 날", value: "일요일", emoji: "😊" },
                { label: "기록 일수", value: "7일", emoji: "📅" },
              ].map((s) => (
                <div key={s.label} className="bg-card rounded-2xl p-3 border border-border text-center">
                  <p className="text-xl mb-1">{s.emoji}</p>
                  <p className="font-bold text-sm text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            <div
              className="rounded-2xl p-4"
              style={{ background: "rgba(123,104,181,0.06)", border: "1.5px solid rgba(123,104,181,0.15)" }}
            >
              <p className="font-semibold text-sm" style={{ color: "#7B68B5" }}>💜 이번 주 분석</p>
              <p className="text-sm text-foreground mt-2 leading-relaxed">
                전반적으로 안정적인 감정 패턴을 보이고 있어요. 목요일 기분이 낮았는데, 휴식을 충분히 취하셨나요? 꾸준한 기록이 큰 도움이 됩니다 💙
              </p>
            </div>
          </div>
        )}

        {tab === "content" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">감정 패턴에 맞춘 추천 콘텐츠예요</p>
            {CONTENT.map((c, i) => (
              <div key={i} className="bg-card rounded-2xl p-4 border border-border flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: "rgba(123,104,181,0.1)" }}
                >
                  {c.emoji}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-foreground">{c.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(123,104,181,0.1)", color: "#7B68B5" }}>
                      {c.type}
                    </span>
                    <span className="text-xs text-muted-foreground">{c.dur}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            ))}

            <div
              className="rounded-2xl p-4 text-center mt-2"
              style={{ background: "rgba(201,78,112,0.05)", border: "1.5px solid rgba(201,78,112,0.1)" }}
            >
              <p className="text-sm font-medium text-foreground">우울·불안 지수가 높을 때는</p>
              <p className="text-xs text-muted-foreground mt-1 mb-3">전문 상담사와 연결되어 도움받을 수 있어요</p>
              <button className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "#C94E70" }}>
                전문 상담 연결하기
              </button>
            </div>
          </div>
        )}

      </div>

      {onNavigate && <BottomNav current="dashboard" onNavigate={onNavigate} />}
    </div>
  );
}

// ── AI RECOMMEND VIEW ──────────────────────────────────────────────────────
function AIRecommendView({ user, onBack, onNavigate }: { user: AppUser; onBack: () => void; onNavigate?: (s: Screen) => void }) {
  const w = user.pregnancyWeek;
  const [tab, setTab] = useState<"recommend" | "stretch" | "content">("recommend");

  const STRETCH_VIDEOS = [
    { id: 1, title: "임신 초기 전신 스트레칭", week: "1-12주", duration: "10분", thumbnail: "🧘‍♀️", category: "주차별" },
    { id: 2, title: "임신 중기 골반 강화 운동", week: "13-27주", duration: "15분", thumbnail: "🤸‍♀️", category: "주차별" },
    { id: 3, title: "임신 후기 부종 완화 스트레칭", week: "28-40주", duration: "12분", thumbnail: "🦵", category: "주차별" },
    { id: 4, title: "입덧 완화를 위한 호흡법", duration: "5분", thumbnail: "🌬️", category: "상황별", situation: "입덧" },
    { id: 5, title: "허리 통증 완화 스트레칭", duration: "8분", thumbnail: "💆‍♀️", category: "상황별", situation: "허리통증" },
    { id: 6, title: "수면 전 이완 요가", duration: "10분", thumbnail: "🌙", category: "상황별", situation: "수면장애" },
    { id: 7, title: "붓기 완화 다리 마사지", duration: "7분", thumbnail: "🦶", category: "상황별", situation: "붓기" },
  ];

  const CONTENT_ITEMS = [
    { id: 1, title: "28주차 태아 발달 이야기", type: "뉴스레터", emoji: "📰", week: 28 },
    { id: 2, title: "임신 중 영양 관리 가이드", type: "영상", emoji: "🎥", week: null },
    { id: 3, title: "출산 준비 체크리스트", type: "뉴스레터", emoji: "📋", week: 32 },
    { id: 4, title: "임신성 당뇨 예방법", type: "영상", emoji: "🎬", week: null },
  ];

  const getData = (wk: number) => {
    if (wk <= 12) return {
      fetalSize: "라임", fetalWeight: "14g",
      highlight: "주요 장기가 형성되는 중요한 시기입니다",
      foods: ["엽산 풍부한 시금치", "단백질 풍부한 달걀", "생강차 (입덧 완화)", "냉수 조금씩 자주"],
      activities: ["가벼운 산책 15분", "심호흡 운동", "명상 10분"],
      warnings: ["날 해산물 피하기", "카페인 하루 200mg 이하", "격렬한 운동 금지"],
    };
    if (wk <= 27) return {
      fetalSize: "코코넛", fetalWeight: "660g",
      highlight: "태동이 활발해지는 시기입니다",
      foods: ["철분 풍부한 시금치", "칼슘 풍부한 두부", "비타민D를 위한 달걀 노른자", "오메가3를 위한 연어"],
      activities: ["수영 30분", "산전 요가", "좌측 수면 연습"],
      warnings: ["배 압박 자세 피하기", "장시간 서있기 자제", "무거운 물건 들기 금지"],
    };
    return {
      fetalSize: "수박", fetalWeight: "약 1kg",
      highlight: "태아가 빠르게 성장하는 시기입니다",
      foods: ["저염 식단 실천", "수분 충분히 섭취", "소량 자주 식사", "철분제 꾸준히"],
      activities: ["가벼운 산책", "골반 운동", "좌측 수면 자세"],
      warnings: ["붓기 심하면 즉시 병원", "급격한 체중 증가 주의", "좌식 자세 오래 하지 않기"],
    };
  };

  const data = getData(w);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader title="AI 맞춤 추천" onBack={onBack} />

      <div className="flex border-b border-border">
        {([["recommend", "주차별 추천"], ["stretch", "스트레칭"], ["content", "콘텐츠"]] as const).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-3 text-sm font-medium transition-colors"
            style={{
              color: tab === t ? "#FFAB76" : "var(--muted-foreground)",
              borderBottom: tab === t ? "2px solid #FFAB76" : "2px solid transparent",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="px-5 py-6 space-y-5 flex-1 overflow-y-auto pb-20">
        {tab === "recommend" && (
          <>
            <div
              className="rounded-2xl p-5 text-white"
              style={{ background: "linear-gradient(135deg, #FFAB76, #FF7A45)" }}
            >
              <p className="text-white/80 text-xs mb-1">현재 임신 주차</p>
              <div className="flex items-end gap-3 mb-2">
                <span className="text-4xl font-bold">{w}주차</span>
                <span className="text-white/80 text-sm mb-1">{user.babyNickname || "태아"} 크기: {data.fetalSize} ({data.fetalWeight})</span>
              </div>
              <p className="text-white/90 text-sm">{data.highlight}</p>
            </div>

        <div
          className="rounded-xl p-3 flex items-center gap-2 text-sm"
          style={{ background: "rgba(201,78,112,0.06)", border: "1px solid rgba(201,78,112,0.15)" }}
        >
          <span>🤖</span>
          <p className="text-muted-foreground">
            오늘 기록한 상태와 <span className="font-semibold" style={{ color: "#C94E70" }}>{w}주차 가이드라인</span>을 함께 분석했어요
          </p>
        </div>

        {[
          { icon: "🍎", title: "추천 식품", items: data.foods, indicator: <CheckCircle size={16} style={{ color: "#69C99A", flexShrink: 0 }} />, grid: true },
          { icon: "🏃", title: "권장 활동", items: data.activities, indicator: <CheckCircle size={16} style={{ color: "#69C99A", flexShrink: 0 }} />, grid: false },
          { icon: "⚠️", title: "주의 사항", items: data.warnings, indicator: <AlertTriangle size={16} style={{ color: "#FF9A56", flexShrink: 0 }} />, grid: false },
        ].map((section) => (
          <div key={section.title}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{section.icon}</span>
              <p className="font-semibold text-foreground">{section.title}</p>
            </div>
            {section.grid ? (
              <div className="grid grid-cols-2 gap-2">
                {section.items.map((item, i) => (
                  <div key={i} className="bg-card rounded-xl p-3 border border-border">
                    <p className="text-sm text-foreground">{item}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {section.items.map((item, i) => (
                  <div key={i} className="bg-card rounded-xl p-3 border border-border flex items-center gap-3">
                    {section.indicator}
                    <p className="text-sm text-foreground">{item}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

            <p className="text-xs text-center text-muted-foreground pb-2">
              이 정보는 대한산부인과학회 가이드라인 기준입니다 · 의사 상담을 대체하지 않습니다
            </p>
          </>
        )}

        {tab === "stretch" && (
          <>
            <div
              className="rounded-xl p-3 flex items-center gap-2 text-sm"
              style={{ background: "rgba(255,171,118,0.06)", border: "1px solid rgba(255,171,118,0.15)" }}
            >
              <span>🧘‍♀️</span>
              <p className="text-muted-foreground">
                <span className="font-semibold" style={{ color: "#FFAB76" }}>{w}주차</span>에 맞는 스트레칭을 추천해드려요
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground mb-3">주차별 추천</p>
              <div className="space-y-3">
                {STRETCH_VIDEOS.filter((v) => v.category === "주차별").map((video) => (
                  <div key={video.id} className="bg-card rounded-2xl p-4 border border-border flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl shrink-0"
                      style={{ background: "rgba(255,171,118,0.1)" }}
                    >
                      {video.thumbnail}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-foreground">{video.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,171,118,0.1)", color: "#FFAB76" }}>
                          {video.week}
                        </span>
                        <span className="text-xs text-muted-foreground">{video.duration}</span>
                      </div>
                    </div>
                    <button className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#FFAB76" }}>
                      <Play size={16} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground mb-3">상황별 스트레칭</p>
              <div className="space-y-3">
                {STRETCH_VIDEOS.filter((v) => v.category === "상황별").map((video) => (
                  <div key={video.id} className="bg-card rounded-2xl p-4 border border-border flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl shrink-0"
                      style={{ background: "rgba(255,171,118,0.1)" }}
                    >
                      {video.thumbnail}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-foreground">{video.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(123,104,181,0.1)", color: "#7B68B5" }}>
                          {video.situation}
                        </span>
                        <span className="text-xs text-muted-foreground">{video.duration}</span>
                      </div>
                    </div>
                    <button className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#FFAB76" }}>
                      <Play size={16} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === "content" && (
          <>
            <div
              className="rounded-xl p-3 flex items-center gap-2 text-sm"
              style={{ background: "rgba(255,171,118,0.06)", border: "1px solid rgba(255,171,118,0.15)" }}
            >
              <span>📚</span>
              <p className="text-muted-foreground">
                임신 단계별 유용한 콘텐츠를 모았어요
              </p>
            </div>

            <div className="space-y-3">
              {CONTENT_ITEMS.map((item) => (
                <div key={item.id} className="bg-card rounded-2xl p-4 border border-border">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                      style={{ background: "rgba(255,171,118,0.1)" }}
                    >
                      {item.emoji}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: "rgba(255,171,118,0.1)", color: "#FFAB76" }}
                        >
                          {item.type}
                        </span>
                        {item.week && (
                          <span className="text-xs text-muted-foreground">{item.week}주차</span>
                        )}
                      </div>
                      <p className="font-medium text-sm text-foreground">{item.title}</p>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {onNavigate && <BottomNav current="dashboard" onNavigate={onNavigate} />}
    </div>
  );
}

// ── INFO VIEW ──────────────────────────────────────────────────────────────
function InfoView({ onBack, onNavigate }: { onBack: () => void; onNavigate?: (s: Screen) => void }) {
  type ChatSource = { title: string; organization: string; url: string };
  type ChatCareLevel = "information" | "clarify" | "contact_now" | "emergency";
  type ChatMessage = { role: "user" | "assistant"; text: string; sources?: ChatSource[]; careLevel?: ChatCareLevel; responseMode?: string };
  const [cat, setCat] = useState("전체");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "안녕하세요! 임신 관련 의학 정보를 도와드리겠습니다. 궁금하신 점을 물어보세요." },
  ]);
  const [input, setInput] = useState("");

  const CATS = ["전체", "영양", "운동", "정신건강", "태아발달", "수면"];
  const filtered = cat === "전체" ? INFO_ITEMS : INFO_ITEMS.filter((i) => i.category === cat);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");

    try {
      const response = await fetch("http://127.0.0.1:8001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: messages.map(({ role, text, responseMode }) => ({ role, text, responseMode })),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "상담 서버에서 응답을 받지 못했습니다.");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.answer,
          sources: data.sources,
          careLevel: data.careLevel,
          responseMode: data.responseMode,
        },
      ]);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "상담 서버 연결에 실패했습니다.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `현재 AI 상담을 연결할 수 없습니다. ${detail}`,
        },
      ]);
    }
  };

  const BADGE_COLORS: Record<string, string> = {
    "의학 검증": "#2D7A9A",
    "정부 공인": "#2D6B45",
    "WHO 인증": "#6B5D2D",
  };
  const CARE_LABELS: Partial<Record<ChatCareLevel, { text: string; background: string; color: string }>> = {
    clarify: { text: "증상을 조금 더 알려주세요", background: "#F5F1E9", color: "#6B5D2D" },
    contact_now: { text: "지금 의료진 확인이 필요해요", background: "#FFF0E6", color: "#9A4D20" },
    emergency: { text: "즉시 도움을 요청하세요", background: "#FDECEC", color: "#A12828" },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader title="신뢰할 수 있는 정보" onBack={onBack} />
      <div className="px-5 py-5 space-y-5 flex-1 overflow-y-auto pb-20">
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: "rgba(45,122,154,0.08)", border: "1px solid rgba(45,122,154,0.2)" }}
        >
          <Shield size={18} style={{ color: "#2D7A9A" }} />
          <p className="text-sm text-foreground">
            <span className="font-semibold">검증된 출처만</span> — 대한산부인과학회, 보건복지부, WHO 기반
          </p>
        </div>

        <button
          onClick={() => setShowChatbot(true)}
          className="w-full py-4 rounded-2xl font-semibold text-white shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #2D7A9A, #4A9AB8)" }}
        >
          <MessageCircle size={18} />
          의학 정보 AI 챗봇 상담
        </button>

        <div className="grid grid-cols-3 gap-2">
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                background: cat === c ? "#C94E70" : "var(--secondary)",
                color: cat === c ? "white" : "var(--muted-foreground)",
              }}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((item) => (
            <div key={item.id} className="bg-card rounded-2xl border border-border overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{item.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                        style={{ background: BADGE_COLORS[item.badge] || "#888" }}
                      >
                        {item.badge}
                      </span>
                      <span className="text-xs text-muted-foreground">{item.source}</span>
                    </div>
                    <p className="font-semibold text-sm text-foreground">{item.title}</p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-muted-foreground mt-1 transition-transform duration-200"
                    style={{ transform: expanded === item.id ? "rotate(90deg)" : "rotate(0)" }}
                  />
                </div>
              </button>
              {expanded === item.id && (
                <div className="px-4 pb-4 border-t border-border">
                  <p className="text-sm text-foreground leading-relaxed mt-3">{item.summary}</p>
                  <button className="mt-3 text-xs font-medium" style={{ color: "#C94E70" }}>
                    원문 출처 보기 →
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showChatbot && (
        <div className="absolute inset-0 bg-background z-50 flex flex-col">
          <div className="flex items-center gap-3 px-5 py-4 bg-card/90 backdrop-blur-sm border-b border-border">
            <button onClick={() => setShowChatbot(false)} className="p-2 rounded-xl hover:bg-secondary transition-colors">
              <ArrowLeft size={20} className="text-foreground" />
            </button>
            <h1 className="font-semibold text-foreground">의학 정보 AI 상담</h1>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[80%] px-4 py-3 rounded-2xl"
                  style={{
                    background: msg.role === "user" ? "#C94E70" : "var(--card)",
                    color: msg.role === "user" ? "white" : "var(--foreground)",
                    border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
                  }}
                >
                  {msg.role === "assistant" && msg.careLevel && CARE_LABELS[msg.careLevel] && (
                    <span
                      className="inline-block text-xs font-semibold rounded-full px-2.5 py-1 mb-2"
                      style={{
                        background: CARE_LABELS[msg.careLevel]!.background,
                        color: CARE_LABELS[msg.careLevel]!.color,
                      }}
                    >
                      {CARE_LABELS[msg.careLevel]!.text}
                    </span>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
                  {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border space-y-1">
                      {msg.sources.map((source) => (
                        <a
                          key={source.url}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-xs font-medium underline break-words"
                          style={{ color: "#2D7A9A" }}
                        >
                          출처 보기: {source.organization} - {source.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-4 bg-card/90 backdrop-blur-sm border-t border-border">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="궁금한 점을 물어보세요..."
                className="flex-1 px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim()}
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white disabled:opacity-50"
                style={{ background: "#C94E70" }}
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              이 정보는 의사 상담을 대체하지 않습니다. 심각한 증상은 즉시 병원을 방문하세요.
            </p>
          </div>
        </div>
      )}

      {onNavigate && <BottomNav current="dashboard" onNavigate={onNavigate} />}
    </div>
  );
}

// ── DIARY VIEW ─────────────────────────────────────────────────────────────


// ── PROFILE VIEW ───────────────────────────────────────────────────────────
function ProfileView({ user, onNavigate }: { user: AppUser; onNavigate: (s: Screen) => void }) {
  const isPregnant = user.role === "pregnant";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-5 pt-12 pb-6" style={{ background: "linear-gradient(160deg, #FFE8EE 0%, #FFF5F7 100%)" }}>
        <h2 className="text-2xl font-bold mb-5" style={{ fontFamily: "'Nanum Myeongjo', serif", color: "#2D1B33" }}>
          내 정보
        </h2>

        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
            style={{ background: "linear-gradient(135deg, #C94E70, #E8789A)" }}
          >
            {isPregnant ? "🤰" : "👨"}
          </div>
          <div>
            <p className="font-bold text-xl text-foreground">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {user.babyNickname && (
              <p className="text-xs text-muted-foreground mt-0.5">아기 태명: {user.babyNickname}</p>
            )}
            <span
              className="inline-block mt-1 text-xs px-3 py-1 rounded-full font-medium"
              style={{ background: "rgba(201,78,112,0.1)", color: "#C94E70" }}
            >
              {isPregnant ? "임산부" : "보호자"}
            </span>
          </div>
        </div>

        {isPregnant && (
          <>
            <div
              className="rounded-2xl px-5 py-4"
              style={{ background: "linear-gradient(135deg, #C94E70, #E8789A)", color: "white" }}
            >
              <p className="text-white/80 text-xs font-medium">현재 임신</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{user.pregnancyWeek}주차</p>
                  <p className="text-white/80 text-xs mt-0.5">D+{user.pregnancyWeek * 7}일</p>
                </div>
                <div className="text-right">
                  <p className="text-white/80 text-xs">출산 예정일까지</p>
                  <p className="text-xl font-bold">{280 - user.pregnancyWeek * 7}일</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-border mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">보호자 초대 인증코드</p>
                  <p className="text-xl font-bold mt-1" style={{ color: "#C94E70", letterSpacing: "2px" }}>
                    {user.inviteCode || "MOMDAL28"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(user.inviteCode || "MOMDAL28");
                    alert("인증코드가 복사되었습니다!");
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-white"
                  style={{ background: "#C94E70" }}
                >
                  복사
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">보호자 회원가입 시 이 코드를 입력해야 합니다</p>
            </div>
          </>
        )}
      </div>

      <div className="px-5 py-5 flex-1 space-y-4 overflow-y-auto pb-20">
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">활동 통계</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "일기 작성", value: "12회", emoji: "📖" },
              { label: "감정 기록", value: "18회", emoji: "💙" },
              { label: "커뮤니티", value: "5개", emoji: "💬" },
            ].map((stat) => (
              <div key={stat.label} className="bg-card rounded-2xl p-3 border border-border text-center">
                <p className="text-xl mb-1">{stat.emoji}</p>
                <p className="font-bold text-sm text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {isPregnant && (
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">임신 정보</p>
            <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
              {[
                { label: "출산 예정일", value: "2026년 10월 15일" },
                { label: "최근 검진일", value: "2026년 5월 20일" },
                { label: "다음 검진일", value: "2026년 6월 10일" },
                
              ].map((info) => (
                <div key={info.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <p className="text-sm text-muted-foreground">{info.label}</p>
                  <p className="text-sm font-medium text-foreground">{info.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-sm font-semibold text-foreground mb-3">건강 기록</p>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-foreground">평균 기분 점수</p>
              <p className="font-bold text-foreground">3.5 / 5.0</p>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: "70%", background: "#7B68B5" }} />
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl p-4 text-center"
          style={{ background: "rgba(201,78,112,0.05)", border: "1px solid rgba(201,78,112,0.1)" }}
        >
          <p className="text-sm font-medium text-foreground">더 많은 정보를 관리하고 싶으신가요?</p>
          <p className="text-xs text-muted-foreground mt-1 mb-3">설정에서 상세 정보를 수정할 수 있어요</p>
          <button
            onClick={() => onNavigate("settings")}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#C94E70" }}
          >
            설정으로 이동
          </button>
        </div>
      </div>

      <BottomNav current="profile" onNavigate={onNavigate} />
    </div>
  );
}

// ── SETTINGS VIEW ──────────────────────────────────────────────────────────

// ── SMALLTALK VIEW ─────────────────────────────────────────────────────────


// ── COMMUNITY VIEW ─────────────────────────────────────────────────────────


// ── MAIN APP ───────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [user, setUser] = useState<AppUser | null>(null);
  const [partnerStatus, setPartnerStatus] = useState<PartnerStatus | null>(null);

  const go = (s: Screen) => setScreen(s);
  const back = () => setScreen(user ? "dashboard" : "home");

  const login = (u: AppUser) => { setUser(u); setScreen("dashboard"); };
  const logout = () => { setUser(null); setScreen("home"); };

  const demoLogin = (role: Role) => {
    const found = DEMO_USERS.find((u) => u.role === role)!;
    login({ name: found.name, nickname: found.nickname, babyNickname: found.babyNickname, email: found.email, role: found.role, pregnancyWeek: found.pregnancyWeek, inviteCode: found.inviteCode });
  };

  return (
    <div className="size-full flex items-center justify-center" style={{ background: "#EDE0E5" }}>
      <div
        className="w-full max-w-[430px] h-screen overflow-y-auto relative bg-background shadow-2xl"
        style={{ scrollbarWidth: "none" }}
      >
        {screen === "home" && <HomeView onLogin={() => go("login")} onRegister={() => go("register")} onDemoLogin={demoLogin} />}
        {screen === "login" && <LoginView onBack={() => go("home")} onSuccess={login} onRegister={() => go("register")} />}
        {screen === "register" && <RegisterView onBack={() => go("home")} onSuccess={login} />}
        {screen === "dashboard" && user && <DashboardView user={user} onNavigate={go} onLogout={logout} partnerStatus={partnerStatus} />}
        {screen === "discomfort" && <DiscomfortView onBack={back} onNavigate={go} onStatusUpdate={setPartnerStatus} />}
        {screen === "mental" && <MentalCareView user={user} onBack={back} onNavigate={go} />}
        {screen === "ai" && user && <AIRecommendView user={user} onBack={back} onNavigate={go} />}
        {screen === "info" && <InfoView onBack={back} onNavigate={go} />}
        {screen === "community" && user && <CommunityView user={user} onBack={back} onNavigate={go} />}
        {screen === "smalltalk" && user && <SmallTalkView user={user} onBack={back} onNavigate={go} />}
        {screen === "diary" && user && <DiaryView user={user} onNavigate={go} />}
        {screen === "profile" && user && <ProfileView user={user} onNavigate={go} />}
        {screen === "settings" && user && <SettingsView user={user} onNavigate={go} onLogout={logout} />}
        {screen === "appliance" && <ApplianceControlView onNavigate={go} />}
      </div>
    </div>
  );
}
