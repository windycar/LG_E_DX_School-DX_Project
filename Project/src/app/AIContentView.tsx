import React, { useState } from "react";
import { AlertTriangle, CheckCircle, ChevronRight, ClipboardCheck, FileText } from "lucide-react";

export type ContentItem = {
  id: number;
  title: string;
  subtitle: string;
  type: "이번 주" | "체크리스트" | "위험신호";
  emoji: string;
  source: string;
  bullets: string[];
};

export type ApiContentGroups = {
  weekly: ContentItem[];
  checklist: ContentItem[];
  warning: ContentItem[];
};

const getWeeklyContents = (week: number): ContentItem[] => {
  if (week <= 12) {
    return [
      {
        id: 101,
        type: "이번 주",
        emoji: "🧬",
        title: "초기에는 엽산과 약 복용 확인이 우선",
        subtitle: "임신 초기 영양과 복용 중인 약을 점검하세요",
        source: "질병관리청 국가건강정보포털",
        bullets: ["엽산 섭취 여부 확인", "복용 중인 약·영양제 산부인과 확인", "술·흡연·날음식 피하기"],
      },
      {
        id: 102,
        type: "이번 주",
        emoji: "🍵",
        title: "입덧이 심하면 먹는 방식부터 바꾸기",
        subtitle: "소량씩 자주 먹고 수분을 나누어 섭취하세요",
        source: "질병관리청 국가건강정보포털",
        bullets: ["냄새 강한 음식 피하기", "크래커·토스트처럼 부담 적은 음식 활용", "물도 못 마시면 병원 문의"],
      },
      {
        id: 103,
        type: "이번 주",
        emoji: "📋",
        title: "첫 산전검사 일정 정리",
        subtitle: "검사 날짜와 병원 안내사항을 한곳에 모으세요",
        source: "서울아산병원 산전검사",
        bullets: ["초음파·혈액검사 일정 확인", "마지막 생리 시작일 기록", "궁금한 증상 메모"],
      },
    ];
  }

  if (week <= 20) {
    return [
      {
        id: 201,
        type: "이번 주",
        emoji: "🚶",
        title: "가벼운 활동을 생활 루틴에 넣기",
        subtitle: "정상 임신이라면 짧은 걷기부터 시작할 수 있어요",
        source: "ACOG 임신 중 운동",
        bullets: ["숨이 너무 차지 않는 강도", "운동 전후 물 마시기", "통증·출혈·어지러움이면 중단"],
      },
      {
        id: 202,
        type: "이번 주",
        emoji: "🩸",
        title: "철분과 단백질 챙기기",
        subtitle: "태아 성장과 혈액량 증가를 고려하세요",
        source: "질병관리청 국가건강정보포털",
        bullets: ["살코기·달걀·콩류", "녹색 채소와 과일", "어지러움 지속 시 빈혈 확인"],
      },
      {
        id: 203,
        type: "이번 주",
        emoji: "👶",
        title: "태동 시작은 개인차가 큼",
        subtitle: "처음 느끼는 시점이 늦어도 바로 이상은 아닐 수 있어요",
        source: "ACOG 태아 발달",
        bullets: ["주수와 태동 느낌 기록", "정기검진에서 질문", "통증·출혈 동반 시 병원 문의"],
      },
    ];
  }

  if (week <= 28) {
    return [
      {
        id: 301,
        type: "이번 주",
        emoji: "🧪",
        title: "정밀초음파와 임신당뇨 검사 준비",
        subtitle: "검사 일정과 안내사항을 미리 확인하세요",
        source: "서울아산병원 산전검사",
        bullets: ["검사 날짜 캘린더 저장", "검사 전 주의사항 확인", "결과 설명 메모"],
      },
      {
        id: 302,
        type: "이번 주",
        emoji: "☕",
        title: "카페인은 총량으로 계산",
        subtitle: "커피 외 음료의 카페인도 함께 봐야 합니다",
        source: "질병관리청·ACOG",
        bullets: ["커피·녹차·홍차·콜라 합산", "오후 늦은 카페인 줄이기", "수면 방해 여부 확인"],
      },
      {
        id: 303,
        type: "이번 주",
        emoji: "😴",
        title: "옆으로 눕는 수면 자세 연습",
        subtitle: "중기 이후에는 바로 눕는 자세가 불편할 수 있어요",
        source: "ACOG 수면 자세",
        bullets: ["무릎 사이 베개 활용", "배 아래 받침 사용", "어지러우면 자세 바꾸기"],
      },
    ];
  }

  if (week <= 36) {
    return [
      {
        id: 401,
        type: "이번 주",
        emoji: "🦶",
        title: "붓기와 혈압 관련 증상 구분",
        subtitle: "갑작스러운 심한 부종은 확인이 필요합니다",
        source: "질병관리청 임신고혈압",
        bullets: ["두통·시야 흐림 동반 여부", "오른쪽 윗배 통증 확인", "갑작스러운 얼굴·손 부종 주의"],
      },
      {
        id: 402,
        type: "이번 주",
        emoji: "🎒",
        title: "출산가방과 병원 연락처 정리",
        subtitle: "급할 때 바로 움직일 수 있게 준비하세요",
        source: "서울아산병원 산전관리",
        bullets: ["산모수첩·신분증", "병원·보호자 연락처", "이동 수단 확인"],
      },
      {
        id: 403,
        type: "이번 주",
        emoji: "🤲",
        title: "태동 패턴을 평소 기준으로 기억",
        subtitle: "평소보다 확 줄면 바로 확인해야 합니다",
        source: "ACOG 태아 발달",
        bullets: ["활동 많은 시간대 기억", "태동 감소 느낌 기록", "확실히 줄면 병원 문의"],
      },
    ];
  }

  return [
    {
      id: 501,
      type: "이번 주",
      emoji: "🏥",
      title: "분만 신호는 병원 연락이 먼저",
      subtitle: "규칙적 진통, 양수, 출혈은 바로 확인하세요",
      source: "서울아산병원 조산·분만 관련 정보",
      bullets: ["진통 간격 기록", "물이 새는 느낌 확인", "출혈 있으면 바로 연락"],
    },
    {
      id: 502,
      type: "이번 주",
      emoji: "📞",
      title: "응급 연락 체계 최종 확인",
      subtitle: "분만 병원과 이동 계획을 바로 볼 수 있게 정리하세요",
      source: "산전관리 일반 원칙",
      bullets: ["분만 병원 번호", "보호자 연락 순서", "야간 이동 방법"],
    },
    {
      id: 503,
      type: "이번 주",
      emoji: "👶",
      title: "막달에도 태동 감소는 중요",
      subtitle: "아기가 덜 움직인다고 느끼면 기다리지 마세요",
      source: "ACOG 태아 발달",
      bullets: ["평소와 다른 감소 확인", "휴식 후에도 감소하면 연락", "앱 답변보다 병원 우선"],
    },
  ];
};

