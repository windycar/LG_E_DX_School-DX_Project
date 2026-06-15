import React from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { AppUser } from "./types";

export type WeeklyGuide = {
  range: string;
  fetalSize: string;
  fetalWeight: string;
  highlight: string;
  foods: string[];
  activities: string[];
  warnings: string[];
  sourceNote: string;
  savedRecommendationCount?: number;
  personalization?: {
    applied: boolean;
    basisCount: number;
    recentEmotion: string | null;
    keywords: string[];
    summary: string;
  };
};

export type ApiWeeklyGuide = WeeklyGuide;

const getWeeklyGuide = (week: number): WeeklyGuide => {
  if (week <= 12) {
    return {
      range: "1~12주",
      fetalSize: "자두~라임",
      fetalWeight: "개인차 큼",
      highlight: "주요 기관 형성과 초기 영양 관리가 중요한 시기입니다.",
      foods: [
        "엽산: 시금치·브로콜리·콩류",
        "단백질: 달걀·두부·살코기",
        "입덧 시: 크래커·토스트처럼 부담 적은 음식",
        "수분: 물을 조금씩 자주",
      ],
      activities: ["무리 없는 짧은 산책", "가벼운 호흡 운동", "피로하면 휴식 우선"],
      warnings: ["술·흡연 피하기", "날생선·덜 익힌 음식 피하기", "복용 약은 의료진 확인", "심한 복통·출혈은 병원 연락"],
      sourceNote: "질병관리청 임산부 식이영양, ACOG 임신 중 영양 자료 기준",
    };
  }

  if (week <= 20) {
    return {
      range: "13~20주",
      fetalSize: "아보카도~바나나",
      fetalWeight: "약 100~300g대",
      highlight: "태아 움직임과 산모 체형 변화가 점점 뚜렷해지는 시기입니다.",
      foods: ["철분: 살코기·콩류·녹색 채소", "칼슘: 우유·요거트·두부", "비타민 C: 과일·채소", "단백질 식품 매끼 조금씩"],
      activities: ["걷기 10~20분부터", "가벼운 산전 스트레칭", "오래 앉아 있으면 중간중간 자세 바꾸기"],
      warnings: ["숨이 너무 차면 중단", "배를 강하게 압박하는 자세 피하기", "어지러움·흉통·출혈 시 운동 중단"],
      sourceNote: "질병관리청 신체활동 정보, ACOG 임신 중 운동 자료 기준",
    };
  }

  if (week <= 28) {
    return {
      range: "21~28주",
      fetalSize: "파파야~가지",
      fetalWeight: "약 500g~1kg 전후",
      highlight: "정밀초음파와 임신당뇨 검사 등 산전검사 관리가 중요해지는 시기입니다.",
      foods: ["철분과 단백질 식품", "칼슘·비타민 D 식품", "오메가3 생선은 안전한 종류로", "카페인은 하루 총량 확인"],
      activities: ["중강도 걷기", "수영 또는 수중운동", "옆으로 누워 쉬는 습관"],
      warnings: ["태동이 확 줄면 병원 연락", "수은 높은 생선 과다 섭취 피하기", "규칙적 배뭉침·출혈·양수 의심 시 연락"],
      sourceNote: "서울아산병원 산전검사, 질병관리청 임산부 영양, ACOG 자료 기준",
    };
  }

  if (week <= 36) {
    return {
      range: "29~36주",
      fetalSize: "호박~멜론",
      fetalWeight: "약 1.2~2.6kg 전후",
      highlight: "태아 성장과 산모의 붓기, 허리 부담, 수면 불편이 커질 수 있는 시기입니다.",
      foods: ["저염식으로 붓기 부담 줄이기", "수분은 낮부터 나누어 섭취", "소량씩 자주 식사", "철분·단백질 꾸준히"],
      activities: ["짧은 산책", "골반 주변 가벼운 스트레칭", "다리 올리고 쉬기"],
      warnings: ["갑작스러운 심한 부종·두통 주의", "오래 서 있기 피하기", "숨참·흉통·실신 느낌은 즉시 도움 요청"],
      sourceNote: "질병관리청 임신고혈압 정보, ACOG 운동 중단 신호 기준",
    };
  }

  return {
    range: week <= 40 ? "37~40주" : "40주 이후",
    fetalSize: "수박",
    fetalWeight: "약 2.8kg 이상 개인차",
    highlight: "분만 신호와 태동 변화를 가장 우선해서 확인해야 하는 시기입니다.",
    foods: ["소화 잘 되는 식사", "수분 충분히", "변비 예방 식이섬유", "무리한 보양식보다 균형식"],
    activities: ["가벼운 걷기", "호흡 이완", "출산가방·병원 연락처 확인"],
    warnings: ["규칙적 진통은 병원 연락", "양수 의심·출혈 시 즉시 연락", "태동 감소는 바로 확인", "예정일 이후 진료 일정 우선"],
    sourceNote: "서울아산병원 조산·산전검사 정보, ACOG 태동·운동 안전 기준",
  };
};

