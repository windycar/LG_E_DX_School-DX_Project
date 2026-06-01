import { apiUrl } from "./api";
import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { AppUser, Screen } from "./types";
import AIWeeklyRecommendView, { ApiWeeklyGuide } from "./AIWeeklyRecommendView";
import AIStretchView from "./AIStretchView";
import AIContentView, { ApiContentGroups } from "./AIContentView";
// @ts-ignore
import { BottomNav } from "./App";

const calculateWeek = (dateString: string | undefined | null) => {
  if (!dateString || dateString === "None" || dateString === "") return 0;
  const start = new Date(dateString);
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, Math.floor(diffDays / 7));
};

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

export default function AIRecommendView({ user, onBack, onNavigate }: { user: AppUser; onBack: () => void; onNavigate?: (s: Screen) => void }) {
  const [tab, setTab] = useState<"recommend" | "stretch" | "content">("recommend");
  const userId = (user as any).id || user.user_id;
  const identifier = userId || user.email;
  const [isLoading, setIsLoading] = useState(true);
  const [dbInfo, setDbInfo] = useState({
    baby_nickname: (user as any).baby_nickname || user.babyNickname || "",
    pregnancy_start_date: (user as any).pregnancy_start_date || "",
  });
  const [weeklyGuide, setWeeklyGuide] = useState<ApiWeeklyGuide | null>(null);
  const [contentGroups, setContentGroups] = useState<ApiContentGroups | null>(null);
  const [serverWeek, setServerWeek] = useState<number | null>(null);

  useEffect(() => {
    if (!identifier) return;

    setIsLoading(true);
    fetch(apiUrl(`/api/ai/weekly-recommendations/${identifier}`))
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "Success") {
          if (data.user_id) {
            (user as any).user_id = data.user_id;
            (user as any).id = data.user_id;
          }

          setDbInfo({
            baby_nickname: data.baby_nickname || (user as any).baby_nickname || user.babyNickname || "",
            pregnancy_start_date: data.pregnancy_start_date || (user as any).pregnancy_start_date || "",
          });
          setServerWeek(typeof data.pregnancy_week === "number" ? data.pregnancy_week : null);
          setWeeklyGuide(data.guide || null);
          setContentGroups(data.contents || null);
        }
      })
      .catch((error) => console.error("AI 추천 데이터 갱신 실패:", error))
      .finally(() => setIsLoading(false));
  }, [identifier]);

  const w = serverWeek ?? (dbInfo.pregnancy_start_date ? calculateWeek(dbInfo.pregnancy_start_date) : user.pregnancyWeek || 0);
  const syncedUser = {
    ...user,
    babyNickname: dbInfo.baby_nickname || user.babyNickname,
    baby_nickname: dbInfo.baby_nickname || (user as any).baby_nickname,
    pregnancy_start_date: dbInfo.pregnancy_start_date || (user as any).pregnancy_start_date,
  } as AppUser;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader title="AI 맞춤 추천" onBack={onBack} />

      <div className="flex border-b border-border">
        {(
          [
            ["recommend", "주차별 추천"],
            ["stretch", "스트레칭"],
            ["content", "콘텐츠"],
          ] as const
        ).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-3 text-sm font-medium transition-colors"
            style={{
              color: tab === t ? "#FFAB76" : "var(--muted-foreground)",
              borderBottom: tab === t ? "2px solid #FFAB76" : "2px solid transparent",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="px-5 py-6 space-y-5 flex-1 overflow-y-auto pb-20">
        {isLoading && (
          <div className="rounded-xl p-3 text-sm text-muted-foreground" style={{ background: "rgba(255,171,118,0.06)", border: "1px solid rgba(255,171,118,0.15)" }}>
            DB에서 사용자 주차별 추천을 불러오는 중입니다...
          </div>
        )}
        {tab === "recommend" && <AIWeeklyRecommendView week={w} user={syncedUser} guide={weeklyGuide} />}
        {tab === "stretch" && <AIStretchView week={w} />}
        {tab === "content" && <AIContentView week={w} contentGroups={contentGroups} />}
      </div>

      {onNavigate && <BottomNav current="dashboard" onNavigate={onNavigate} />}
    </div>
  );
}
