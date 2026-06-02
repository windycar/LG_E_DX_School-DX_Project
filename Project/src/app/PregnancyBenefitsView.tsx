import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Gift, ShieldCheck } from "lucide-react";
import { apiUrl } from "./api";
import { BottomNav } from "./App";
import { AppUser, Screen } from "./types";
import { getRecommendedBenefits, PREGNANCY_BENEFITS } from "./pregnancyBenefitsData";

const calculateWeek = (dateString: string | undefined | null) => {
  if (!dateString || dateString === "None") return 0;
  const start = new Date(dateString);
  if (Number.isNaN(start.getTime())) return 0;
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, Math.floor(diffDays / 7));
};

const periodLabel = (week: number) => {
  if (week <= 0) return "임신 주차 확인 필요";
  if (week <= 13) return "임신 초기";
  if (week <= 27) return "임신 중기";
  if (week <= 40) return "임신 후기";
  return "출산 예정일 이후";
};

export default function PregnancyBenefitsView({
  user,
  onBack,
  onNavigate,
}: {
  user: AppUser | null;
  onBack: () => void;
  onNavigate?: (screen: Screen) => void;
}) {
  const identifier = user?.user_id || user?.email;
  const [currentWeek, setCurrentWeek] = useState(user?.pregnancyWeek || 0);
  const [pregnancyStartDate, setPregnancyStartDate] = useState<string>("");

  useEffect(() => {
    if (!identifier) return;

    fetch(apiUrl(`/api/user/info/${identifier}`))
      .then((res) => res.json())
      .then((data) => {
        if (data.status !== "Success") return;

        const startDate =
          data.pregnancy_start_date ||
          data.connected_pregnant?.pregnancy_start_date ||
          user?.connected_pregnant?.pregnancy_start_date ||
          "";

        setPregnancyStartDate(startDate);
        setCurrentWeek(calculateWeek(startDate) || user?.pregnancyWeek || 0);
      })
      .catch((error) => {
        console.error("혜택 화면 사용자 정보 갱신 실패:", error);
      });
  }, [identifier, user?.pregnancyWeek, user?.connected_pregnant?.pregnancy_start_date]);

  const recommended = getRecommendedBenefits(currentWeek);
  const otherBenefits = PREGNANCY_BENEFITS.filter((item) => !recommended.some((recommendedItem) => recommendedItem.id === item.id));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center gap-3 px-5 py-4 bg-card/90 backdrop-blur-sm sticky top-0 z-10 border-b border-border">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-secondary transition-colors" aria-label="뒤로가기">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="font-semibold text-foreground">임산부 정부 혜택</h1>
      </div>

      <div className="px-5 py-5 flex-1 overflow-y-auto pb-24 space-y-5">
        <section className="rounded-2xl p-5 text-white shadow-sm" style={{ background: "linear-gradient(135deg, #2D7A9A, #69C99A)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Gift size={18} />
            <p className="text-sm font-semibold">현재 맞춤 추천</p>
          </div>
          <h2 className="text-xl font-bold">
            {periodLabel(currentWeek)} {currentWeek > 0 ? `${currentWeek}주차` : ""}
          </h2>
          <p className="text-sm mt-2 opacity-90 leading-relaxed">
            현재 주차에 맞는 정부 지원을 먼저 보여줍니다. 실제 대상 여부는 거주지, 소득, 출산 형태, 신청 시점에 따라 달라질 수 있습니다.
          </p>
          <p className="text-xs mt-3 opacity-80">
            기준일: {pregnancyStartDate || "임신 시작일 미설정"}
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-foreground">지금 먼저 확인할 혜택</p>
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(45,122,154,0.1)", color: "#2D7A9A" }}>
              {recommended.length}개
            </span>
          </div>
          {recommended.map((benefit) => (
            <BenefitCard key={benefit.id} benefit={benefit} emphasized />
          ))}
        </section>

        <section className="space-y-3">
          <p className="text-sm font-bold text-foreground">함께 알아둘 공통 혜택</p>
          {otherBenefits.map((benefit) => (
            <BenefitCard key={benefit.id} benefit={benefit} />
          ))}
        </section>

        <section className="rounded-2xl p-4 border border-border bg-card">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={16} style={{ color: "#2D7A9A" }} />
            <p className="text-sm font-bold text-foreground">확인 기준</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            보건복지부, 정부24, 사회서비스 전자바우처 등 공공 안내를 기준으로 정리했습니다. 지자체 출산지원금, 교통비, 산후조리비는 지역별로 다르므로 주민등록 주소지 보건소·주민센터 확인이 필요합니다.
          </p>
        </section>
      </div>

      {onNavigate && <BottomNav current="info" onNavigate={onNavigate} />}
    </div>
  );
}

function BenefitCard({ benefit, emphasized = false }: { benefit: (typeof PREGNANCY_BENEFITS)[number]; emphasized?: boolean }) {
  return (
    <article
      className="rounded-2xl p-4 border shadow-sm"
      style={{
        background: emphasized ? "rgba(105,201,154,0.08)" : "var(--card)",
        borderColor: emphasized ? "rgba(105,201,154,0.28)" : "var(--border)",
      }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none">{benefit.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(201,78,112,0.1)", color: "#C94E70" }}>
              {benefit.stage}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(45,122,154,0.1)", color: "#2D7A9A" }}>
              {benefit.amount}
            </span>
          </div>
          <h3 className="text-sm font-bold text-foreground">{benefit.title}</h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{benefit.summary}</p>
          <div className="mt-3 space-y-1.5">
            <p className="text-xs text-foreground">
              <span className="font-semibold">대상: </span>
              {benefit.target}
            </p>
            <p className="text-xs text-foreground">
              <span className="font-semibold">신청: </span>
              {benefit.apply}
            </p>
          </div>
          <a
            href={benefit.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold"
            style={{ color: "#2D7A9A" }}
          >
            {benefit.source}
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </article>
  );
}