export default function AIWeeklyRecommendView({ week, user, guide }: { week: number; user: AppUser; guide?: ApiWeeklyGuide | null }) {
  const data = guide || getWeeklyGuide(week);

  return (
    <>
      <div className="rounded-2xl p-5 text-white" style={{ background: "linear-gradient(135deg, #FFAB76, #FF7A45)" }}>
        <p className="text-white/80 text-xs mb-1">현재 임신 주차 · {data.range}</p>
        <div className="flex items-end gap-3 mb-2">
          <span className="text-4xl font-bold">{week}주차</span>
          <span className="text-white/80 text-sm mb-1">
            {(user as any).baby_nickname || "태아"} 크기: {data.fetalSize} ({data.fetalWeight})
          </span>
        </div>
        <p className="text-white/90 text-sm">{data.highlight}</p>
      </div>

      <div className="rounded-xl p-3 flex items-center gap-2 text-sm" style={{ background: "rgba(201,78,112,0.06)", border: "1px solid rgba(201,78,112,0.15)" }}>
        <span>🤖</span>
        <p className="text-muted-foreground">
          <span className="font-semibold" style={{ color: "#C94E70" }}>{data.range}</span>에 맞춘 공식 자료 기반 추천입니다
        </p>
      </div>

      {data.personalization && (
        <div className="rounded-xl p-4 text-sm space-y-2" style={{ background: "rgba(255,171,118,0.08)", border: "1px solid rgba(255,171,118,0.2)" }}>
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-foreground">최근 다이어리 반영</p>
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: "#FFF0E6", color: "#D96B2B" }}>
              {data.personalization.basisCount}개 기록
            </span>
          </div>
          <p className="text-muted-foreground">{data.personalization.summary}</p>
          {(data.personalization.keywords.length > 0 || data.personalization.recentEmotion) && (
            <div className="flex flex-wrap gap-2">
              {data.personalization.recentEmotion && (
                <span className="text-xs px-2 py-1 rounded-full bg-card border border-border">감정: {data.personalization.recentEmotion}</span>
              )}
              {data.personalization.keywords.map((keyword) => (
                <span key={keyword} className="text-xs px-2 py-1 rounded-full bg-card border border-border">#{keyword}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {[
        { icon: "🍎", title: "추천 식품", items: data.foods, indicator: <CheckCircle size={16} style={{ color: "#69C99A", flexShrink: 0 }} />, grid: true },
        { icon: "🏃", title: "권장 활동", items: data.activities, indicator: <CheckCircle size={16} style={{ color: "#69C99A", flexShrink: 0 }} />, grid: false },
        { icon: "⚠️", title: "주의 사항", items: data.warnings, indicator: <AlertTriangle size={16} style={{ color: "#FF9A56", flexShrink: 0 }} />, grid: false },
      ].map((section) => (
        <div key={section.title}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{section.icon}</span>
            <p className="font-semibold text-foreground">{section.title}</p>
          </div>
          {section.grid ? (
            <div className="grid grid-cols-2 gap-2">
              {section.items.map((item, i) => (
                <div key={i} className="bg-card rounded-xl p-3 border border-border">
                  <p className="text-sm text-foreground">{item}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {section.items.map((item, i) => (
                <div key={i} className="bg-card rounded-xl p-3 border border-border flex items-center gap-3">
                  {section.indicator}
                  <p className="text-sm text-foreground">{item}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <p className="text-xs text-center text-muted-foreground pb-2">
        {data.sourceNote} · 의사 상담을 대체하지 않습니다
      </p>
    </>
  );
}
