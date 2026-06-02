import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { apiUrl } from "./api";
import { AppUser } from "./types";

export default function RegisterView({ onBack, onSuccess }: { onBack: () => void; onSuccess: (u: AppUser) => void }) {
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
    // 🚀 필수값 검증 로직 (태명은 임산부일 때만 필수)
    if (!name || !nickname || !email || !password || 
        (role === "pregnant" && !babyNickname) || 
        (role === "guardian" && !inviteCode)) {
      setError("모든 필수 항목을 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 🚀 로컬 백엔드 주소로 명확히 연결
      const response = await fetch(apiUrl("/api/auth/register"), {
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
          ? `회원가입 완료! 인증코드: ${result.connection_code}\n(남편분께 이 코드를 공유해주세요!)` 
          : "회원가입 완료!";
        alert(msg);
        onSuccess({ name, email, role, pregnancyWeek: 0 });
      } else {
        setError(result.error || result.detail || "가입 실패");
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
          
          {/* 권한 선택 버튼 */}
          <div className="grid grid-cols-2 gap-3">
            {(["pregnant", "guardian"] as const).map((r) => {
              const [roleKey, emoji, label] = r === "pregnant" ? ["pregnant", "🤰", "임산부"] : ["guardian", "👨", "보호자"];
              return (
                <button 
                  key={roleKey} 
                  onClick={() => setRole(roleKey as any)} 
                  className="py-4 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all" 
                  style={{ 
                    borderColor: role === roleKey ? "#C94E70" : "var(--border)", 
                    background: role === roleKey ? "rgba(201, 78, 112, 0.06)" : "transparent" 
                  }}
                >
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-sm font-medium" style={{ color: role === roleKey ? "#C94E70" : "var(--muted-foreground)" }}>{label}</span>
                </button>
              );
            })}
          </div>

          {/* 공통 입력 정보 */}
          <input placeholder="이름" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/40 text-sm focus:border-pink-300 outline-none" />
          <input placeholder="닉네임 (커뮤니티에 쓰여요)" value={nickname} onChange={e => setNickname(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/40 text-sm focus:border-pink-300 outline-none" />
          
          {role === "pregnant" && (
            <input placeholder="우리아기 태명" value={babyNickname} onChange={e => setBabyNickname(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/40 text-sm focus:border-pink-300 outline-none" />
          )}

          <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/40 text-sm focus:border-pink-300 outline-none" />
          <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/40 text-sm focus:border-pink-300 outline-none" />

          {/* 🚀 마이 로드의 기획 반영: 친절한 임신 날짜 입력 안내 박스 */}
          {role === "pregnant" ? (
            <div className="bg-[#FCF0F4] rounded-2xl p-4 border border-pink-100">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">📅</span>
                <p className="text-sm font-bold text-foreground" style={{ color: "#C94E70" }}>임신 날짜를 알려주세요!</p>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3 font-medium leading-relaxed break-keep">
                정확한 주차별 맞춤 가이드와 출산 예정일 계산을 위해 예상된 임신 시작날짜를 알려주세요
              </p>
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm focus:border-pink-300 outline-none shadow-sm" 
              />
            </div>
          ) : (
            <div className="bg-[#F0F4FC] rounded-2xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🔗</span>
                <p className="text-sm font-bold text-foreground" style={{ color: "#4D8AF0" }}>아내분과 연결할까요?</p>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3 font-medium leading-relaxed">
                아내분의 [내 정보] 탭에 있는 인증코드를 아래에 입력해주세요.
              </p>
              <input 
                placeholder="임산부 인증코드 입력" 
                value={inviteCode} 
                onChange={e => setInviteCode(e.target.value)} 
                className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-white text-sm focus:border-blue-400 outline-none shadow-sm" 
              />
            </div>
          )}

          {/* 에러 메시지 출력 */}
          {error && <p className="text-sm text-red-500 text-center font-bold">{error}</p>}

          {/* 가입 버튼 */}
          <button 
            onClick={handleRegister} 
            disabled={loading} 
            className="w-full py-4 rounded-xl font-bold text-white mt-2 shadow-md active:scale-95 transition-all disabled:opacity-50" 
            style={{ background: "linear-gradient(135deg, #C94E70, #E8789A)" }}
          >
            {loading ? "가입 처리 중..." : "회원가입 완료"}
          </button>
        </div>
      </div>
    </div>
  );
}
