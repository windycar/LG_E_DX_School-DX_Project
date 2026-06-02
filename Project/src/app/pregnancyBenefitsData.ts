export type BenefitStage = "임신중" | "출산후" | "조건부";

export type PregnancyBenefit = {
  id: string;
  stage: BenefitStage;
  title: string;
  amount: string;
  summary: string;
  target: string;
  apply: string;
  source: string;
  url: string;
  emoji: string;
  priorityWeeks?: [number, number];
};

export const PREGNANCY_BENEFITS: PregnancyBenefit[] = [
  {
    id: "pregnancy-medical-voucher",
    stage: "임신중",
    title: "임신·출산 진료비 지원",
    amount: "단태아 100만원, 다태아 140만원",
    summary: "국민행복카드 바우처로 임신·출산 관련 진료비 본인부담금 결제에 사용할 수 있는 지원입니다.",
    target: "임신·출산이 확인된 건강보험 가입자 또는 피부양자",
    apply: "산부인과 임신확인 후 국민건강보험공단, 카드사, 정부24 등에서 신청",
    source: "보건복지부 임신·출산 진료비 안내",
    url: "https://www.mohw.go.kr/menu.es?mid=a10705020100",
    emoji: "🏥",
    priorityWeeks: [1, 40],
  },
  {
    id: "mom-pregnancy-onestop",
    stage: "임신중",
    title: "맘편한 임신 원스톱 서비스",
    amount: "통합 신청",
    summary: "엽산제, 철분제, 표준모자보건수첩, 임산부 교통 할인 등 임신 지원 서비스를 한 번에 확인하고 신청하는 창구입니다.",
    target: "임신 확인을 받은 임산부",
    apply: "정부24 원스톱서비스 또는 보건소·주민센터 방문",
    source: "정부24 맘편한 임신 원스톱 서비스",
    url: "https://www.gov.kr/portal/onestopSvc/fertility",
    emoji: "📋",
    priorityWeeks: [1, 40],
  },
  {
    id: "ktx-srt-pregnancy",
    stage: "임신중",
    title: "KTX·SRT 임산부 철도 할인",
    amount: "KTX 특실 업그레이드, SRT 임산부 할인",
    summary: "정부24 맘편한 임신 통합 신청을 통해 임산부 철도 할인 서비스를 신청할 수 있습니다. 적용 좌석과 할인율은 운영사 정책을 확인해야 합니다.",
    target: "철도 회원 중 임산부 및 동반 보호자 기준은 서비스별 확인",
    apply: "정부24 맘편한 임신에서 신청 후 코레일·SRT 예매 시 적용",
    source: "정부24 임신 지원 통합 신청",
    url: "https://www.gov.kr/portal/onestopSvc/fertility",
    emoji: "🚄",
    priorityWeeks: [1, 40],
  },
  {
    id: "teen-mom-medical",
    stage: "조건부",
    title: "청소년산모 임신·출산 의료비",
    amount: "임신 1회당 120만원",
    summary: "만 19세 이하 청소년 산모에게 임신·출산 관련 의료비 일부를 지원합니다. 소득·재산 기준 없이 신청 가능합니다.",
    target: "임신확인서상 임신확인일 기준 만 19세 이하 산모",
    apply: "사회서비스 전자바우처 안내에 따라 신청",
    source: "사회서비스 전자바우처 청소년산모 의료비 안내",
    url: "https://m.socialservice.or.kr/info/static12b.do",
    emoji: "🧾",
  },
  {
    id: "postpartum-care",
    stage: "출산후",
    title: "산모·신생아 건강관리 지원",
    amount: "소득·출산순위·태아유형별 차등",
    summary: "출산가정에 건강관리사를 파견해 산모 회복과 신생아 양육을 지원하는 바우처 사업입니다.",
    target: "출산가정 중 소득·자격 기준 충족 가구, 지자체 예외지원 가능",
    apply: "복지로, 보건소, 사회서비스 전자바우처 안내에 따라 신청",
    source: "사회서비스 전자바우처 산모·신생아 건강관리 안내",
    url: "https://m.socialservice.or.kr/info/static05.do",
    emoji: "🤱",
    priorityWeeks: [32, 42],
  },
  {
    id: "first-meeting",
    stage: "출산후",
    title: "첫만남이용권",
    amount: "첫째 200만원, 둘째 이상 300만원",
    summary: "출생 초기 양육 부담을 줄이기 위한 국민행복카드 바우처입니다. 출생신고 후 행복출산 원스톱 서비스로 같이 확인할 수 있습니다.",
    target: "출생신고되어 주민등록번호를 부여받은 아동",
    apply: "정부24 행복출산 원스톱 서비스 또는 주민센터에서 신청",
    source: "정부24 행복출산 원스톱 서비스 안내",
    url: "https://www.gov.kr/portal/onestopSvc/happyBirth",
    emoji: "🎁",
    priorityWeeks: [33, 42],
  },
  {
    id: "parent-benefit",
    stage: "출산후",
    title: "부모급여",
    amount: "0세 월 100만원, 1세 월 50만원",
    summary: "출산 후 영아기 양육 부담을 줄이기 위한 현금성 급여입니다. 어린이집 이용 여부에 따라 보육료 바우처와 차액 지급 방식이 달라질 수 있습니다.",
    target: "0~1세 아동을 양육하는 가구",
    apply: "복지로, 정부24 행복출산 원스톱 서비스, 주민센터에서 신청",
    source: "보건복지부 부모급여 안내",
    url: "https://www.mohw.go.kr/board.es?act=view&bid=0027&list_no=1479791&mid=a10503000000",
    emoji: "👨‍👩‍👧",
    priorityWeeks: [33, 42],
  },
  {
    id: "child-allowance",
    stage: "출산후",
    title: "아동수당",
    amount: "월 10~13만원",
    summary: "아동 양육에 따른 경제적 부담을 낮추기 위해 지급되는 수당입니다. 출생 후 부모급여, 첫만남이용권과 함께 신청 흐름을 확인하면 좋습니다.",
    target: "만 9세 미만 아동",
    apply: "복지로 또는 주민센터에서 신청",
    source: "보건복지부 아동수당 안내",
    url: "https://www.mohw.go.kr/menu.es?mid=a10711030100",
    emoji: "🧸",
    priorityWeeks: [33, 42],
  },
];

export const getRecommendedBenefits = (week: number) => {
  const matched = PREGNANCY_BENEFITS.filter((benefit) => {
    if (!benefit.priorityWeeks) return false;
    const [start, end] = benefit.priorityWeeks;
    return week >= start && week <= end;
  });

  return matched.length > 0 ? matched : PREGNANCY_BENEFITS.filter((benefit) => benefit.stage === "임신중");
};

export const getDailyBenefit = (week: number, date = new Date()) => {
  const benefits = getRecommendedBenefits(week);
  const dayKey = Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / 86400000);
  return benefits[dayKey % benefits.length];
};
