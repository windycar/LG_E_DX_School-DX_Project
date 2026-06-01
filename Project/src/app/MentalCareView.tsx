import React, { useState } from "react";
// 🚀 수정 1: LineChart 아이콘 충돌을 없애고, PageHeader에 쓸 ArrowLeft를 추가했습니다.
import { ChevronRight, ArrowLeft } from "lucide-react"; 
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Line, LineChart } from "recharts";
// @ts-ignore
import { BottomNav } from "./App";
import { AppUser, Screen } from "./types";

// 🚀 수정 2: 누락되어 있던 PageHeader 컴포넌트를 추가했습니다.
function PageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 bg-card/90 backdrop-blur-sm sticky top-0 z-10 border-b border-border">
      <button onClick={onBack} className="p-2 rounded-xl hover:bg-secondary transition-colors">
        sasadasdsadsds
        <ArrowLeft size={20} className="text-foreground" />
      </button>
      <h1 className="font-semibold text-foreground">{title}</h1>
    </div>
  );
}

// 🚀 수정 3: 주간 리포트 그래프를 그리기 위한 가상의 데이터를 추가했습니다.
const MOOD_HISTORY = [
  { day: "월", score: 3 },
  { day: "화", score: 4 },
  { day: "수", score: 3 },
  { day: "목", score: 2 },
  { day: "금", score: 4 },
  { day: "토", score: 4 },
  { day: "일", score: 5 },
];

export default function MentalCareView({ user, onBack, onNavigate }: { user?: AppUser; onBack: () => void; onNavigate?: (s: Screen) => void }) {
  // 'today' 탭을 제거하고 기본 탭을 'report'로 설정
  const [tab, setTab] = useState<"report" | "content">("report");

  const isGuardian = user?.role === "guardian";

  const MOODS = [
    { score: 1, emoji: "😔", label: "매우 힘든" },
    { score: 2, emoji: "😟", label: "힘든" },
    { score: 3, emoji: "😐", label: "보통" },
    { score: 4, emoji: "🙂", label: "좋은" },
    { score: 5, emoji: "😊", label: "매우 좋은" },
  ];

  const CONTENT = [
    { emoji: "🧘", title: "임산부 호흡 명상 5분", type: "명상", dur: "5분" },
    { emoji: "🌸", title: "긍정 확언 — 나는 좋은 엄마가 될 수 있어", type: "확언", dur: "3분" },
    { emoji: "🎵", title: "태교 음악 — 모차르트 클래식", type: "음악", dur: "20분" },
    { emoji: "📖", title: "산전 불안 이해하고 극복하기", type: "읽기", dur: "10분" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col animate-in slide-in-from-right duration-300">
      <PageHeader title="정신 케어" onBack={onBack} />

      <div className="flex border-b border-border overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {([["report", "주간 리포트"], ["content", "추천 콘텐츠"]] as const).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="shrink-0 px-4 py-3 text-sm font-medium transition-colors"
            style={{
              color: tab === t ? "#7B68B5" : "var(--muted-foreground)",
              borderBottom: tab === t ? "2px solid #7B68B5" : "2px solid transparent",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="px-5 py-6 flex-1 overflow-y-auto pb-20">
        {tab === "report" && (
          <div className="space-y-6">
            <div>
              <p className="font-semibold text-foreground mb-1">이번 주 감정 변화</p>
              <p className="text-xs text-muted-foreground mb-4">5점 만점 기준</p>
              <div className="bg-card rounded-2xl p-4 border border-border">
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={MOOD_HISTORY}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#967A86" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[1, 5]} tick={{ fontSize: 11, fill: "#967A86" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ border: "none", borderRadius: "12px", background: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                      formatter={(v: number) => [`${v}점`, "기분"]}
                    />
                    <Line type="monotone" dataKey="score" stroke="#7B68B5" strokeWidth={2.5} dot={{ fill: "#7B68B5", r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "평균 기분", value: "3.5점", emoji: "🙂" },
                { label: "최고의 날", value: "일요일", emoji: "😊" },
                { label: "기록 일수", value: "7일", emoji: "📅" },
              ].map((s) => (
                <div key={s.label} className="bg-card rounded-2xl p-3 border border-border text-center">
                  <p className="text-xl mb-1">{s.emoji}</p>
                  <p className="font-bold text-sm text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            <div
              className="rounded-2xl p-4"
              style={{ background: "rgba(123,104,181,0.06)", border: "1.5px solid rgba(123,104,181,0.15)" }}
            >
              <p className="font-semibold text-sm" style={{ color: "#7B68B5" }}>💜 이번 주 분석</p>
              <p className="text-sm text-foreground mt-2 leading-relaxed">
                전반적으로 안정적인 감정 패턴을 보이고 있어요. 목요일 기분이 낮았는데, 휴식을 충분히 취하셨나요? 꾸준한 기록이 큰 도움이 됩니다 💙
              </p>
            </div>
          </div>
        )}

        {tab === "content" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">감정 패턴에 맞춘 추천 콘텐츠예요</p>
            {CONTENT.map((c, i) => (
              <div key={i} className="bg-card rounded-2xl p-4 border border-border flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: "rgba(123,104,181,0.1)" }}
                >
                  {c.emoji}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-foreground">{c.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(123,104,181,0.1)", color: "#7B68B5" }}>
                      {c.type}
                    </span>
                    <span className="text-xs text-muted-foreground">{c.dur}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            ))}

            <div
              className="rounded-2xl p-4 text-center mt-2"
              style={{ background: "rgba(201,78,112,0.05)", border: "1.5px solid rgba(201,78,112,0.1)" }}
            >
              <p className="text-sm font-medium text-foreground">우울·불안 지수가 높을 때는</p>
              <p className="text-xs text-muted-foreground mt-1 mb-3">전문 상담사와 연결되어 도움받을 수 있어요</p>
              <button className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "#C94E70" }}>
                전문 상담 연결하기
              </button>
            </div>
          </div>
        )}

      </div>

      {onNavigate && <BottomNav current="dashboard" onNavigate={onNavigate} />}
    </div>
  );
}