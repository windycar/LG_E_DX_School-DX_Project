import { apiUrl } from "./api";
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

    const { symptoms, emotions, stress = 0 } = partnerStatus;
    const hasSymptom = (targets: string[]) => targets.some((target) => symptoms.includes(target));
    const pickSymptom = (targets: string[]) => targets.find((target) => symptoms.includes(target));

    const warningSymptom = pickSymptom(["가슴통증", "배뇨통", "질분비물"]);
    if (warningSymptom) {
      const actions: Record<string, string> = {
        가슴통증: "통증 시작 시간 기록하고 병원 연락 기준 확인하기",
        배뇨통: "수분 섭취 챙기고 배뇨통 지속 여부 기록하기",
        질분비물: "분비물 색과 냄새 변화 기록하고 진료 문의 준비하기",
      };
      return {
        title: "주의 신호를 함께 확인해주세요",
        desc: `아내가 ${warningSymptom} 증상을 기록했어요. 증상이 계속되거나 통증, 출혈, 열감이 동반되면 병원 문의를 우선하도록 도와주세요.`,
        action: actions[warningSymptom],
        icon: <Heart size={32} className="text-white" />,
        color: ["#FF8A80", "#E53935"],
      };
    }

    const digestiveSymptom = pickSymptom(["입덧", "소화불량", "역류 증상", "변비"]);
    if (digestiveSymptom) {
      const actions: Record<string, string> = {
        입덧: "냄새 강한 음식 치우고 크래커와 따뜻한 물 챙기기",
        소화불량: "가벼운 식사 준비하고 식후 10분 산책 제안하기",
        "역류 증상": "식후 바로 눕지 않게 쿠션과 앉을 자리 준비하기",
        변비: "물과 과일 간식 챙기고 가벼운 움직임 제안하기",
      };
      return {
        title: "속이 불편한 아내를 위해",
        desc: `아내가 ${digestiveSymptom} 증상을 기록했어요. 냄새 강한 음식은 피하고, 부담 없는 간식과 따뜻한 물을 챙겨주세요.`,
        action: actions[digestiveSymptom],
        icon: <Coffee size={32} className="text-white" />,
        color: ["#FFDAA5", "#FFB74D"],
      };
    }

    const painSymptom = pickSymptom(["두통", "허리통증", "골반통", "좌골신경통", "다리경련", "손발저림"]);
    if (painSymptom) {
      const actions: Record<string, string> = {
        두통: "조명 낮추고 조용히 쉴 수 있는 자리 만들어주기",
        허리통증: "무거운 일 대신하고 허리 받칠 쿠션 챙기기",
        골반통: "걷는 거리 줄이고 편히 앉을 자리 먼저 준비하기",
        좌골신경통: "오래 서 있지 않게 하고 다리 받침 준비하기",
        다리경련: "종아리 스트레칭 도와주고 따뜻한 물 챙기기",
        손발저림: "손발을 따뜻하게 하고 편한 자세로 쉬게 돕기",
      };
      return {
        title: "통증 부담을 줄여주세요",
        desc: `아내가 ${painSymptom} 증상을 기록했어요. 무리한 움직임을 줄이고 편하게 쉴 수 있는 자세를 도와주세요.`,
        action: actions[painSymptom],
        icon: <Heart size={32} className="text-white" />,
        color: ["#82B1FF", "#4D8AF0"],
      };
    }

    const fatigueSymptom = pickSymptom(["피로감", "어지러움", "빈혈", "붓기", "정맥류", "치질"]);
    if (fatigueSymptom) {
      const actions: Record<string, string> = {
        피로감: "오늘 집안일 하나 먼저 끝내고 낮잠 시간 확보하기",
        어지러움: "갑자기 일어나지 않게 돕고 물과 간식 챙기기",
        빈혈: "철분 챙길 식사 준비하고 무리한 활동 막기",
        붓기: "다리 올릴 쿠션 준비하고 짠 음식 줄이기",
        정맥류: "오래 서 있지 않게 하고 다리 휴식 시간 만들기",
        치질: "화장실 시간을 편하게 쓰도록 배려하고 물 챙기기",
      };
      return {
        title: "몸이 무거운 아내를 위해",
        desc: `아내가 ${fatigueSymptom} 증상을 기록했어요. 오래 서 있지 않게 돕고 충분히 쉬게 해주세요.`,
        action: actions[fatigueSymptom],
        icon: <Heart size={32} className="text-white" />,
        color: ["#82B1FF", "#4D8AF0"],
      };
    }

    const restSymptom = pickSymptom(["수면장애", "코막힘", "코피", "잇몸출혈"]);
    if (restSymptom) {
      const actions: Record<string, string> = {
        수면장애: "침실 조명 낮추고 잠들기 전 소음 줄이기",
        코막힘: "실내 습도 확인하고 따뜻한 물 준비하기",
        코피: "휴지와 물 준비하고 반복 여부 기록 돕기",
        잇몸출혈: "부드러운 음식 준비하고 출혈 반복 여부 확인하기",
      };
      return {
        title: "편안한 휴식 환경을 만들어주세요",
        desc: `아내가 ${restSymptom} 증상을 기록했어요. 침실을 조용히 정리하고 습도와 조명을 편안하게 맞춰주세요.`,
        action: actions[restSymptom],
        icon: <Wind size={32} className="text-white" />,
        color: ["#B39DDB", "#7E57C2"],
      };
    }

    if (hasSymptom(["요실금"])) {
      return {
        title: "생활 동선을 편하게 챙겨주세요",
        desc: "아내가 비뇨 관련 불편을 기록했어요. 외출이나 휴식 중 화장실을 편하게 이용할 수 있도록 배려해주세요.",
        action: "외출 전 화장실 위치와 휴식 동선 챙기기",
        icon: <Heart size={32} className="text-white" />,
        color: ["#80CBC4", "#26A69A"],
      };
    }

    if (emotions.includes("우울") || emotions.includes("우울감") || emotions.includes("불안") || stress >= 7) {
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
    if (partnerStatus?.timestamp) setIsCompleted(false);
    fetch(apiUrl(`/api/guardian/missions/today/${userId}`))
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "Success" && data.mission) {
          setBackendMission(data.mission);
          setIsCompleted(partnerStatus?.timestamp ? false : data.mission.execution_status === "COMPLETED");
        } else {
          setBackendMission(null);
          setIsCompleted(false);
        }
      })
      .catch((error) => console.error("오늘의 보호자 미션 조회 실패:", error));
  }, [userId, partnerStatus?.timestamp]);

  const localMission = getTodayMission();
  const mission = partnerStatus
    ? localMission
    : backendMission
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
      const res = await fetch(apiUrl(`/api/guardian/missions/${backendMission.mission_id}/complete`), {
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
