import { apiUrl } from "./api";
import React, { useState, useEffect } from "react";
import { ArrowLeft, Lock, CheckCircle2 } from "lucide-react";
import { BottomNav } from "./App";
import { AppUser, Screen } from "./types";

export default function SmallTalkView({ user, onBack, onNavigate }: { user: AppUser; onBack: () => void; onNavigate?: (s: Screen) => void }) {
  const [topic, setTopic] = useState<{ topic_id: number; question_text: string } | null>(null);
  const [myAnswer, setMyAnswer] = useState(""); 
  const [submittedAnswer, setSubmittedAnswer] = useState<string | null>(null); 
  const [partnerName, setPartnerName] = useState("파트너");
  const [isPartnerAnswered, setIsPartnerAnswered] = useState(false);
  const [partnerAnswer, setPartnerAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 🚀 데이터 연동 핵심: user.id 사용
  const userId = (user as any).id || user.user_id;

  useEffect(() => {
    fetchSmallTalk();
  }, []);

  const fetchSmallTalk = async () => {
    if (!userId) return;

    try {
      const res = await fetch(apiUrl(`/api/smalltalk/${userId}`));
      const data = await res.json();
      if (data.status === "Success") {
        setTopic(data.topic);
        setSubmittedAnswer(data.my_answer);
        setMyAnswer(data.my_answer || "");
        setPartnerName(data.partner_name);
        setIsPartnerAnswered(data.is_partner_answered);
        setPartnerAnswer(data.partner_answer);
      }
    } catch (e) {
      console.error("네트워크 에러:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!myAnswer.trim() || !topic) return;

    try {
      const res = await fetch(apiUrl("/api/smalltalk/answer"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: Number(userId),
          topic_id: Number(topic.topic_id),
          answer_content: myAnswer,
        }),
      });

      if (res.ok) {
        fetchSmallTalk();
      } else {
        alert("제출에 실패했습니다.");
      }
    } catch (e) {
      alert("서버와 연결할 수 없습니다.");
    }
  };

  // 아래 return 문과 UI 양식은 기존 그대로입니다.
  return (
    <div className="min-h-screen flex flex-col bg-[#FCF0F4]">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-5 py-4 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-[#333]" />
        </button>
        <h1 className="font-bold text-lg text-[#333]">스몰토크</h1>
      </div>

      <div className="px-5 py-6 space-y-6 flex-1 overflow-y-auto">
        
        {/* 오늘의 질문 카드 */}
        <div className="bg-[#FFF4F4] rounded-2xl p-6 shadow-sm border border-[#FDE2E8]">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">💕</span>
            <span className="font-bold text-[#F48FB1] text-sm">오늘의 질문</span>
          </div>
          <p className="font-bold text-[#333] text-lg leading-relaxed">
            {topic ? topic.question_text : "질문을 불러오는 중입니다..."}
          </p>
        </div>

        {/* 내 답변 영역 */}
        <div>
          <h2 className="font-bold text-[#333] mb-3 text-sm px-1">내 답변</h2>
          {submittedAnswer ? (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 min-h-[120px]">
              <p className="text-[#555] leading-relaxed">{submittedAnswer}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <textarea
                value={myAnswer}
                onChange={(e) => setMyAnswer(e.target.value)}
                placeholder="답변을 작성해주세요..."
                className="w-full min-h-[140px] p-5 rounded-2xl border border-gray-200 shadow-sm focus:outline-none focus:border-[#F48FB1] resize-none text-[#333]"
              />
              <button
                onClick={handleSubmit}
                disabled={!myAnswer.trim()}
                className="w-full py-4 rounded-2xl font-bold text-white transition-all disabled:opacity-50 shadow-md"
                style={{ background: "linear-gradient(135deg, #F9B9A6, #F48FB1)" }}
              >
                답변 제출하기
              </button>
            </div>
          )}
        </div>

        {/* 파트너의 답변 영역 */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="font-bold text-[#333] text-sm">파트너의 답변 ({partnerName}님)</h2>
            {isPartnerAnswered && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-[#A68A94] bg-[#F3E8EC] px-2 py-1 rounded-full">
                <CheckCircle2 size={12} /> 답변 완료
              </span>
            )}
          </div>

          <div className="bg-[#FFF8FA] rounded-2xl p-6 shadow-sm border border-[#FDE2E8] min-h-[160px] flex flex-col items-center justify-center text-center">
            {!isPartnerAnswered ? (
              <div className="space-y-3 opacity-60">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <span className="text-2xl">⏳</span>
                </div>
                <div>
                  <p className="font-bold text-[#555] text-sm">아직 답변을 기다리고 있어요</p>
                  <p className="text-[#888] text-xs mt-1">파트너가 답변을 작성 중입니다</p>
                </div>
              </div>
            ) : !submittedAnswer ? (
              <div className="space-y-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <Lock className="text-[#F48FB1]" size={20} />
                </div>
                <div>
                  <p className="font-bold text-[#333] text-sm">내 답변을 먼저 제출해주세요</p>
                  <p className="text-[#888] text-xs mt-1">둘 다 답변을 제출하면 서로의 답변을 볼 수 있어요</p>
                </div>
              </div>
            ) : (
              <div className="w-full text-left">
                <p className="text-[#555] leading-relaxed">{partnerAnswer}</p>
              </div>
            )}
          </div>
        </div>

        {/* 이전 스몰토크 배너 */}
        <div className="mt-8 bg-white/60 rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-gray-100">
          <p className="text-sm font-bold text-[#555] flex items-center gap-1">
            💭 지난 스몰토크
          </p>
          <p className="text-xs text-[#888] mt-1">이전 질문과 답변은 일정표에서 확인할 수 있어요</p>
        </div>

      </div>
      {onNavigate && <BottomNav current="dashboard" onNavigate={onNavigate} />}
    </div>
  );
}