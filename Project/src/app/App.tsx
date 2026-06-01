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
import ProfileView from './ProfileView.tsx';

import ApplianceControlView from "./ApplianceControlView";
import DiscomfortView from "./DiscomfortView";
import MentalCareView from "./MentalCareView.tsx"
import AIRecommendView from "./AIRecommendView";
import MissionView from "./MissionView";
import InfoView from "./InfoView";
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


// ── AI RECOMMEND VIEW ──────────────────────────────────────────────────────


// ── INFO VIEW ─────────────────────────────────────────────────────────────
// InfoView is split into ./InfoView.tsx

// ── DIARY VIEW ─────────────────────────────────────────────────────────────


// ── PROFILE VIEW ───────────────────────────────────────────────────────────


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
        {screen === "discomfort" && <DiscomfortView user={user} onBack={back} onNavigate={go} onStatusUpdate={setPartnerStatus} />}
        {screen === "mental" && user && <MentalCareView user={user} onBack={back} onNavigate={go} />}
        {screen === "ai" && user && <AIRecommendView user={user} onBack={back} onNavigate={go} />}
        {screen === "mission" && user && <MissionView user={user} onBack={back} onNavigate={go} partnerStatus={partnerStatus} />}
        {screen === "info" && <InfoView onBack={back} onNavigate={go} />}
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
