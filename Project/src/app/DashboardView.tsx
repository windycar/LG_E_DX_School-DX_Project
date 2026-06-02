import { apiUrl } from "./api";
import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Gift, LogOut, Star } from "lucide-react";
import { AppUser, PartnerStatus, Screen } from "./types";
import { getDailyBenefit } from "./pregnancyBenefitsData";
// @ts-ignore
import { BottomNav } from "./App"; 

const calculateWeek = (dateString: string | undefined | null) => {
  if (!dateString || dateString === "None" || dateString === "") return 0;
  const start = new Date(dateString);
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, Math.floor(diffDays / 7));
};

type WeeklyTip = {
  label: string;
  title: string;
  detail: string;
  emoji: string;
};

const pickDailyTip = (label: string, tips: Omit<WeeklyTip, "label">[], date = new Date()): WeeklyTip => {
  const dayKey = Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / 86400000);
  return { label, ...tips[dayKey % tips.length] };
};

const getWeeklyTip = (week: number): WeeklyTip => {
  if (week < 0) {
    return pickDailyTip("주차 설정 필요", [
      {
        title: "임신 시작일을 설정하면 주차별 팁을 볼 수 있어요",
        detail: "프로필의 임신 시작일을 확인하면 현재 주차에 맞춘 영양, 운동, 수면, 검사 팁이 표시됩니다.",
        emoji: "📅",
      },
      {

        
        title: "마지막 생리 시작일이나 병원 기준일을 확인하세요",
        detail: "주차 계산은 기준일에 따라 달라질 수 있습니다. 산부인과에서 안내받은 기준일을 입력하면 더 정확합니다.",
        emoji: "🗓️",
      },
      {
        title: "주차가 없을 땐 기본 건강 정보부터 확인하세요",
        detail: "복용 중인 약, 영양제, 음주·흡연 여부처럼 임신 초기부터 중요한 항목을 먼저 점검해 주세요.",
        emoji: "🩺",
      },
    ]);
  }

  if (week <= 4) {
    return pickDailyTip("0~4주", [
      {
        title: "약, 술, 흡연부터 바로 점검하세요",
        detail: "임신 가능성을 확인한 시기에는 복용 중인 약과 영양제, 음주·흡연 여부를 산부인과에 알려 안전하게 조정하는 것이 중요합니다.",
        emoji: "🩺",
      },
      {
        title: "엽산 섭취를 놓치지 마세요",
        detail: "임신 초기에는 태아 신경관 발달과 관련해 엽산이 중요합니다. 복용량은 기존 영양제와 함께 의료진에게 확인하세요.",
        emoji: "🧬",
      },
      {
        title: "복통이나 출혈은 바로 확인하세요",
        detail: "초기에는 가벼운 불편감도 있을 수 있지만, 심한 복통이나 출혈이 있으면 앱보다 산부인과 확인이 먼저입니다.",
        emoji: "🚨",
      },
    ]);
  }

  if (week <= 8) {
    return pickDailyTip("5~8주", [
      {
        title: "입덧은 소량씩 자주 먹는 방식이 도움돼요",
        detail: "냄새가 강하거나 기름진 음식은 피하고, 크래커처럼 부담이 적은 음식과 물을 조금씩 나누어 섭취해 보세요.",
        emoji: "🍵",
      },
      {
        title: "물도 못 마실 정도면 진료가 필요해요",
        detail: "구토가 심해서 수분 섭취가 어렵거나 소변량이 줄면 탈수 위험이 있습니다. 산부인과에 연락해 주세요.",
        emoji: "💧",
      },
      {
        title: "첫 산전검사 일정을 정리하세요",
        detail: "초기 검사와 초음파 일정은 병원마다 다를 수 있습니다. 안내받은 검사일을 캘린더에 저장해 두세요.",
        emoji: "📋",
      },
    ]);
  }

  if (week <= 12) {
    return pickDailyTip("9~12주", [
      {
        title: "엽산과 균형 잡힌 식사를 계속 챙기세요",
        detail: "초기에는 태아의 주요 기관 발달이 이어지는 시기라 엽산, 단백질, 채소와 과일을 포함한 균형식이 중요합니다.",
        emoji: "🥦",
      },
      {
        title: "카페인은 하루 총량으로 계산하세요",
        detail: "커피뿐 아니라 녹차, 홍차, 콜라에도 카페인이 있습니다. 여러 음료를 합산해서 과하지 않게 관리하세요.",
        emoji: "☕",
      },
      {
        title: "피로가 심하면 쉬는 시간을 먼저 확보하세요",
        detail: "초기 피로감은 흔하지만 무리하면 더 힘들어질 수 있습니다. 짧은 낮잠과 가벼운 식사를 나누어 활용하세요.",
        emoji: "😴",
      },
    ]);
  }

  if (week <= 16) {
    return pickDailyTip("13~16주", [
      {
        title: "컨디션이 괜찮다면 가벼운 걷기를 시작해도 좋아요",
        detail: "정상 임신이고 의료진이 제한하지 않았다면 짧은 산책부터 시작해 보세요. 숨이 너무 차거나 통증이 있으면 바로 쉬어야 합니다.",
        emoji: "🚶",
      },
      {
        title: "단백질 식품을 매끼 조금씩 챙기세요",
        detail: "태아와 태반, 모체 조직 성장을 위해 단백질이 필요합니다. 달걀, 생선, 고기, 콩류, 유제품을 균형 있게 넣어 보세요.",
        emoji: "🥚",
      },
      {
        title: "허리와 골반 부담을 줄이는 자세를 의식하세요",
        detail: "오래 서 있거나 한 자세로 오래 앉아 있으면 불편감이 커질 수 있습니다. 중간중간 자세를 바꿔 주세요.",
        emoji: "🪑",
      },
    ]);
  }

  if (week <= 20) {
    return pickDailyTip("17~20주", [
      {
        title: "태동을 느끼기 시작할 수 있는 시기예요",
        detail: "처음 태동을 느끼는 시점은 개인차가 큽니다. 철분과 단백질 섭취를 챙기고 정기검진 일정도 놓치지 마세요.",
        emoji: "👶",
      },
      {
        title: "철분 부족 신호를 살펴보세요",
        detail: "어지러움, 심한 피로, 숨참이 지속되면 빈혈 확인이 필요할 수 있습니다. 검사 결과에 맞춰 복용하세요.",
        emoji: "🩸",
      },
      {
        title: "배가 커지기 전 생활 동선을 정리하세요",
        detail: "자주 쓰는 물건은 허리 숙임이 적은 위치에 두고, 미끄러운 욕실 바닥도 미리 정리해 주세요.",
        emoji: "🏠",
      },
    ]);
  }

  if (week <= 24) {
    return pickDailyTip("21~24주", [
      {
        title: "정밀초음파와 임신당뇨 검사 일정을 확인하세요",
        detail: "이 시기에는 태아 구조 확인과 혈당 관련 검사가 이어질 수 있습니다. 병원에서 안내한 검사 날짜를 캘린더에 저장해 두세요.",
        emoji: "🧪",
      },
      {
        title: "수분을 낮부터 나누어 마시세요",
        detail: "수분 섭취는 중요하지만 밤에 몰아서 마시면 잠이 깨기 쉽습니다. 낮 시간부터 조금씩 나누어 마셔 보세요.",
        emoji: "💧",
      },
      {
        title: "속쓰림은 식사량과 자세를 조절하세요",
        detail: "한 번에 많이 먹기보다 소량씩 나누고, 식사 직후 바로 눕지 않는 방식이 도움이 될 수 있습니다.",
        emoji: "🍽️",
      },
    ]);
  }

  if (week <= 28) {
    return pickDailyTip("25~28주", [
      {
        title: "태동 변화와 수면 자세를 함께 신경 쓰세요",
        detail: "중기 이후에는 옆으로 누워 자는 자세가 더 편할 수 있습니다. 태동이 평소보다 확실히 줄면 산부인과에 연락하세요.",
        emoji: "😴",
      },
      {
        title: "임신당뇨 검사 결과를 생활에 반영하세요",
        detail: "혈당 관리가 필요하다는 안내를 받았다면 식사 시간, 간식, 운동 계획을 병원 지시에 맞춰 조정하세요.",
        emoji: "📊",
      },
      {
        title: "다리 쥐와 붓기를 줄이려면 자주 움직이세요",
        detail: "오래 앉아 있으면 다리 불편감이 커질 수 있습니다. 짧게 걷고, 쉴 때는 다리를 편하게 올려 주세요.",
        emoji: "🦵",
      },
    ]);
  }

  if (week <= 32) {
    return pickDailyTip("29~32주", [
      {
        title: "붓기와 허리 부담을 줄이는 생활이 필요해요",
        detail: "오래 서 있거나 한 자세로 오래 앉아 있지 말고, 다리를 쉬게 해 주세요. 갑작스러운 심한 부종이나 두통은 진료가 필요합니다.",
        emoji: "🦶",
      },
      {
        title: "태동 패턴을 평소 기준으로 기억하세요",
        detail: "아기마다 움직임 패턴은 다릅니다. 평소보다 확실히 줄었다고 느껴지면 기다리지 말고 병원에 연락하세요.",
        emoji: "🤲",
      },
      {
        title: "수면 환경을 먼저 단순하게 만들어 보세요",
        detail: "옆으로 누울 때 무릎 사이와 배 아래에 베개를 받치면 자세 유지에 도움이 될 수 있습니다.",
        emoji: "🛏️",
      },
    ]);
  }

  if (week <= 36) {
    return pickDailyTip("33~36주", [
      {
        title: "출산 준비와 조산 신호를 같이 확인하세요",
        detail: "출산가방, 병원 연락처, 이동 방법을 정리해 두세요. 규칙적인 통증, 출혈, 물이 새는 느낌은 바로 병원에 연락해야 합니다.",
        emoji: "🎒",
      },
      {
        title: "보호자와 병원 이동 계획을 공유하세요",
        detail: "밤이나 주말에도 연락 가능한 사람, 이동 수단, 병원 전화번호를 보호자와 함께 확인해 두세요.",
        emoji: "🚗",
      },
      {
        title: "막달 전 검진 일정을 놓치지 마세요",
        detail: "후기에는 태아 위치, 산모 상태, 분만 계획 확인이 중요합니다. 예약일과 검사 내용을 미리 정리해 주세요.",
        emoji: "📌",
      },
    ]);
  }

  if (week <= 40) {
    return pickDailyTip("37~40주", [
      {
        title: "분만 신호가 오면 기다리지 말고 병원에 연락하세요",
        detail: "규칙적인 진통, 양수로 의심되는 물 흐름, 출혈, 태동 감소가 있으면 앱보다 병원 연락이 먼저입니다.",
        emoji: "🏥",
      },
      {
        title: "태동 감소는 바로 확인이 필요해요",
        detail: "막달에도 아기의 움직임은 중요합니다. 평소보다 확실히 줄었다면 쉬면서 오래 기다리지 말고 병원에 문의하세요.",
        emoji: "👶",
      },
      {
        title: "가방보다 연락 체계를 먼저 확인하세요",
        detail: "분만 병원, 보호자, 이동 수단, 필요한 서류를 한 번에 확인할 수 있게 정리해 두면 당황을 줄일 수 있습니다.",
        emoji: "📞",
      },
    ]);
  }

  return pickDailyTip("40주 이후", [
    {
      title: "예정일 이후에는 진료 일정을 더 꼼꼼히 따르세요",
      detail: "예정일이 지나면 태아 상태와 분만 계획 확인이 더 중요해집니다. 담당 산부인과의 추적 진료 일정을 우선하세요.",
      emoji: "📋",
    },
    {
      title: "태동과 양수 느낌을 계속 관찰하세요",
      detail: "태동 감소나 물이 새는 느낌이 있으면 예정일과 관계없이 바로 병원에 연락해야 합니다.",
      emoji: "🌊",
    },
    {
      title: "유도분만 여부는 담당의 판단을 따르세요",
      detail: "예정일 이후 계획은 산모와 태아 상태에 따라 달라집니다. 검사 결과와 담당의 설명을 기준으로 결정하세요.",
      emoji: "🩺",
    },
  ]);
};

