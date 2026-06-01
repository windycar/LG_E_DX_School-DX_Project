import React from "react";
import { Play } from "lucide-react";

type StretchVideo = {
  id: number;
  title: string;
  label: string;
  duration: string;
  thumbnail: string;
  category: "주차별" | "상황별";
  url: string;
  situation?: string;
  minWeek?: number;
  maxWeek?: number;
};

const youtubeSearchUrl = (query: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

const STRETCH_VIDEOS: StretchVideo[] = [
  {
    id: 1,
    title: "임신 초기 무리 없는 전신 스트레칭",
    label: "~12주",
    duration: "유튜브",
    thumbnail: "🧘‍♀️",
    category: "주차별",
    minWeek: 1,
    maxWeek: 12,
    url: youtubeSearchUrl("임신 초기 임산부 스트레칭 산부인과"),
  },
  {
    id: 2,
    title: "임신 중기 골반·허리 부담 완화 스트레칭",
    label: "13~27주",
    duration: "유튜브",
    thumbnail: "🤸‍♀️",
    category: "주차별",
    minWeek: 13,
    maxWeek: 27,
    url: youtubeSearchUrl("임신 중기 임산부 골반 허리 스트레칭"),
  },
  {
    id: 3,
    title: "임신 후기 부종·다리 순환 스트레칭",
    label: "28~40주",
    duration: "유튜브",
    thumbnail: "🦵",
    category: "주차별",
    minWeek: 28,
    maxWeek: 40,
    url: youtubeSearchUrl("임신 후기 임산부 부종 다리 스트레칭"),
  },
  {
    id: 4,
    title: "입덧 완화를 위한 호흡·이완 영상",
    label: "입덧",
    duration: "유튜브",
    thumbnail: "🌬️",
    category: "상황별",
    situation: "입덧",
    url: youtubeSearchUrl("임산부 입덧 완화 호흡 이완"),
  },
  {
    id: 5,
    title: "허리 통증 완화 임산부 스트레칭",
    label: "허리통증",
    duration: "유튜브",
    thumbnail: "💆‍♀️",
    category: "상황별",
    situation: "허리통증",
    url: youtubeSearchUrl("임산부 허리통증 완화 스트레칭 산부인과"),
  },
  {
    id: 6,
    title: "수면 전 임산부 이완 요가",
    label: "수면장애",
    duration: "유튜브",
    thumbnail: "🌙",
    category: "상황별",
    situation: "수면장애",
    url: youtubeSearchUrl("임산부 수면 전 이완 요가"),
  },
  {
    id: 7,
    title: "붓기 완화 다리 순환 스트레칭",
    label: "붓기",
    duration: "유튜브",
    thumbnail: "🦶",
    category: "상황별",
    situation: "붓기",
    url: youtubeSearchUrl("임산부 붓기 완화 다리 스트레칭"),
  },
];

function VideoCard({ video, accent = "#FFAB76" }: { video: StretchVideo; accent?: string }) {
  return (
    <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-4">
      <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl shrink-0" style={{ background: "rgba(255,171,118,0.1)" }}>
        {video.thumbnail}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground leading-snug">{video.title}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${accent}18`, color: accent }}>
            {video.label}
          </span>
          <span className="text-xs text-muted-foreground">{video.duration}</span>
        </div>
      </div>
      <button
        onClick={() => window.open(video.url, "_blank", "noopener,noreferrer")}
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        style={{ background: accent }}
        aria-label={`${video.title} 유튜브에서 보기`}
      >
        <Play size={16} className="text-white" />
      </button>
    </div>
  );
}

export default function AIStretchView({ week }: { week: number }) {
  const weeklyVideos = STRETCH_VIDEOS.filter((video) => video.category === "주차별");
  const situationVideos = STRETCH_VIDEOS.filter((video) => video.category === "상황별");
  const currentVideo = weeklyVideos.find((video) => week >= (video.minWeek || 0) && week <= (video.maxWeek || 99));

  return (
    <>
      <div className="rounded-xl p-3 flex items-center gap-2 text-sm" style={{ background: "rgba(255,171,118,0.06)", border: "1px solid rgba(255,171,118,0.15)" }}>
        <span>🧘‍♀️</span>
        <p className="text-muted-foreground">
          <span className="font-semibold" style={{ color: "#FFAB76" }}>{week}주차</span>에 맞는 유튜브 스트레칭 검색을 연결했어요
        </p>
      </div>

      {currentVideo && (
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">현재 주차 추천</p>
          <VideoCard video={currentVideo} />
        </div>
      )}

      <div>
        <p className="text-sm font-semibold text-foreground mb-3">주차별 추천</p>
        <div className="space-y-3">
          {weeklyVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-foreground mb-3">상황별 스트레칭</p>
        <div className="space-y-3">
          {situationVideos.map((video) => (
            <VideoCard key={video.id} video={video} accent="#7B68B5" />
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        임신고혈압, 조기진통, 출혈, 양수 의심, 심한 통증이 있으면 운동보다 산부인과 확인이 먼저입니다.
      </p>
    </>
  );
}