const getChecklistContents = (week: number): ContentItem[] => {
  if (week <= 12) {
    return [
      { id: 601, type: "체크리스트", emoji: "🧾", title: "초기 산전검사 준비", subtitle: "첫 검진 전 확인할 항목", source: "서울아산병원 산전검사", bullets: ["마지막 생리 시작일 기록", "복용 중인 약·영양제 목록", "출혈·복통 여부 메모"] },
      { id: 602, type: "체크리스트", emoji: "🍵", title: "입덧 관리 체크", subtitle: "먹고 마시는 패턴을 점검하세요", source: "질병관리청 임산부 식이영양", bullets: ["소량씩 자주 먹기", "수분을 조금씩 나누기", "물도 못 마시면 병원 문의"] },
      { id: 603, type: "체크리스트", emoji: "🚭", title: "초기 생활습관 점검", subtitle: "태아 발달 초기 위험요인을 줄이세요", source: "질병관리청 국가건강정보포털", bullets: ["술 피하기", "흡연·간접흡연 피하기", "날음식·덜 익힌 음식 피하기"] },
    ];
  }
  if (week <= 20) {
    return [
      { id: 611, type: "체크리스트", emoji: "🥚", title: "중기 영양 체크", subtitle: "철분·단백질·칼슘을 챙기세요", source: "질병관리청 임산부 식이영양", bullets: ["단백질 식품 포함", "철분 식품 포함", "칼슘 식품 포함"] },
      { id: 612, type: "체크리스트", emoji: "🚶", title: "운동 시작 전 체크", subtitle: "안전하게 움직이기 위한 기준", source: "ACOG 임신 중 운동", bullets: ["의료진 제한 여부 확인", "숨이 너무 차면 중단", "운동 전후 물 마시기"] },
      { id: 613, type: "체크리스트", emoji: "👶", title: "태동 기록 준비", subtitle: "느낌과 시간을 가볍게 기록하세요", source: "ACOG 태아 발달", bullets: ["처음 느낀 시기", "활동 많은 시간대", "평소와 다른 변화"] },
    ];
  }
  if (week <= 28) {
    return [
      { id: 621, type: "체크리스트", emoji: "🧪", title: "정밀초음파 체크", subtitle: "검사 전후 확인할 내용", source: "서울아산병원 산전검사", bullets: ["검사 날짜 확인", "결과 설명 메모", "추가검사 여부 확인"] },
      { id: 622, type: "체크리스트", emoji: "📊", title: "임신당뇨 검사 체크", subtitle: "혈당 검사 전후 관리", source: "질병관리청 임신당뇨병", bullets: ["검사 전 안내사항 확인", "결과 수치 메모", "식사·운동 지시 확인"] },
      { id: 623, type: "체크리스트", emoji: "🛏️", title: "수면 자세 체크", subtitle: "중기 이후 편한 자세 만들기", source: "ACOG 수면 자세", bullets: ["옆으로 눕기", "무릎 사이 베개", "어지러우면 자세 변경"] },
    ];
  }
  if (week <= 36) {
    return [
      { id: 631, type: "체크리스트", emoji: "🎒", title: "출산가방 체크", subtitle: "급할 때 바로 들고 갈 수 있게 준비하세요", source: "산전관리 일반 원칙", bullets: ["산모수첩·신분증", "개인 위생용품", "아기 퇴원용품"] },
      { id: 632, type: "체크리스트", emoji: "🦶", title: "부종·혈압 체크", subtitle: "붓기와 동반 증상을 같이 보세요", source: "질병관리청 임신고혈압", bullets: ["얼굴·손 부종", "두통·시야 흐림", "오른쪽 윗배 통증"] },
      { id: 633, type: "체크리스트", emoji: "📞", title: "병원 연락처 체크", subtitle: "야간에도 바로 연락 가능하게 준비하세요", source: "산전관리 일반 원칙", bullets: ["분만 병원 번호", "보호자 연락 순서", "이동 수단"] },
    ];
  }
  return [
    { id: 641, type: "체크리스트", emoji: "🏥", title: "분만 신호 체크", subtitle: "연락해야 할 기준을 미리 정리하세요", source: "서울아산병원 분만 관련 정보", bullets: ["규칙적 진통", "양수 의심", "출혈"] },
    { id: 642, type: "체크리스트", emoji: "🚗", title: "막달 이동 준비", subtitle: "바로 병원에 갈 수 있게 준비하세요", source: "산전관리 일반 원칙", bullets: ["가방 위치", "차량·택시 계획", "병원 연락처"] },
    { id: 643, type: "체크리스트", emoji: "📋", title: "예정일 이후 체크", subtitle: "담당의 추적 계획을 우선하세요", source: "산전관리 일반 원칙", bullets: ["검진 예약", "태동 변화", "유도분만 상담 여부"] },
  ];
};

