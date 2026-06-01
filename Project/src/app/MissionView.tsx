import React, { useEffect, useState, useMemo } from "react";
import { ArrowLeft, Gift, Heart, Coffee, Wind, CheckCircle, Smile } from "lucide-react";
import { AppUser, PartnerStatus, Screen } from "./types";
// @ts-ignore
import { BottomNav } from "./App";

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

export default function MissionView({
  user,
  onBack,
  onNavigate,
  partnerStatus,
}: {
  user: AppUser;
  onBack: () => void;
  onNavigate?: (s: Screen) => void;
  partnerStatus?: PartnerStatus | null;
}) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [backendMission, setBackendMission] = useState<any>(null);
  const userId = (user as any).id || user.user_id;

  // 🏠 집안일 지침 20개 리스트
  const houseworkTips = [
    "욕실 청소 및 타일 닦기",
    "주방 싱크대 닦고 정리하기",
    "바닥 진공청소기로 청소하기",
    "침대 정돈하고 시트 갈기",
    "식사 준비 및 밥 지어주기",
    "빨래 세탁기 돌리고 건조하기",
    "세제 및 생활용품 정리 정돈",
    "베란다 청소 및 정리",
    "냉장고 정리 및 음식물 확인",
    "거실 소파 및 쿠션 정돈",
    "먼지 제거 및 가구 닦기",
    "휴지통 비우고 새 봉지 끼우기",
    "아내 먹기 좋은 간식 준비하기",
    "창문 닦고 환기하기",
    "옷장 정리 및 옷 개기",
    "주방 밥솥 및 냄비 닦기",
    "쓰레기 분류 및 버리기",
    "아내 물 한 잔 챙겨주기",
    "아내 발 마사지 해주기",
    "함께 가벼운 산책 다녀오기",
  ];

  // 📅 오늘의 날짜를 기반으로 랜덤 지침 선택 (매일 같은 시드)
  const getRandomTipForToday = () => {
    const today = new Date();
    const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    const seed = dateString.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const randomIndex = seed % houseworkTips.length;
    return houseworkTips[randomIndex];
  };

  const todaysTip = useMemo(() => getRandomTipForToday(), []);

  // 🚀 아내의 상태(partnerStatus)를 분석하여 오늘의 미션을 동적으로 생성합니다!
  const getTodayMission = () => {
    if (!partnerStatus) {
      return {
        title: "오늘의 일상 미션",
        desc: "아내가 아직 오늘의 상태를 기록하지 않았어요. 먼저 따뜻한 말 한마디를 건네보는 건 어떨까요?",
        action: "사랑한다고 말해주기",
        icon: <Heart size={32} className="text-white" />,
        color: ["#FFB3C6", "#FF8FAB"],
      };
    }

    const { symptoms, emotions, stress } = partnerStatus;

    if (symptoms.includes("입덧") || symptoms.includes("소화불량")) {
      return {
        title: "속이 불편한 아내를 위해",
        desc: "아내가 입덧이나 소화불량으로 힘들어하고 있어요. 실내 공기를 환기하고 따뜻한 차를 준비해주세요.",
        action: "생강차 타주고 환기하기",
        icon: <Coffee size={32} className="text-white" />,
        color: ["#FFDAA5", "#FFB74D"],
      };
    }

    if (symptoms.includes("허리통증") || symptoms.includes("붓기") || symptoms.includes("피로감")) {
      return {
        title: "몸이 무거운 아내를 위해",
        desc: "아내가 신체적 피로와 통증을 느끼고 있어요. 오늘은 집안일을 전담하고 다리를 주물러주세요.",
        action: "15분 다리 마사지 해주기",
        icon: <Heart size={32} className="text-white" />,
        color: ["#82B1FF", "#4D8AF0"],
      };
    }

    if (emotions.includes("우울감") || emotions.includes("불안") || stress >= 7) {
      return {
        title: "지친 마음을 안아주세요",
        desc: "아내의 스트레스 지수가 높거나 불안감을 느끼고 있어요. 가만히 이야기를 들어주고 안아주세요.",
        action: "아내의 이야기 공감하며 듣기",
        icon: <Wind size={32} className="text-white" />,
        color: ["#C3B1E1", "#9B8EC4"],
      };
    }

    // 증상이 없고 기분이 좋을 때
    return {
      title: "오늘 컨디션 최고!",
      desc: "아내의 컨디션이 아주 좋습니다! 이 기분을 유지할 수 있도록 가벼운 산책이나 맛있는 간식을 제안해 보세요.",
      action: "함께 동네 산책하기",
      icon: <Smile size={32} className="text-white" />,
      color: ["#A8E6CF", "#69C99A"],
    };
  };

  useEffect(() => {
    if (!userId) return;
    fetch(`http://localhost:8000/api/guardian/missions/today/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "Success" && data.mission) {
          setBackendMission(data.mission);
          setIsCompleted(data.mission.execution_status === "COMPLETED");
        }
      })
      .catch((error) => console.error("오늘의 보호자 미션 조회 실패:", error));
  }, [userId]);

  const localMission = getTodayMission();
  const mission = backendMission
    ? {
        title: backendMission.mission_title,
        desc: backendMission.mission_reason || localMission.desc,
        action: backendMission.mission_content,
        icon: localMission.icon,
        color: localMission.color,
      }
    : localMission;

  const completeMission = async () => {
    if (!backendMission?.mission_id) {
      setIsCompleted(true);
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/api/guardian/missions/${backendMission.mission_id}/complete`, {
        method: "PUT",
      });
      if (res.ok) {
        setIsCompleted(true);
        setBackendMission({ ...backendMission, execution_status: "COMPLETED" });
      }
    } catch (error) {
      console.error("미션 완료 처리 실패:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader title="아내 케어 미션" onBack={onBack} />

      <div className="px-5 py-6 space-y-6 flex-1 overflow-y-auto pb-24">
        {/* 상단 안내 문구 */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-1">
            <span style={{ color: "#4D8AF0" }}>{(user as any).name}</span> 남편님,
          </h2>
          <p className="text-muted-foreground text-sm">오늘 아내를 위해 이 미션을 수행해 보세요!</p>
        </div>

        {!isCompleted ? (
          <>
            {/* 🎁 미션 카드 */}
            <div
              className="rounded-3xl p-6 text-white relative overflow-hidden shadow-lg"
              style={{ background: `linear-gradient(135deg, ${mission.color[0]}, ${mission.color[1]})` }}
            >
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-5 backdrop-blur-md border border-white/30">
                {mission.icon}
              </div>
              
              <p className="text-white/90 text-xs font-bold mb-1 tracking-wider">TODAY'S MISSION</p>
              <h3 className="text-2xl font-extrabold mb-3 drop-shadow-sm">{mission.title}</h3>
              <p className="text-white/90 text-sm leading-relaxed mb-6 font-medium">
                {mission.desc}
              </p>

              <div className="bg-white/20 rounded-xl p-4 backdrop-blur-md border border-white/30">
                <p className="text-xs text-white/80 font-bold mb-1">🔥 나의 행동 지침</p>
                <p className="font-bold text-lg">{mission.action}</p>
              </div>

              {/* ✨ 오늘의 집안일 지침 */}
              <div className="bg-white/20 rounded-xl p-4 backdrop-blur-md border border-white/30 mt-4">
                <p className="text-xs text-white/80 font-bold mb-1">💡 오늘의 집안일 지침</p>
                <p className="font-bold text-lg">{todaysTip}</p>
              </div>
            </div>

            {/* 완료 버튼 */}
            <button
              onClick={completeMission}
              className="w-full py-4 rounded-2xl font-bold text-white shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 text-lg"
              style={{ background: "#4D8AF0" }}
            >
              <CheckCircle size={22} /> 미션 완료하기
            </button>
          </>
        ) : (
          /* 🎊 미션 완료 화면 */
          <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-in zoom-in duration-300">
            <div className="w-24 h-24 rounded-full flex items-center justify-center bg-[#E3F2FD] mb-2">
              <Gift size={48} className="text-[#4D8AF0]" />
            </div>
            <h3 className="text-2xl font-extrabold text-foreground">미션 달성 성공!</h3>
            <p className="text-center text-muted-foreground text-sm leading-relaxed px-4">
              멋진 남편이시네요! 아내분도 분명 행복해하실 거예요.<br/> 
              오늘 보여주신 작은 배려가 큰 감동이 됩니다.
            </p>
            
            <div className="w-full bg-card rounded-2xl p-4 border border-border mt-6 shadow-sm">
              <p className="font-bold text-sm mb-2 text-[#4D8AF0]">아내의 기분이 좋아질 때마다...</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                AI가 아내의 감정 변화를 학습하여, 집 안의 온도와 습도를 더 완벽하게 맞춰주는 데이터로 활용됩니다!
              </p>
            </div>

            <button
              onClick={() => onBack()}
              className="w-full py-3.5 mt-4 rounded-xl font-bold border-2 transition-all active:scale-95"
              style={{ borderColor: "#4D8AF0", color: "#4D8AF0" }}
            >
              대시보드로 돌아가기
            </button>
          </div>
        )}
      </div>

      {onNavigate && <BottomNav current="dashboard" onNavigate={onNavigate} />}
    </div>
  );
}