export default function DashboardView({
  user, onNavigate, onLogout, partnerStatus,
}: {
  user: AppUser;
  onNavigate: (s: Screen) => void;
  onLogout: () => void;
  partnerStatus?: PartnerStatus | null;
}) {
  const isPregnant = String(user.role).toUpperCase() === "PREGNANT";
  const userId = (user as any).id || user.user_id;
  
  // 🚀 [핵심 배정] 회원가입 직후 고유 ID가 없을 때를 대비해 이메일을 조회 키로 활용합니다!
  const identifier = userId || user.email;

  const [dbInfo, setDbInfo] = useState({
    name: user.name || "",
    baby_nickname: (user as any).baby_nickname || "",
    pregnancy_start_date: "",
    connected_name: ""
  });

  useEffect(() => {
    if (!identifier) return;
    fetch(apiUrl(`/api/user/info/${identifier}`))
      .then(res => res.json())
      .then(data => {
        if (data.status === "Success") {
          if (data.user_id) {
            (user as any).user_id = data.user_id;
            (user as any).id = data.user_id;
          }

          setDbInfo({
            name: data.name || user.name,
            baby_nickname: data.baby_nickname || "",
            pregnancy_start_date: data.pregnancy_start_date || "",
            connected_name: data.connected_name || ""
          });
        }
      })
      .catch(e => console.error("메인 화면 데이터 갱신 실패:", e));
  }, [identifier]);

  const currentWeek = calculateWeek(dbInfo.pregnancy_start_date);
  const weeklyTip = getWeeklyTip(currentWeek);
  const dailyBenefit = getDailyBenefit(currentWeek);
  const [tipSlide, setTipSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTipSlide((prev) => (prev + 1) % 2);
    }, 4500);
    return () => window.clearInterval(timer);
  }, []);

  const getMissionFromStatus = (status: PartnerStatus | null) => {
    if (!status) return null;
    const { symptoms, emotions, stress } = status;

    if (symptoms.length === 0 && emotions.length === 0 && stress <= 3) {
      return { type: "good" as const, icon: "😊", message: "아내가 오늘 기분이 좋아요!", subtitle: "함께 행복한 시간을 보내세요 💕", color: "#69C99A" };
    }

    const missionMap: Record<string, { icon: string; message: string; subtitle: string }> = {
      "두통": { icon: "💊", message: "아내가 두통이 있어요", subtitle: "조용한 환경을 만들어주고 빨래를 대신 해주세요" },
      "입덧": { icon: "🍵", message: "아내가 입덧으로 힘들어해요", subtitle: "생강차를 준비해주고 환기를 시켜주세요" },
      "붓기": { icon: "🦶", message: "아내가 붓기로 불편해해요", subtitle: "발 마사지를 해주고 다리를 높이 올려 쉬도록 해주세요" },
      "피로감": { icon: "😴", message: "아내가 피곤해하고 있어요", subtitle: "집안일을 대신하고 충분히 쉴 수 있게 해주세요" },
      "허리통증": { icon: "💆", message: "아내가 허리 통증이 있어요", subtitle: "부드럽게 마사지해주고 무거운 물건을 들지 않게 도와주세요" },
      "수면장애": { icon: "🌙", message: "아내가 잠을 잘 못 자고 있어요", subtitle: "조명을 어둡게 하고 편안한 환경을 만들어주세요" },
      "소화불량": { icon: "🍽️", message: "아내가 소화불량이에요", subtitle: "가벼운 식사를 준비하고 식후 산책을 함께 해주세요" },
    };

    for (const symptom of symptoms) {
      if (missionMap[symptom]) {
        return { type: "mission" as const, icon: missionMap[symptom].icon, message: missionMap[symptom].message, subtitle: missionMap[symptom].subtitle, color: "#FFAB76" };
      }
    }

    if (emotions.includes("스트레스") || emotions.includes("불안") || emotions.includes("우울감")) {
      return { type: "mission" as const, icon: "💙", message: "아내가 감정적으로 힘든 시간이에요", subtitle: "대화를 나누고 따뜻하게 안아주세요", color: "#9B8EC4" };
    }

    if (stress >= 7) {
      return { type: "mission" as const, icon: "🧘", message: "아내의 스트레스 지수가 높아요", subtitle: "함께 산책하거나 좋아하는 음악을 들어주세요", color: "#FFAB76" };
    }

    return { type: "info" as const, icon: "💕", message: "아내의 컨디션을 확인해보세요", subtitle: "작은 관심이 큰 힘이 됩니다", color: "#FFB3C6" };
  };

  const mission = !isPregnant ? getMissionFromStatus(partnerStatus || null) : null;

 // 🚀 마이 로드의 기획: 정신 케어 삭제, 상태 체크를 2칸(colSpan: 2)으로 확장
  // 🚀 동적 렌더링: 접속 권한에 따른 메뉴 스와이핑
  // 🚀 동적 렌더링 + 타입스크립트 에러 완벽 해결 (as 문법 추가)
  const features: Array<{ id: Screen; icon: string; title: string; subtitle: string; grad: [string, string]; available: boolean; colSpan?: number }> = [
    { id: "discomfort", icon: "🏠", title: "오늘의 상태 체크", subtitle: "AI 감정 분석 & 가전 자동 제어", grad: ["#FFB3C6", "#FF8FAB"], available: isPregnant, colSpan: 2 },
    
    // 🌟 에러 해결: id와 grad에 명시적으로 타입(as Screen, as [string, string])을 달아주어 TS의 오해를 풀었습니다!
    ...(isPregnant 
      ? [{ id: "ai" as Screen, icon: "🤖", title: "AI 맞춤 추천", subtitle: `${currentWeek}주차 맞춤 가이드`, grad: ["#FFDAA5", "#FFB74D"] as [string, string], available: true }]
      : [{ id: "mission" as Screen, icon: "🎁", title: "아내 케어 미션", subtitle: "오늘 아내를 위한 추천 행동", grad: ["#82B1FF", "#4D8AF0"] as [string, string], available: true }]
    ),

    { id: "info", icon: "📋", title: "신뢰 정보", subtitle: "검증된 의학 정보만", grad: ["#A8E6CF", "#69C99A"], available: true },
    { id: "community", icon: "💬", title: "커뮤니티", subtitle: "같은 시기 예비맘들과 소통", grad: ["#B5EAD7", "#78C9A0"], available: true },
    { id: "smalltalk", icon: "💕", title: "스몰토크", subtitle: "매일 질문으로 대화하기", grad: ["#FFD3B6", "#FFA882"], available: true },
  ];
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-5 pt-12 pb-6" style={{ background: "linear-gradient(160deg, #FFE8EE 0%, #FFF5F7 100%)" }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm text-muted-foreground">안녕하세요 👋</p>
            <h2 className="text-2xl font-bold" style={{ fontFamily: "'Nanum Myeongjo', serif", color: "#2D1B33" }}>
              {dbInfo.name}님
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ background: "rgba(201, 78, 112, 0.1)" }}>
              {isPregnant ? "🤰" : "👨"}
            </div>
            <button onClick={onLogout} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/60 transition-colors">
              <LogOut size={16} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {isPregnant ? (
          <div className="rounded-2xl px-5 py-4 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #C94E70, #E8789A)", color: "white" }}>
            <div>
              <p className="text-white/80 text-xs font-medium">{dbInfo.baby_nickname ? `${dbInfo.baby_nickname}와 함께` : "현재 임신"}</p>
              <p className="text-3xl font-bold">{currentWeek}주차</p>
              <p className="text-white/80 text-xs mt-0.5">오늘도 잘 하고 있어요 ✨</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-3xl">👶</span>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-2xl px-5 py-4 mb-3" style={{ background: "linear-gradient(135deg, #7B68B5, #9B8EC4)", color: "white" }}>
              <p className="text-white/80 text-xs font-medium">
                보호자 모드 {dbInfo.baby_nickname ? `· ${dbInfo.baby_nickname}` : ""}
              </p>
              <p className="text-xl font-bold">
                {dbInfo.connected_name ? `${dbInfo.connected_name}님의 임신 ${currentWeek}주차` : "연결된 임산부가 없습니다"}
              </p>
              <p className="text-white/80 text-xs mt-0.5">오늘 컨디션: 보통 💙</p>
            </div>

            {mission && (
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }} className="rounded-2xl px-5 py-4 shadow-lg" style={{ background: `linear-gradient(135deg, ${mission.color}15, ${mission.color}08)`, border: `2px solid ${mission.color}40` }}>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0" style={{ background: `${mission.color}20` }}>
                    {mission.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-foreground">{mission.message}</p>
                      {mission.type === "mission" && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${mission.color}`, color: "white" }}>
                          오늘의 미션
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{mission.subtitle}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      <div className="px-5 py-5">
        <p className="font-semibold text-foreground mb-4">무엇이 필요하세요?</p>
       <div className="grid grid-cols-2 gap-3">
          {features.map((feat, i) => (
            <motion.button
              key={feat.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => feat.available && onNavigate(feat.id)}
              /* 최소 높이(130px) 고정 및 큰 네모일 경우 패딩(p-5)을 더 주어 안정감 있게 배치 */
              className={`bg-card rounded-2xl text-left border border-border hover:shadow-md transition-all active:scale-95 relative overflow-hidden min-h-[130px] ${
                feat.colSpan === 2 ? "col-span-2 flex items-center gap-5 p-5" : "col-span-1 flex flex-col justify-center p-4"
              }`}
            >
              {/* 🚀 수정: 큰 네모(colSpan === 2)일 때는 아이콘 크기를 w-14, h-14, text-3xl로 키움! */}
              <div 
                className={`rounded-xl flex items-center justify-center shrink-0 ${
                  feat.colSpan === 2 ? "w-14 h-14 text-3xl" : "w-12 h-12 text-2xl mb-3"
                }`} 
                style={{ background: `linear-gradient(135deg, ${feat.grad[0]}, ${feat.grad[1]})` }}
              >
                {feat.icon}
              </div>
              
              <div>
                {/* 🚀 수정: 큰 네모일 때는 제목 글씨를 text-lg로 큼직하게, 작은 네모는 text-sm 유지 */}
                <p className={`font-bold text-foreground leading-tight ${feat.colSpan === 2 ? "text-lg" : "text-sm"}`}>
                  {feat.title}
                </p>
                {/* 🚀 수정: 큰 네모일 때는 부제목 글씨를 text-sm으로, 작은 네모는 text-xs 유지 */}
                <p className={`text-muted-foreground mt-1 ${feat.colSpan === 2 ? "text-sm" : "text-xs"}`}>
                  {feat.subtitle}
                </p>
              </div>

              {!feat.available && (
                <div className="absolute inset-0 bg-card/80 rounded-2xl flex items-center justify-center z-10 backdrop-blur-sm">
                  <span className="text-xs font-bold text-white bg-black/40 px-3 py-1 rounded-full">임산부 전용</span>
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-8 flex-1">
        <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, #FFF0F5, #F9E4EC)" }}>
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              {tipSlide === 0 ? <Star size={14} style={{ color: "#C94E70" }} /> : <Gift size={14} style={{ color: "#2D7A9A" }} />}
              <p className="text-xs font-semibold" style={{ color: tipSlide === 0 ? "#C94E70" : "#2D7A9A" }}>
                {tipSlide === 0 ? "오늘의 팁" : "오늘의 혜택 추천"}
              </p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "rgba(201,78,112,0.1)", color: "#C94E70" }}>
              {tipSlide === 0 ? weeklyTip.label : dailyBenefit.stage}
            </span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl leading-none mt-0.5">{tipSlide === 0 ? weeklyTip.emoji : dailyBenefit.emoji}</span>
            <div>
              <p className="text-sm text-foreground font-medium leading-snug">
                {tipSlide === 0 ? weeklyTip.title : dailyBenefit.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {tipSlide === 0 ? weeklyTip.detail : `${dailyBenefit.amount} · ${dailyBenefit.summary}`}
              </p>
            </div>
          </div>
          <div className="flex justify-center gap-1.5 mt-3">
            {[0, 1].map((index) => (
              <button
                key={index}
                onClick={() => setTipSlide(index)}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: tipSlide === index ? "#C94E70" : "rgba(201,78,112,0.25)" }}
                aria-label={`${index + 1}번째 팁 보기`}
              />
            ))}
          </div>
        </div>
      </div>

      <BottomNav current="dashboard" onNavigate={onNavigate} />
    </div>
  );
}