const getWarningContents = (week: number): ContentItem[] => {
  if (week <= 12) {
    return [
      { id: 701, type: "위험신호", emoji: "🚨", title: "초기 출혈과 심한 복통", subtitle: "가볍게 넘기지 말아야 할 신호", source: "산모 안전 일반 원칙", bullets: ["질 출혈", "심한 복통", "어지러움 동반 통증"] },
      { id: 702, type: "위험신호", emoji: "💧", title: "심한 입덧과 탈수", subtitle: "수분 섭취가 안 되면 확인이 필요합니다", source: "질병관리청 임산부 식이영양", bullets: ["물도 못 마심", "소변량 감소", "계속 토함"] },
      { id: 703, type: "위험신호", emoji: "💊", title: "약 복용 전 확인", subtitle: "임신 초기는 임의 복용을 피하세요", source: "산전관리 일반 원칙", bullets: ["감기약·진통제 임의 복용 금지", "기존 약 의료진 확인", "영양제 중복 확인"] },
    ];
  }
  if (week <= 20) {
    return [
      { id: 711, type: "위험신호", emoji: "⚠️", title: "운동 중 중단 신호", subtitle: "무리하면 바로 멈추세요", source: "ACOG 임신 중 운동", bullets: ["질출혈", "흉통·어지러움", "규칙적 자궁수축"] },
      { id: 712, type: "위험신호", emoji: "🩸", title: "빈혈 의심 증상", subtitle: "어지러움이 지속되면 확인하세요", source: "서울대학교병원 의학정보", bullets: ["지속 피로", "어지러움", "숨참"] },
      { id: 713, type: "위험신호", emoji: "🚨", title: "통증·출혈 동반 태동", subtitle: "태동 자체보다 동반 증상이 중요합니다", source: "산모 안전 일반 원칙", bullets: ["출혈", "심한 복통", "양수 의심"] },
    ];
  }
  if (week <= 28) {
    return [
      { id: 721, type: "위험신호", emoji: "👶", title: "태동 감소", subtitle: "평소보다 확 줄면 바로 확인하세요", source: "ACOG 태아 발달", bullets: ["움직임이 확 줄어듦", "휴식 후에도 변화 없음", "불안하면 병원 문의"] },
      { id: 722, type: "위험신호", emoji: "🌊", title: "양수 의심", subtitle: "물이 새는 느낌은 확인이 필요합니다", source: "서울아산병원 조산 정보", bullets: ["물처럼 흐름", "속옷이 반복적으로 젖음", "냄새와 색 변화"] },
      { id: 723, type: "위험신호", emoji: "⏱️", title: "규칙적 배뭉침", subtitle: "반복 간격이 있으면 병원에 문의하세요", source: "서울아산병원 조산 정보", bullets: ["규칙적 간격", "점점 강해짐", "출혈 동반"] },
    ];
  }
  if (week <= 36) {
    return [
      { id: 731, type: "위험신호", emoji: "⚠️", title: "임신고혈압 의심", subtitle: "두통과 시야 이상은 중요 신호입니다", source: "질병관리청 임신고혈압", bullets: ["심한 두통", "시야 흐림", "오른쪽 윗배 통증"] },
      { id: 732, type: "위험신호", emoji: "⏱️", title: "조산 의심", subtitle: "37주 전 규칙적 통증은 확인이 필요합니다", source: "서울아산병원 조산 정보", bullets: ["규칙적 진통", "골반 압박감", "질출혈·분비물 증가"] },
      { id: 733, type: "위험신호", emoji: "🏥", title: "호흡곤란·흉통", subtitle: "응급 확인이 필요한 증상입니다", source: "산모 안전 일반 원칙", bullets: ["숨쉬기 어려움", "가슴 통증", "실신 느낌"] },
    ];
  }
  return [
    { id: 741, type: "위험신호", emoji: "👶", title: "태동 감소", subtitle: "막달에도 태동 감소는 바로 확인하세요", source: "ACOG 태아 발달", bullets: ["평소보다 확 줄어듦", "휴식 후에도 감소", "불안하면 병원 연락"] },
    { id: 742, type: "위험신호", emoji: "🌊", title: "양수·출혈", subtitle: "분만 또는 응급 신호일 수 있습니다", source: "서울아산병원 산전관리", bullets: ["물이 흐름", "선홍색 출혈", "복통 동반"] },
    { id: 743, type: "위험신호", emoji: "🚨", title: "응급 증상", subtitle: "앱보다 119 또는 응급실이 먼저입니다", source: "산모 안전 일반 원칙", bullets: ["호흡곤란", "흉통", "실신"] },
  ];
};

