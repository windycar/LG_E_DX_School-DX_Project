import { useState } from "react";
import { motion } from "motion/react";
import { BookOpen, Home, Settings, User, Zap } from "lucide-react";

import { AppUser, PartnerStatus, Screen } from "./types";
import LoginView from "./LoginView";
import RegisterView from "./RegisterView";
import DashboardView from "./DashboardView";
import AdminView from "./AdminView";
import SmallTalkView from "./SmalltalkView";
import CommunityView from "./CommunityView";
import SettingsView from "./SettingsView";
import DiaryView from "./DiaryView";
import ProfileView from "./ProfileView";
import ApplianceControlView from "./ApplianceControlView";
import DiscomfortView from "./DiscomfortView";
import MentalCareView from "./MentalCareView";
import AIRecommendView from "./AIRecommendView";
import MissionView from "./MissionView";
import InfoView from "./InfoView";
import PregnancyBenefitsView from "./PregnancyBenefitsView";

export function BottomNav({ current, onNavigate }: { current: Screen; onNavigate: (screen: Screen) => void }) {
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
          style={{ color: current === id ? "#C94E70" : "var(--muted-foreground)" }}
        >
          <Icon size={20} />
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}

function HomeView({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
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
            MOMent
          </h1>
          <p className="text-xs tracking-[0.3em] font-medium text-muted-foreground uppercase"></p>
        </motion.div>

        <motion.p
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-center text-muted-foreground leading-relaxed mb-8"
        >
          임신부터 출산까지,
          <br />
          당신의 모든 순간을 함께합니다
        </motion.p>

        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-2 justify-center mb-10"
        >
          {["🏠 스마트 가전", "💙 정신 케어 & 보호자", "🤖 AI 추천", "📋 검증 정보", "💬 커뮤니티"].map((feature) => (
            <span
              key={feature}
              className="text-xs px-3 py-1.5 rounded-full font-medium"
              style={{ background: "rgba(201, 78, 112, 0.1)", color: "#C94E70" }}
            >
              {feature}
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
      </div>

      <div className="py-6 text-center">
        <p className="text-xs text-muted-foreground">대한산부인과학회 · 보건복지부 · WHO 기반 검증 정보</p>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [user, setUser] = useState<AppUser | null>(null);
  const [partnerStatus, setPartnerStatus] = useState<PartnerStatus | null>(null);

  const go = (nextScreen: Screen) => setScreen(nextScreen);
  const back = () => setScreen(user?.role === "admin" ? "admin" : user ? "dashboard" : "home");
  const login = (nextUser: AppUser) => {
    setUser(nextUser);
    setScreen(nextUser.role === "admin" ? "admin" : "dashboard");
  };
  const logout = () => {
    setUser(null);
    setScreen("home");
  };
  const impersonateUser = (target: AppUser) => {
    setUser(target);
    setScreen("dashboard");
  };

  return (
    <div className="size-full flex items-center justify-center" style={{ background: "#EDE0E5" }}>
      <div
        className="w-full max-w-[430px] h-screen overflow-y-auto relative bg-background shadow-2xl"
        style={{ scrollbarWidth: "none" }}
      >
        {screen === "home" && <HomeView onLogin={() => go("login")} onRegister={() => go("register")} />}
        {screen === "login" && <LoginView onBack={() => go("home")} onSuccess={login} onRegister={() => go("register")} />}
        {screen === "register" && <RegisterView onBack={() => go("home")} onSuccess={login} />}
        {screen === "dashboard" && user && <DashboardView user={user} onNavigate={go} onLogout={logout} partnerStatus={partnerStatus} />}
        {screen === "admin" && user?.role === "admin" && <AdminView user={user} onLogout={logout} onImpersonate={impersonateUser} />}
        {screen === "discomfort" && <DiscomfortView user={user} onBack={back} onNavigate={go} onStatusUpdate={setPartnerStatus} />}
        {screen === "mental" && user && <MentalCareView user={user} onBack={back} onNavigate={go} />}
        {screen === "ai" && user && <AIRecommendView user={user} onBack={back} onNavigate={go} />}
        {screen === "mission" && user && <MissionView user={user} onBack={back} onNavigate={go} partnerStatus={partnerStatus} />}
        {screen === "info" && <InfoView onBack={back} onNavigate={go} />}
        {screen === "benefits" && <PregnancyBenefitsView user={user} onBack={() => go("info")} onNavigate={go} />}
        {screen === "community" && user && <CommunityView user={user} onBack={back} onNavigate={go} />}
        {screen === "smalltalk" && user && <SmallTalkView user={user} onBack={back} onNavigate={go} />}
        {screen === "diary" && user && <DiaryView user={user} onNavigate={go} />}
        {screen === "profile" && user && <ProfileView user={user} onNavigate={go} />}
        {screen === "settings" && user && <SettingsView user={user} onNavigate={go} onLogout={logout} />}
        {screen === "appliance" && <ApplianceControlView user={user} onNavigate={go} />}
      </div>
    </div>
  );
}
