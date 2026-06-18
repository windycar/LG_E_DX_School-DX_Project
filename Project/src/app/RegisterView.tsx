

import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { apiUrl } from "./api";
import { AppUser } from "./types";

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const todayDate = new Date();
const pregnancyDateMax = toDateInputValue(todayDate);
const pregnancyMinDate = new Date(todayDate);
pregnancyMinDate.setDate(pregnancyMinDate.getDate() - 280);
const pregnancyDateMin = toDateInputValue(pregnancyMinDate);

export default function RegisterView({ onBack, onSuccess }: { onBack: () => void; onSuccess: (u: AppUser) => void }) {
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [babyNickname, setBabyNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [role, setRole] = useState<"pregnant" | "guardian">("pregnant");
  const [startDate, setStartDate] = useState(pregnancyDateMax);
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    const normalizedName = name.trim();
    const normalizedNickname = nickname.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedBabyNickname = babyNickname.trim();
    const normalizedInviteCode = inviteCode.trim().toUpperCase();

    if (!normalizedName || !normalizedNickname || !normalizedEmail || !password ||
        (role === "pregnant" && !normalizedBabyNickname) ||
        (role === "guardian" && !normalizedInviteCode)) {
      setError("모든 필수 항목을 입력해주세요.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    if (normalizedName.length > 50 || normalizedNickname.length > 50 || normalizedBabyNickname.length > 50) {
      setError("이름, 닉네임, 태명은 각각 50자 이하로 입력해주세요.");
      return;
    }

    if (role === "pregnant" && (startDate < pregnancyDateMin || startDate > pregnancyDateMax)) {
      setError("임신 시작일은 오늘 기준 280일 전부터 오늘까지만 선택할 수 있습니다.");
      return;
    }

    setLoading(true);
    setError("");
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password: password,
          name: normalizedName,
          nickname: normalizedNickname,
          role: role === "pregnant" ? "PREGNANT" : "GUARDIAN",
          start_date: startDate,
          baby_nickname: normalizedBabyNickname,
          input_connection_code: normalizedInviteCode,
        }),
        signal: controller.signal,
      });

      const result = await response.json().catch(() => ({}));
      
      if (response.ok && result.status === "Success") {
        const msg = result.connection_code 
          ? `회원가입 완료! 인증코드: ${result.connection_code}\n(남편분께 이 코드를 공유해주세요!)` 
          : "회원가입 완료!";
        alert(msg);
        onSuccess({ name: normalizedName, nickname: normalizedNickname, email: normalizedEmail, role, pregnancyWeek: 0 });
      } else {
        setError(result.error || result.detail || "회원가입에 실패했습니다. 입력 내용을 확인해주세요.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setError("서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.");
      } else {
        setError("서버와 통신할 수 없습니다.");
      }
    } finally {
      window.clearTimeout(timeoutId);
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
                  onClick={() => {
                    setRole(roleKey as "pregnant" | "guardian");
                    setError("");
                  }}
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
          <input placeholder="이름" maxLength={50} value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/40 text-sm focus:border-pink-300 outline-none" />
          <input placeholder="닉네임 (커뮤니티에 표시됩니다)" maxLength={50} value={nickname} onChange={e => setNickname(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/40 text-sm focus:border-pink-300 outline-none" />
          
          {role === "pregnant" && (
            <input placeholder="우리아기 태명" maxLength={50} value={babyNickname} onChange={e => setBabyNickname(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/40 text-sm focus:border-pink-300 outline-none" />
          )}

          <input type="text" placeholder="이메일 또는 아이디" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/40 text-sm focus:border-pink-300 outline-none" />
          <input type="password" placeholder="비밀번호" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/40 text-sm focus:border-pink-300 outline-none" />
          <input type="password" placeholder="비밀번호 확인" autoComplete="new-password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/40 text-sm focus:border-pink-300 outline-none" />

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
                min={pregnancyDateMin}
                max={pregnancyDateMax}
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
                maxLength={6}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
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