function ContentCard({ item }: { item: ContentItem }) {
  const [expanded, setExpanded] = useState(false);
  const color = item.type === "위험신호" ? "#C94E70" : item.type === "체크리스트" ? "#2D7A9A" : "#FFAB76";

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <button onClick={() => setExpanded((value) => !value)} className="w-full p-4 text-left">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: `${color}18` }}>
            {item.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ background: color }}>
                {item.type}
              </span>
              <span className="text-xs text-muted-foreground">{item.source}</span>
            </div>
            <p className="font-semibold text-sm text-foreground leading-snug">{item.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{item.subtitle}</p>
          </div>
          <ChevronRight size={16} className="text-muted-foreground mt-1 transition-transform shrink-0" style={{ transform: expanded ? "rotate(90deg)" : "rotate(0)" }} />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border">
          <div className="space-y-2 mt-3">
            {item.bullets.map((bullet) => (
              <div key={bullet} className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle size={14} style={{ color }} />
                <span>{bullet}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AIContentView({ week, contentGroups }: { week: number; contentGroups?: ApiContentGroups | null }) {
  const [tab, setTab] = useState<"weekly" | "checklist" | "warning">("weekly");
  const weeklyContents = getWeeklyContents(week);
  const contents = contentGroups
    ? contentGroups[tab]
    : tab === "weekly"
      ? weeklyContents
      : tab === "checklist"
        ? getChecklistContents(week)
        : getWarningContents(week);

  return (
    <>
      <div className="rounded-xl p-3 flex items-center gap-2 text-sm" style={{ background: "rgba(255,171,118,0.06)", border: "1px solid rgba(255,171,118,0.15)" }}>
        <FileText size={16} style={{ color: "#FFAB76" }} />
        <p className="text-muted-foreground">
          <span className="font-semibold" style={{ color: "#FFAB76" }}>{week}주차</span>에 맞춰 볼 콘텐츠를 정리했어요
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {([
          ["weekly", "이번 주", FileText],
          ["checklist", "체크", ClipboardCheck],
          ["warning", "위험", AlertTriangle],
        ] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="px-3 py-2 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5"
            style={{
              background: tab === id ? "#FFAB76" : "var(--secondary)",
              color: tab === id ? "white" : "var(--muted-foreground)",
            }}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {contents.map((item) => (
          <ContentCard key={item.id} item={item} />
        ))}
      </div>
    </>
  );
}
