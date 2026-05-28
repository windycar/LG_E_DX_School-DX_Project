import { useState, useEffect } from "react";
import { AppUser, Screen } from "./types";
import { ArrowLeft, ChevronRight, Copy, Shield } from "lucide-react";
import { BottomNav } from "./App";

export default function SettingsView({ user, onNavigate, onLogout }: { user: AppUser; onNavigate: (s: Screen) => void; onLogout: () => void }) {
  const [notifications, setNotifications] = useState({ daily: true, weekly: true, partner: true });
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showGuardianManage, setShowGuardianManage] = useState(false);

  // 🚀 대문자 문제 및 타입스크립트 에러 완벽 해결
  const isPregnant = String(user.role).toUpperCase() === "PREGNANT";
  const userId = (user as any).id || user.user_id;

  // 백엔드에서 직접 가져온 데이터를 담을 그릇
  const [dbInfo, setDbInfo] = useState({ baby_nickname: "", connection_code: "", partner_code: "" });

  const [editName, setEditName] = useState(user.name || "");
  const [editBabyNickname, setEditBabyNickname] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  // 최신 유저 정보 불러오기 함수
  const fetchLatestUserInfo = () => {
    if (!userId) return;
    fetch(`http://localhost:8000/api/user/info/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === "Success") {
          setDbInfo(data);
          setEditBabyNickname(data.baby_nickname || "");
        }
      })
      .catch(e => console.error("데이터 불러오기 실패:", e));
  };

  useEffect(() => {
    fetchLatestUserInfo();
  }, [userId]);

  const connectionCode = isPregnant ? (dbInfo.connection_code || "연결 코드 없음") : (dbInfo.partner_code || "연결 코드 없음");

  // 🚀 즉시 반영되는 프로필 업데이트 함수
  // 🚀 로그아웃을 막고 메인 화면까지 즉시 동기화하는 프로필 업데이트 함수
  const handleProfileUpdate = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/user/profile/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, baby_nickname: editBabyNickname }),
      });
      if (res.ok) {
        alert("프로필이 성공적으로 수정되었습니다!");
        setShowProfileEdit(false);
        
        // 🚀 [핵심] 전역 데이터 강제 동기화 로직
        // 메인 화면과 설정창이 공유하고 있는 user 객체의 원본 데이터를 직접 수정합니다.
        // 이렇게 하면 새로고침을 하지 않아도, 메인 화면으로 이동하는 순간 바뀐 이름과 태명이 즉시 출력됩니다!
        user.name = editName;
        (user as any).baby_nickname = editBabyNickname;
        (user as any).babyNickname = editBabyNickname; // 혹시 모를 camelCase 대비
        
        // 만약 보호자 계정이라서 연결된 임산부의 태명을 바꾼 경우도 함께 동기화합니다.
        if ((user as any).connected_pregnant) {
          (user as any).connected_pregnant.baby_nickname = editBabyNickname;
        }
        
        // 현재 설정창의 로컬 상태도 함께 최신화합니다.
        fetchLatestUserInfo(); 
      } else {
        alert("프로필 수정에 실패했습니다.");
      }
    } catch (e) { 
      alert("서버 오류가 발생했습니다."); 
    }
  };

  const handlePasswordUpdate = async () => {
    if (newPassword !== newPasswordConfirm) {
      alert("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    try {
      const res = await fetch(`http://localhost:8000/api/user/password/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("비밀번호가 성공적으로 변경되었습니다!");
        setShowPasswordChange(false);
        setCurrentPassword(""); setNewPassword(""); setNewPasswordConfirm("");
      } else alert(data.detail || "비밀번호 변경에 실패했습니다.");
    } catch (e) { alert("서버 오류가 발생했습니다."); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-5 pt-12 pb-6" style={{ background: "linear-gradient(160deg, #FFE8EE 0%, #FFF5F7 100%)" }}>
        <h2 className="text-2xl font-bold" style={{ fontFamily: "'Nanum Myeongjo', serif", color: "#2D1B33" }}>설정</h2>
      </div>

      <div className="px-5 py-5 flex-1 space-y-4 overflow-y-auto pb-20">
        {/* 알림 설정 */}
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">알림 설정</p>
          <div className="bg-card rounded-2xl p-4 border border-border space-y-4">
            {[
              { key: "daily" as const, label: "일일 건강 체크 알림", desc: "매일 오전 9시" },
              { key: "weekly" as const, label: "주간 리포트 알림", desc: "매주 월요일" },
              { key: "partner" as const, label: isPregnant ? "보호자 활동 알림" : "임산부 활동 알림", desc: "새 메시지가 있을 때" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <button
                  onClick={() => setNotifications((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                  className="relative w-12 h-6 rounded-full transition-all"
                  style={{ background: notifications[item.key] ? "#C94E70" : "#E5E7EB" }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                    style={{ transform: notifications[item.key] ? "translateX(24px)" : "translateX(0)" }}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 계정 메뉴 */}
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">계정</p>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {[
              { label: "프로필 수정", action: () => setShowProfileEdit(true) },
              { label: "비밀번호 변경", action: () => setShowPasswordChange(true) },
              { label: "보호자 연결 관리", action: () => setShowGuardianManage(true) },
            ].map((item) => (
              <button key={item.label} onClick={item.action} className="w-full px-4 py-3 flex items-center justify-between border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                <p className="text-sm text-foreground">{item.label}</p>
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        {/* 앱 정보 메뉴 */}
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">앱 정보</p>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {[
              { label: "버전 정보", value: "1.0.0" },
              { label: "이용약관", action: () => {} },
              { label: "개인정보 처리방침", action: () => {} },
              { label: "오픈소스 라이선스", action: () => {} },
            ].map((item) => (
              <button key={item.label} onClick={item.action} className="w-full px-4 py-3 flex items-center justify-between border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                <p className="text-sm text-foreground">{item.label}</p>
                {"value" in item ? <p className="text-sm text-muted-foreground">{item.value}</p> : <ChevronRight size={16} className="text-muted-foreground" />}
              </button>
            ))}
          </div>
        </div>

        <button onClick={onLogout} className="w-full py-3 rounded-2xl font-semibold border-2 transition-all active:scale-95" style={{ borderColor: "#C94E70", color: "#C94E70" }}>로그아웃</button>
      </div>

      {/* 모달창 영역 */}
      {showProfileEdit && (
        <div className="fixed inset-0 bg-background z-50 flex flex-col max-w-[430px] mx-auto">
          <div className="flex items-center gap-3 px-5 py-4 bg-card/90 backdrop-blur-sm border-b border-border">
            <button onClick={() => setShowProfileEdit(false)} className="p-2 rounded-xl hover:bg-secondary transition-colors">
              <ArrowLeft size={20} className="text-foreground" />
            </button>
            <h1 className="font-semibold text-foreground">프로필 수정</h1>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4 pb-20">
            
            {/* 🚀 임산부일 경우에만 아기 태명 입력칸 표시 */}
            {isPregnant && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">아기 태명</label>
                <input 
                  type="text" 
                  value={editBabyNickname} 
                  onChange={(e) => setEditBabyNickname(e.target.value)} 
                  placeholder="아기를 부를 애칭" 
                  className="w-full px-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:border-primary text-sm" 
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">이름 (닉네임)</label>
              <input 
                type="text" 
                value={editName} 
                onChange={(e) => setEditName(e.target.value)} 
                className="w-full px-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:border-primary text-sm" 
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">이메일</label>
              <input 
                type="email" 
                defaultValue={user.email} 
                className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/40 text-sm" 
                disabled 
              />
            </div>
            
            <button 
              onClick={handleProfileUpdate} 
              className="w-full py-3 rounded-2xl font-semibold text-white mt-4" 
              style={{ background: "#C94E70" }}
            >
              저장하기
            </button>
          </div>
        </div>
      )}

      {showPasswordChange && (
        <div className="fixed inset-0 bg-background z-50 flex flex-col max-w-[430px] mx-auto">
          <div className="flex items-center gap-3 px-5 py-4 bg-card/90 backdrop-blur-sm border-b border-border">
            <button onClick={() => setShowPasswordChange(false)} className="p-2 rounded-xl hover:bg-secondary transition-colors"><ArrowLeft size={20} className="text-foreground" /></button>
            <h1 className="font-semibold text-foreground">비밀번호 변경</h1>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4 pb-20">
            <div><label className="text-sm font-medium text-foreground block mb-2">현재 비밀번호</label><input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:border-primary text-sm" /></div>
            <div><label className="text-sm font-medium text-foreground block mb-2">새 비밀번호</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:border-primary text-sm" /></div>
            <div><label className="text-sm font-medium text-foreground block mb-2">새 비밀번호 확인</label><input type="password" value={newPasswordConfirm} onChange={(e) => setNewPasswordConfirm(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:border-primary text-sm" /></div>
            <button onClick={handlePasswordUpdate} className="w-full py-3 rounded-2xl font-semibold text-white mt-4" style={{ background: "#C94E70" }}>비밀번호 변경</button>
          </div>
        </div>
      )}

      {showGuardianManage && (
        <div className="fixed inset-0 bg-background z-50 flex flex-col max-w-[430px] mx-auto">
          <div className="flex items-center gap-3 px-5 py-4 bg-card/90 backdrop-blur-sm border-b border-border">
            <button onClick={() => setShowGuardianManage(false)} className="p-2 rounded-xl hover:bg-secondary transition-colors"><ArrowLeft size={20} className="text-foreground" /></button>
            <h1 className="font-semibold text-foreground">보호자 연결 관리</h1>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5 pb-20">
            {isPregnant ? (
              <div>
                <p className="text-sm font-semibold text-foreground mb-3">보호자 초대 인증코드</p>
                <div className="bg-card rounded-2xl p-4 border-2" style={{ borderColor: "#C94E70" }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground">회원가입 시 입력할 코드</p>
                    <button onClick={() => { navigator.clipboard.writeText(connectionCode); alert("복사되었습니다!"); }} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium" style={{ background: "rgba(201,78,112,0.1)", color: "#C94E70" }}><Copy size={12} /> 복사</button>
                  </div>
                  <p className="text-2xl font-bold text-center py-3" style={{ color: "#C94E70", letterSpacing: "4px" }}>{connectionCode}</p>
                  <p className="text-xs text-center text-muted-foreground">이 코드를 보호자에게 전달하여 안내하세요</p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-foreground mb-3">사용한 인증코드</p>
                <div className="bg-secondary/40 rounded-2xl p-4 border border-border">
                  <p className="text-center text-xl font-bold" style={{ color: "#7B68B5", letterSpacing: "3px" }}>{connectionCode}</p>
                  <p className="text-xs text-center text-muted-foreground mt-2">회원가입 시 입력한 인증코드입니다</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav current="settings" onNavigate={onNavigate}/>
    </div>
  );
}