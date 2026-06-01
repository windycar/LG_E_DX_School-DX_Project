import React, { useState, useEffect } from "react";
import { AppUser, Screen } from "./types";
import MyCommunityView from "./MyCommunityView"; // 🚀 새로 만든 커뮤니티 모달창 Import!
// @ts-ignore
import { BottomNav } from "./App";

export default function ProfileView({ user, onNavigate }: { user: AppUser; onNavigate: (s: Screen) => void }) {
  const isPregnant = String(user.role).toUpperCase() === "PREGNANT";
  const identifier = (user as any).id || (user as any).user_id || user.email;

  // 기본 정보 상태
  const [connectionCode, setConnectionCode] = useState<string>("");
  const [pregnancyStartDate, setPregnancyStartDate] = useState<string | null>(null);
  
  // 통계 상태
  const [stats, setStats] = useState({ diary: 0, posts: 0, comments: 0 });
  
  // 검진일 상태
  const [checkupInfo, setCheckupInfo] = useState({ 
    recent: "계산 중...", 
    next: "계산 중..." 
  });

  // 🚀 모달창 제어 상태
  const [showCommunityView, setShowCommunityView] = useState(false);
  const [communityTab, setCommunityTab] = useState<"posts" | "comments">("posts");

  useEffect(() => {
    if (!identifier) return;

    // 1. 내 기본 정보 및 연동 코드 가져오기
    fetch(`http://localhost:8000/api/user/info/${identifier}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === "Success") {
          const code = isPregnant ? data.connection_code : data.partner_code;
          setConnectionCode(code);
          setPregnancyStartDate(data.pregnancy_start_date); // 남편 접속 시에도 아내의 임신 시작일이 들어옵니다!

          // 2. 코드를 가져왔다면, 즉시 캘린더 검진일 API 호출!
          if (code) {
            fetch(`http://localhost:8000/api/calendar/checkups/${code}`)
              .then(res => res.json())
              .then(checkupData => {
                if (checkupData.status === "Success") {
                  setCheckupInfo({
                    recent: checkupData.recent_checkup,
                    next: checkupData.next_checkup
                  });
                } else {
                  setCheckupInfo({ recent: "오류", next: "오류" });
                }
              })
              .catch(() => setCheckupInfo({ recent: "연결 실패", next: "연결 실패" }));
          }
        }
      });

    // 3. 활동 통계 가져오기
    fetch(`http://localhost:8000/api/diary/logs/${identifier}`)
      .then(res => res.json())
      .then(data => { if (data.status === "Success" && data.entries) setStats(prev => ({ ...prev, diary: data.entries.length })); });

    fetch(`http://localhost:8000/api/community/posts/count/${identifier}`)
      .then(res => res.json())
      .then(data => { if (data.status === "Success") setStats(prev => ({ ...prev, posts: data.count })); });

    fetch(`http://localhost:8000/api/community/comments/count/${identifier}`)
      .then(res => res.json())
      .then(data => { if (data.status === "Success") setStats(prev => ({ ...prev, comments: data.count })); });

  }, [identifier, isPregnant]);

  // 임신 주차 및 D-day 계산 로직
  const calculatePregnancyInfo = (startDateStr: string | null) => {
    if (!startDateStr) return { weeks: 0, days: 0, passedDays: 0, dDay: 280, dueDateText: "정보 없음" };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = new Date(startDateStr); start.setHours(0, 0, 0, 0);

    const dueDate = new Date(start);
    dueDate.setDate(dueDate.getDate() + 280);
    const dueDateText = `${dueDate.getFullYear()}년 ${dueDate.getMonth() + 1}월 ${dueDate.getDate()}일`;

    const diffTime = today.getTime() - start.getTime();
    const passedDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const weeks = Math.floor(passedDays / 7);
    const days = passedDays % 7;
    const dDay = 280 - passedDays;

    return {
      weeks: weeks > 0 ? weeks : 0, days: days > 0 ? days : 0,
      passedDays: passedDays > 0 ? passedDays : 0, dDay: dDay > 0 ? dDay : 0,
      dueDateText
    };
  };

  const pregInfo = calculatePregnancyInfo(pregnancyStartDate);

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <div className="px-5 pt-12 pb-6" style={{ background: "linear-gradient(160deg, #FFE8EE 0%, #FFF5F7 100%)" }}>
        <h2 className="text-2xl font-bold mb-5" style={{ fontFamily: "'Nanum Myeongjo', serif", color: "#2D1B33" }}>내 정보</h2>

        {/* 유저 프로필 헤더 */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-sm" style={{ background: "linear-gradient(135deg, #C94E70, #E8789A)" }}>
            {isPregnant ? "🤰" : "👨"}
          </div>
          <div>
            <p className="font-bold text-xl text-foreground">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {user.babyNickname && <p className="text-xs text-muted-foreground mt-0.5">아기 태명: {user.babyNickname}</p>}
            <span className="inline-block mt-1 text-xs px-3 py-1 rounded-full font-bold shadow-sm" style={{ background: "rgba(201,78,112,0.1)", color: "#C94E70" }}>
              {isPregnant ? "임산부" : "보호자"}
            </span>
          </div>
        </div>

        {/* 🚀 수정됨: 임신 정보 카드 (연동된 남편에게도 뜹니다!) */}
        {pregnancyStartDate && (
          <div className="rounded-2xl px-5 py-4 shadow-md" style={{ background: "linear-gradient(135deg, #C94E70, #E8789A)", color: "white" }}>
            <p className="text-white/80 text-xs font-bold mb-1">{isPregnant ? "현재 임신" : "아내의 임신"}</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-extrabold drop-shadow-sm">{pregInfo.weeks}주차</p>
                <p className="text-white/90 text-sm mt-0.5 font-medium">D+{pregInfo.passedDays}일</p>
              </div>
              <div className="text-right">
                <p className="text-white/80 text-xs mb-1 font-bold">출산 예정일까지</p>
                <p className="text-3xl font-extrabold drop-shadow-sm">{pregInfo.dDay}일</p>
              </div>
            </div>
          </div>
        )}

        {/* 🚀 수정됨: 인증코드 카드는 임산부 본인에게만 뜨게 둡니다 */}
        {isPregnant && (
          <div className="bg-white rounded-2xl p-4 border border-border mt-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-bold">보호자 초대 인증코드</p>
                <p className="text-2xl font-extrabold mt-1 tracking-widest" style={{ color: "#C94E70" }}>{connectionCode || "발급 중..."}</p>
              </div>
              <button
                onClick={() => { if (connectionCode) { navigator.clipboard.writeText(connectionCode); alert("인증코드가 복사되었습니다!"); } }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90 shadow-md active:scale-95"
                style={{ background: "#C94E70" }}
              >복사</button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 font-medium">보호자 회원가입 시 이 코드를 입력해야 합니다</p>
          </div>
        )}
      </div>

      <div className="px-5 py-5 flex-1 space-y-4 overflow-y-auto pb-24">
        {/* 활동 통계 */}
        <div>
          <p className="text-sm font-bold text-foreground mb-3">활동 통계</p>
          <div className="grid grid-cols-3 gap-3">
            <button className="bg-white rounded-2xl p-3 border border-border text-center shadow-sm transition-transform cursor-default">
              <p className="text-2xl mb-1">📖</p>
              <p className="font-extrabold text-sm text-foreground">{stats.diary}회</p>
              <p className="text-[11px] text-muted-foreground font-bold mt-0.5">일기 작성</p>
            </button>

            <button 
              onClick={() => { setCommunityTab("posts"); setShowCommunityView(true); }}
              className="bg-white rounded-2xl p-3 border border-[#C94E70]/20 text-center shadow-sm hover:border-[#C94E70] hover:bg-[#C94E70]/5 active:scale-95 transition-all"
            >
              <p className="text-2xl mb-1 drop-shadow-sm">💬</p>
              <p className="font-extrabold text-sm text-[#C94E70]">{stats.posts}개</p>
              <p className="text-[11px] text-[#C94E70]/80 font-bold mt-0.5">게시글 작성</p>
            </button>

            <button 
              onClick={() => { setCommunityTab("comments"); setShowCommunityView(true); }}
              className="bg-white rounded-2xl p-3 border border-[#C94E70]/20 text-center shadow-sm hover:border-[#C94E70] hover:bg-[#C94E70]/5 active:scale-95 transition-all"
            >
              <p className="text-2xl mb-1 drop-shadow-sm">📝</p>
              <p className="font-extrabold text-sm text-[#C94E70]">{stats.comments}개</p>
              <p className="text-[11px] text-[#C94E70]/80 font-bold mt-0.5">작성한 댓글</p>
            </button>
          </div>
        </div>

        {/* 🚀 수정됨: 임신 상세 정보 (남편에게도 보입니다!) */}
        {pregnancyStartDate && (
          <div>
            <p className="text-sm font-bold text-foreground mb-3">임신 정보</p>
            <div className="bg-white rounded-2xl p-4 border border-border space-y-3 shadow-sm">
              {[
                { label: "출산 예정일", value: pregInfo.dueDateText }, 
                { label: "최근 검진일", value: checkupInfo.recent },
                { label: "다음 검진일", value: checkupInfo.next },
              ].map((info) => (
                <div key={info.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <p className="text-sm text-muted-foreground font-bold">{info.label}</p>
                  <p className="text-sm font-extrabold text-foreground">{info.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showCommunityView && (
        <MyCommunityView 
          userId={Number(identifier)} 
          initialTab={communityTab} 
          onClose={() => setShowCommunityView(false)} 
        />
      )}

      <BottomNav current="profile" onNavigate={onNavigate} />
    </div>
  );
}