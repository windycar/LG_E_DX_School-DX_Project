import { motion } from "motion/react";
import { LogOut, Star } from "lucide-react";
import { AppUser, PartnerStatus, Screen } from "./types";
// @ts-ignore
import { BottomNav } from "./App"; 

export default function DashboardView({
  user, onNavigate, onLogout, partnerStatus,
}: {
  user: AppUser;
  onNavigate: (s: Screen) => void;
  onLogout: () => void;
  partnerStatus?: PartnerStatus | null;
}) {
  const isPregnant = user.role === "pregnant";
  const connected = (user as any).connected_pregnant;

  const getPregnancyWeek = (startDateStr: string | undefined) => {
    if (!startDateStr) return 0;
    const start = new Date(startDateStr);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, Math.floor(diffDays / 7));
  };

  const displayWeek = connected ? getPregnancyWeek(connected.pregnancy_start_date) : 0;

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

  const features: Array<{ id: Screen; icon: string; title: string; subtitle: string; grad: [string, string]; available: boolean }> = [
    { id: "discomfort", icon: "🏠", title: "오늘의 상태 체크", subtitle: "불편 증상 & 가전 자동 제어", grad: ["#FFB3C6", "#FF8FAB"], available: isPregnant },
    { id: "mental", icon: "💙", title: "정신 케어", subtitle: "감정 일기 & 주간 리포트", grad: ["#C3B1E1", "#9B8EC4"], available: isPregnant },
    { id: "ai", icon: "🤖", title: "AI 맞춤 추천", subtitle: `${user.pregnancyWeek}주차 맞춤 가이드`, grad: ["#FFDAA5", "#FFB74D"], available: isPregnant },
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
              {user.name}님
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
              <p className="text-white/80 text-xs font-medium">{user.babyNickname ? `${user.babyNickname}와 함께` : "현재 임신"}</p>
              <p className="text-3xl font-bold">{user.pregnancyWeek}주차</p>
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
                보호자 모드 {connected?.baby_nickname ? `· ${connected.baby_nickname}` : ""}
              </p>
              <p className="text-xl font-bold">
                {connected ? `${connected.name}님의 임신 ${displayWeek}주차` : "연결된 임산부가 없습니다"}
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
            <motion.button key={feat.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} onClick={() => feat.available && onNavigate(feat.id)} className="bg-card rounded-2xl p-4 text-left border border-border hover:shadow-md transition-all active:scale-95 relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 text-2xl" style={{ background: `linear-gradient(135deg, ${feat.grad[0]}, ${feat.grad[1]})` }}>
                {feat.icon}
              </div>
              <p className="font-semibold text-foreground text-sm leading-tight">{feat.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{feat.subtitle}</p>
              {!feat.available && (
                <div className="absolute inset-0 bg-card/80 rounded-2xl flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">임산부 전용</span>
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-8 flex-1">
        <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, #FFF0F5, #F9E4EC)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Star size={14} style={{ color: "#C94E70" }} />
            <p className="text-xs font-semibold" style={{ color: "#C94E70" }}>오늘의 팁</p>
          </div>
          <p className="text-sm text-foreground font-medium">28주차에는 좌측 수면 자세가 혈액순환에 좋아요</p>
          <p className="text-xs text-muted-foreground mt-1">무릎 사이에 베개를 끼우면 더욱 편안합니다 💤</p>
        </div>
      </div>

      <BottomNav current="dashboard" onNavigate={onNavigate} />
    </div>
  );
}