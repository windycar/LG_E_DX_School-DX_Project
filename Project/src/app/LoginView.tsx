import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { AppUser } from "./types";

export default function LoginView({
  onBack, onSuccess, onRegister,
}: {
  onBack: () => void;
  onSuccess: (u: AppUser) => void;
  onRegister: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});

      const data = await response.json();

      if (response.ok && data.status === "Success") {
        const userInfo = data.user;
        
        // 🚀 유저 정보에서 날짜를 빼서 주차를 계산합니다.
        let calcWeek = 0;
        const targetDate = userInfo.role === "PREGNANT" 
          ? userInfo.pregnancy_start_date 
          : userInfo.connected_pregnant?.pregnancy_start_date;

        if (targetDate) {
          const start = new Date(targetDate);
          const today = new Date();
          const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          calcWeek = Math.max(0, Math.floor(diffDays / 7));
        }
        
        onSuccess({
          name: userInfo.name,
          nickname: userInfo.name, 
          babyNickname: userInfo.baby_nickname || "아기", 
          email: email,
          role: userInfo.role === "PREGNANT" ? "pregnant" : "guardian",
          pregnancyWeek: calcWeek, 
          user_id: userInfo.user_id,
          parent_user_id: userInfo.parent_user_id,
          connected_pregnant: userInfo.connected_pregnant
        });
      } else {
        setError(data.detail || "이메일 또는 비밀번호가 올바르지 않습니다.");
      }
    } catch (err) {
      setError("서버와 통신할 수 없습니다. 백엔드 서버를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #FFE8EE 0%, #FFF5F7 100%)" }}>
      <div className="px-5 py-4">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/60 transition-colors">
          <ArrowLeft size={22} style={{ color: "#C94E70" }} />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-8 -mt-8">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md" style={{ background: "linear-gradient(135deg, #C94E70, #E8789A)" }}>
            <span className="text-3xl">🌸</span>
          </div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: "'Nanum Myeongjo', serif", color: "#2D1B33" }}>다시 오셨군요 👋</h2>
          <p className="text-muted-foreground text-sm mt-1">맘달 계정으로 로그인하세요</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-border space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">이메일</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일을 입력하세요" className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/40 focus:outline-none focus:border-primary text-sm transition-colors" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">비밀번호</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호를 입력하세요" onKeyDown={(e) => e.key === "Enter" && handleLogin()} className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/40 focus:outline-none focus:border-primary text-sm transition-colors" />
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button onClick={handleLogin} disabled={loading || !email || !password} className="w-full py-3.5 rounded-xl font-semibold text-white transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed mt-2" style={{ background: "linear-gradient(135deg, #C94E70, #E8789A)" }}>
            {loading ? "로그인 중..." : "로그인"}
          </button>

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3">데모 계정으로 빠른 로그인</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setEmail("mom@demo.kr"); setPassword("1234"); }} className="text-xs py-2 px-2 rounded-lg border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors">🤰 임산부 계정</button>
              <button onClick={() => { setEmail("dad@demo.kr"); setPassword("1234"); }} className="text-xs py-2 px-2 rounded-lg border border-border text-muted-foreground transition-colors hover:border-purple-500 hover:text-purple-500">👨 보호자 계정</button>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          아직 계정이 없으신가요?{" "}
          <button onClick={onRegister} className="font-semibold" style={{ color: "#C94E70" }}>회원가입</button>
        </p>
      </div>
    </div>
  );
}