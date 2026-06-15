import { aiChatUrl } from "./api";
import { useState } from "react";
import { ArrowLeft, ChevronRight, ExternalLink, Gift, MessageCircle, Send, Shield } from "lucide-react";
import { Screen } from "./types";
import { BottomNav } from "./App";

type InfoCategory = "영양" | "운동" | "정신건강" | "태아발달" | "수면";

type TrustedInfoItem = {
  id: number;
  category: InfoCategory;
  emoji: string;
  title: string;
  summary: string;
  source: string;
  badge: "정부 공인" | "의학 검증";
  url: string;
};

type ChatSource = { title: string; organization: string; url: string };
type ChatCareLevel = "information" | "clarify" | "contact_now" | "emergency";
type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  sources?: ChatSource[];
  careLevel?: ChatCareLevel;
  responseMode?: string;
};

const INFO_ITEMS: TrustedInfoItem[] = [
  {
    id: 1,
    category: "영양",
    emoji: "🥦",
    title: "임신 중 식사는 두 배가 아니라 더 건강하게",
    summary: "ACOG는 임신 중 '두 사람 몫을 먹는 것'이 아니라 더 건강하게 먹는 것이 중요하다고 설명합니다. 다섯 가지 식품군을 다양하게 먹고, 포화지방과 당이 많은 음식은 줄이는 방향이 좋습니다.",
    source: "ACOG",
    badge: "의학 검증",
    url: "https://www.acog.org/womens-health/faqs/healthy-eating-during-pregnancy",
  },
  {
    id: 2,
    category: "영양",
    emoji: "🧬",
    title: "엽산은 태아 신경관 발달에 중요",
    summary: "질병관리청 국가건강정보포털은 임신 초기 엽산 부족이 태아 신경관 형성 문제와 관련될 수 있다고 안내합니다. 임신 준비기부터 식사와 보충제 여부를 의료진과 확인하는 것이 좋습니다.",
    source: "질병관리청 국가건강정보포털",
    badge: "정부 공인",
    url: "https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5214",
  },
  {
    id: 3,
    category: "영양",
    emoji: "🐟",
    title: "생선은 종류를 골라 안전하게",
    summary: "ACOG는 임신 중 오메가-3 지방산 등 영양소 섭취를 위해 생선이 도움이 될 수 있지만, 수은 함량이 높은 생선과 날생선은 피해야 한다고 안내합니다.",
    source: "ACOG",
    badge: "의학 검증",
    url: "https://www.acog.org/womens-health/faqs/healthy-eating-during-pregnancy",
  },
  {
    id: 4,
    category: "운동",
    emoji: "🚶",
    title: "정상 임신이면 규칙적 운동 가능",
    summary: "ACOG는 건강하고 정상적인 임신이라면 운동을 시작하거나 지속할 수 있다고 안내합니다. 초진 때 산부인과와 가능한 활동 범위를 확인하는 것이 안전합니다.",
    source: "ACOG",
    badge: "의학 검증",
    url: "https://www.acog.org/womens-health/faqs/exercise-during-pregnancy",
  },
  {
    id: 5,
    category: "운동",
    emoji: "🏊",
    title: "목표는 주 150분 중강도 유산소",
    summary: "ACOG는 임신 중 주 150분 정도의 중강도 유산소 활동을 권장합니다. 30분씩 5일로 나누거나, 하루 중 10분 단위로 쪼개서 실천할 수 있습니다.",
    source: "ACOG",
    badge: "의학 검증",
    url: "https://www.acog.org/womens-health/faqs/exercise-during-pregnancy",
  },
  {
    id: 6,
    category: "운동",
    emoji: "⚠️",
    title: "운동 중단 신호는 바로 멈추기",
    summary: "운동 중 질출혈, 어지러움, 흉통, 운동 전 숨참, 두통, 근력 저하, 종아리 통증이나 부종, 규칙적인 자궁수축, 양수 누출이 있으면 운동을 중단하고 산부인과에 연락해야 합니다.",
    source: "ACOG",
    badge: "의학 검증",
    url: "https://www.acog.org/womens-health/faqs/exercise-during-pregnancy",
  },
  {
    id: 7,
    category: "정신건강",
    emoji: "💙",
    title: "임신 중 우울은 흔하지만 방치하면 안 됨",
    summary: "ACOG는 임신 중 우울이 약 10명 중 1명에게 나타날 수 있다고 설명합니다. 슬픔이 짧게 지나가는 수준이 아니라 일상 기능에 영향을 주면 평가와 도움이 필요합니다.",
    source: "ACOG",
    badge: "의학 검증",
    url: "https://www.acog.org/womens-health/faqs/depression-during-pregnancy",
  },
  {
    id: 8,
    category: "정신건강",
    emoji: "🌧️",
    title: "출산 전후 우울감은 도움 요청이 중요",
    summary: "보건복지부 국립정신건강센터는 출산 후 우울감이 심하거나 오래 지속되어 일상생활에 지장이 있으면 전문적인 도움을 받아야 한다고 안내합니다.",
    source: "보건복지부 국립정신건강센터",
    badge: "정부 공인",
    url: "https://www.mentalhealth.go.kr/portal/disease/diseaseDetail.do?dissId=66",
  },
  {
    id: 9,
    category: "정신건강",
    emoji: "🆘",
    title: "자해·타해 생각은 즉시 도움 요청",
    summary: "자신이나 아이를 해칠 생각이 반복되거나 강하게 들면 혼자 견디면 안 됩니다. 즉시 가족, 의료기관, 응급실, 정신건강 위기상담 도움을 받아야 합니다.",
    source: "보건복지부 국립정신건강센터",
    badge: "정부 공인",
    url: "https://www.mentalhealth.go.kr/portal/disease/diseaseDetail.do?dissId=66",
  },
  {
    id: 10,
    category: "태아발달",
    emoji: "👶",
    title: "13~16주에는 움직임이 시작됨",
    summary: "ACOG는 13~16주 무렵 태아의 움직임이 시작되고, 근육과 뼈가 계속 발달한다고 안내합니다. 다만 산모가 움직임을 느끼는 시점은 개인차가 큽니다.",
    source: "ACOG",
    badge: "의학 검증",
    url: "https://www.acog.org/womens-health/faqs/how-your-fetus-grows-during-pregnancy",
  },
  {
    id: 11,
    category: "태아발달",
    emoji: "👀",
    title: "25~28주에는 눈꺼풀 반응과 소리 반응",
    summary: "ACOG는 25~28주에 태아의 눈꺼풀이 열리고 닫히며, 큰 소리에 반응할 수 있다고 설명합니다. 폐는 계속 성숙 중입니다.",
    source: "ACOG",
    badge: "의학 검증",
    url: "https://www.acog.org/womens-health/faqs/how-your-fetus-grows-during-pregnancy",
  },
  {
    id: 12,
    category: "태아발달",
    emoji: "🤲",
    title: "29~32주에는 차기·움켜쥐기 가능",
    summary: "ACOG는 29~32주에 태아가 뻗기, 차기, 움켜쥐기 동작을 할 수 있고 눈이 빛 변화를 감지할 수 있다고 안내합니다.",
    source: "ACOG",
    badge: "의학 검증",
    url: "https://www.acog.org/womens-health/faqs/how-your-fetus-grows-during-pregnancy",
  },
  {
    id: 13,
    category: "수면",
    emoji: "😴",
    title: "중기 이후에는 옆으로 자기",
    summary: "ACOG는 임신 중기와 후기에는 바로 누운 자세가 큰 혈관을 눌러 어지러움이나 태아 혈류 감소를 유발할 수 있어 옆으로 자는 자세가 더 좋다고 안내합니다.",
    source: "ACOG",
    badge: "의학 검증",
    url: "https://www.acog.org/womens-health/experts-and-stories/ask-acog/can-i-sleep-on-my-back-when-im-pregnant",
  },
  {
    id: 14,
    category: "수면",
    emoji: "🛏️",
    title: "베개로 무릎과 배를 받치기",
    summary: "ACOG는 옆으로 누울 때 한쪽 또는 양쪽 무릎을 굽히고, 무릎 사이와 배 아래에 베개를 받치면 자세 유지에 도움이 될 수 있다고 안내합니다.",
    source: "ACOG",
    badge: "의학 검증",
    url: "https://www.acog.org/womens-health/experts-and-stories/ask-acog/can-i-sleep-on-my-back-when-im-pregnant",
  },
  {
    id: 15,
    category: "수면",
    emoji: "🧘",
    title: "운동은 수면과 피로 관리에도 도움",
    summary: "ACOG는 규칙적인 운동이 임신 중 전반적인 체력과 심혈관 건강을 개선하고 허리통증과 변비를 줄이는 데 도움이 될 수 있다고 안내합니다. 단, 수면 전 과격한 운동은 피하고 본인 컨디션에 맞춰야 합니다.",
    source: "ACOG",
    badge: "의학 검증",
    url: "https://www.acog.org/womens-health/faqs/exercise-during-pregnancy",
  },
  {
    id: 16,
    category: "영양",
    emoji: "🍚",
    title: "임신 중기부터 에너지 필요량이 늘어남",
    summary: "질병관리청 국가건강정보포털은 임신 중기에는 하루 약 340 kcal, 후기에는 약 450 kcal의 추가 에너지가 필요하다고 안내합니다. 임신 초기에는 일반적으로 추가 에너지가 필요하지 않지만, 임신 전 영양상태가 좋지 않았다면 의료진 상담이 필요합니다.",
    source: "질병관리청 국가건강정보포털",
    badge: "정부 공인",
    url: "https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5214",
  },
  {
    id: 17,
    category: "영양",
    emoji: "🥩",
    title: "단백질은 태아·태반·혈액량 증가에 필요",
    summary: "질병관리청은 태아의 급속 성장, 태반과 모체 조직 성장, 혈액량 증가를 위해 임신 중기와 후기에 단백질 섭취가 더 필요하다고 설명합니다. 고기, 생선, 달걀, 우유·유제품처럼 필수 아미노산이 충분한 식품을 균형 있게 포함하는 것이 좋습니다.",
    source: "질병관리청 국가건강정보포털",
    badge: "정부 공인",
    url: "https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5214",
  },
  {
    id: 18,
    category: "영양",
    emoji: "💧",
    title: "수분은 하루 충분량을 꾸준히 채우기",
    summary: "질병관리청은 임신기에는 충분한 체액량 유지를 위해 수분 섭취가 중요하며, 임산부의 수분 충분 섭취량을 하루 약 2,300 mL로 안내합니다. 카페인, 감미료, 알코올이 많은 음료는 피하는 편이 안전합니다.",
    source: "질병관리청 국가건강정보포털",
    badge: "정부 공인",
    url: "https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5214",
  },
  {
    id: 19,
    category: "영양",
    emoji: "☕",
    title: "카페인은 총량을 확인해서 제한",
    summary: "질병관리청은 임신 중 카페인이 철분·칼슘 흡수를 방해하거나 이뇨 작용으로 수분 손실을 일으킬 수 있어 하루 섭취 권고량 이하로 관리하라고 안내합니다. 커피뿐 아니라 콜라, 녹차, 홍차의 카페인도 함께 계산해야 합니다.",
    source: "질병관리청 국가건강정보포털",
    badge: "정부 공인",
    url: "https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5214",
  },
  {
    id: 20,
    category: "영양",
    emoji: "🩸",
    title: "임산부 빈혈은 철결핍이 흔한 원인",
    summary: "서울대학교병원 의학정보는 임신 중 혈액량이 크게 늘면서 철결핍성 빈혈이 흔히 발생한다고 설명합니다. 피로, 어지러움, 숨참이 지속되거나 검사에서 빈혈이 확인되면 산부인과 지시에 따라 철분 섭취와 치료를 조정해야 합니다.",
    source: "서울대학교병원 의학정보",
    badge: "의학 검증",
    url: "https://www.snuh.org/health/nMedInfo/nView.do?category=DIS&medid=AA000473",
  },
  {
    id: 21,
    category: "운동",
    emoji: "🧃",
    title: "운동 전후 수분 보충은 필수",
    summary: "질병관리청은 임신 중 운동 시 탈수를 예방하기 위해 운동 전, 중, 후 충분히 물을 마시는 것이 중요하다고 안내합니다. 더운 날씨, 습한 날씨, 발열이 있을 때는 운동을 자제하는 편이 안전합니다.",
    source: "질병관리청 국가건강정보포털",
    badge: "정부 공인",
    url: "https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6691",
  },
  {
    id: 22,
    category: "운동",
    emoji: "🚫",
    title: "낙상 위험 운동은 분만 전까지 피하기",
    summary: "질병관리청은 테니스, 배구, 농구, 스키, 자전거 타기처럼 격렬하거나 낙상 위험이 있는 운동은 임신 중 피해야 한다고 안내합니다. 운동 경험이 있어도 임신 중에는 강도를 낮추고 안전한 활동으로 바꾸는 것이 좋습니다.",
    source: "질병관리청 국가건강정보포털",
    badge: "정부 공인",
    url: "https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6691",
  },
  {
    id: 23,
    category: "운동",
    emoji: "🩺",
    title: "운동하면 안 되는 임신 상태가 있음",
    summary: "질병관리청은 임신고혈압, 조기양막파열, 조기진통, 자궁경관무력증, 자궁출혈, 자궁내 성장지연, 조산 과거력 등이 있으면 임신 중 운동을 피해야 한다고 안내합니다. 해당 병력이 있으면 반드시 산부인과 허가를 먼저 받아야 합니다.",
    source: "질병관리청 국가건강정보포털",
    badge: "정부 공인",
    url: "https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6691",
  },
  {
    id: 24,
    category: "운동",
    emoji: "🫁",
    title: "중강도 운동은 숨이 약간 찬 정도",
    summary: "질병관리청은 중강도 신체활동을 심장 박동이 조금 빨라지거나 호흡이 약간 가쁜 상태로 설명합니다. 임신 중 운동은 대화가 어려울 정도로 과격하게 하기보다, 본인이 버틸 수 있는 강도로 짧게 나누는 것이 현실적입니다.",
    source: "질병관리청 국가건강정보포털",
    badge: "정부 공인",
    url: "https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6251",
  },
  {
    id: 25,
    category: "정신건강",
    emoji: "📉",
    title: "우울감이 일상 기능을 무너뜨리면 평가 필요",
    summary: "보건복지부 국립정신건강센터는 우울감이 오래 지속되고 수면, 식사, 육아, 대인관계 같은 일상 기능에 지장을 주면 전문적인 평가와 치료가 필요하다고 안내합니다. 임신·출산 전후의 기분 변화는 숨기기보다 의료진에게 말하는 것이 안전합니다.",
    source: "보건복지부 국립정신건강센터",
    badge: "정부 공인",
    url: "https://www.mentalhealth.go.kr/portal/disease/diseaseDetail.do?dissId=66",
  },
  {
    id: 26,
    category: "정신건강",
    emoji: "🗣️",
    title: "가족에게 증상을 설명하는 것도 치료의 시작",
    summary: "국립정신건강센터 자료는 산후우울증에서 주변의 이해와 지지가 중요하다고 안내합니다. 이유 없는 눈물, 죄책감, 불안, 무기력, 수면 문제를 가족에게 구체적으로 공유하면 진료 연결과 생활 지원을 더 빨리 받을 수 있습니다.",
    source: "보건복지부 국립정신건강센터",
    badge: "정부 공인",
    url: "https://www.mentalhealth.go.kr/portal/disease/diseaseDetail.do?dissId=66",
  },
  {
    id: 27,
    category: "정신건강",
    emoji: "🏥",
    title: "치료가 필요한 상태는 의지 문제가 아님",
    summary: "임신·출산 전후 우울과 불안은 개인 의지만으로 해결해야 하는 문제가 아닙니다. 증상이 지속되면 산부인과, 정신건강의학과, 정신건강복지센터를 통해 상담과 치료를 연결하는 것이 안전합니다.",
    source: "보건복지부 국립정신건강센터",
    badge: "정부 공인",
    url: "https://www.mentalhealth.go.kr/portal/disease/diseaseDetail.do?dissId=66",
  },
  {
    id: 28,
    category: "태아발달",
    emoji: "📏",
    title: "16주 무렵 손가락·발가락 구분이 가능",
    summary: "서울대학교병원 의학정보는 임신 16주 무렵 태아의 크기가 약 12 cm, 몸무게가 약 110 g 정도가 되며 손가락과 발가락이 구별 가능해지고 스스로 움직임이 생긴다고 설명합니다.",
    source: "서울대학교병원 의학정보",
    badge: "의학 검증",
    url: "https://www.snuh.org/health/nMedInfo/nView.do?medid=AD000016",
  },
  {
    id: 29,
    category: "태아발달",
    emoji: "🧪",
    title: "산전검사는 발달 상태를 확인하는 핵심 과정",
    summary: "서울아산병원은 산전검사에 기본혈액검사, 태아 목덜미투명대 검사, 기형아검사, 양수검사, 정밀초음파, 임신성 당뇨검사 등이 포함된다고 안내합니다. 검사는 태아 발달과 산모 건강 위험을 조기에 확인하는 목적입니다.",
    source: "서울아산병원 의료정보",
    badge: "의학 검증",
    url: "https://www.amc.seoul.kr/asan/healthinfo/management/managementDetail.do?managementId=58",
  },
  {
    id: 30,
    category: "태아발달",
    emoji: "💓",
    title: "비수축검사는 태아 건강을 간접 평가",
    summary: "서울아산병원은 비수축검사가 태아가 움직일 때 심박동이 증가하는 반응을 이용해 태아 건강 상태를 간접적으로 평가하는 검사라고 설명합니다. 당뇨, 고혈압, 태아발육지연 등 고위험임신에서는 더 이른 시기부터 시행될 수 있습니다.",
    source: "서울아산병원 의료정보",
    badge: "의학 검증",
    url: "https://www.amc.seoul.kr/asan/healthinfo/management/managementDetail.do?managementId=222",
  },
  {
    id: 31,
    category: "태아발달",
    emoji: "🌊",
    title: "양수는 폐·근골격·위장관 발달에 중요",
    summary: "서울아산병원은 양수가 태아의 폐, 근골격계, 위장관계의 정상 발달에 중요한 역할을 한다고 설명합니다. 양수량 이상은 태아 또는 태반 기능 문제와 관련될 수 있어 초음파 검사에서 확인이 필요합니다.",
    source: "서울아산병원 의료정보",
    badge: "의학 검증",
    url: "https://www.amc.seoul.kr/asan/mobile/healthinfo/disease/diseaseDetail.do?contentId=31949&diseaseKindId=C000012",
  },
  {
    id: 32,
    category: "수면",
    emoji: "☕",
    title: "카페인 관리는 밤잠 관리와도 연결",
    summary: "질병관리청은 임신 중 카페인 섭취량을 확인해 권고량 이하로 관리하라고 안내합니다. 카페인은 커피 외에도 녹차, 홍차, 콜라에 들어 있으므로 오후 늦게 섭취하면 수면 방해까지 함께 생길 수 있습니다.",
    source: "질병관리청 국가건강정보포털",
    badge: "정부 공인",
    url: "https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5214",
  },
  {
    id: 33,
    category: "수면",
    emoji: "🚰",
    title: "수분은 낮부터 나누어 마시기",
    summary: "질병관리청은 임산부의 충분한 수분 섭취를 권장합니다. 다만 밤에 한꺼번에 많이 마시면 잦은 배뇨로 수면이 끊길 수 있으므로, 낮 시간부터 조금씩 나누어 마시는 방식이 실천하기 쉽습니다.",
    source: "질병관리청 국가건강정보포털",
    badge: "정부 공인",
    url: "https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5214",
  },
  {
    id: 34,
    category: "수면",
    emoji: "🛌",
    title: "조산 위험 증상은 쉬는 것만으로 넘기지 않기",
    summary: "서울아산병원은 임신 37주 이전에 하복부·골반 압박감, 생리통 같은 통증, 질 출혈, 무색 분비물 증가 등이 있으면 병원에서 검사와 치료를 받아야 한다고 안내합니다. 밤에 이런 증상으로 잠을 못 자는 경우에도 단순 불편감으로 넘기지 않는 것이 안전합니다.",
    source: "서울아산병원 의료정보",
    badge: "의학 검증",
    url: "https://www.amc.seoul.kr/asan/healthinfo/disease/diseaseDetail.do?contentId=31842&tabIndex=0",
  },
  {
    id: 35,
    category: "수면",
    emoji: "🧘‍♀️",
    title: "가벼운 신체활동은 피로 리듬 조절에 도움",
    summary: "질병관리청은 신체활동이 심폐 건강과 전반적인 건강 관리에 도움이 된다고 안내합니다. 임신 중에는 의료진이 허용한 범위에서 낮 시간의 가벼운 걷기나 스트레칭을 유지하면 피로와 수면 리듬 관리에 도움이 될 수 있습니다.",
    source: "질병관리청 국가건강정보포털",
    badge: "정부 공인",
    url: "https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6251",
  },
];

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

export default function InfoView({ onBack, onNavigate }: { onBack: () => void; onNavigate?: (s: Screen) => void }) {
  const [cat, setCat] = useState<"전체" | InfoCategory>("전체");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "안녕하세요! 임신 관련 의학 정보를 도와드리겠습니다. 궁금하신 점을 물어보세요." },
  ]);
  const [input, setInput] = useState("");

  const categories: Array<"전체" | InfoCategory> = ["전체", "영양", "운동", "정신건강", "태아발달", "수면"];
  const filtered = cat === "전체" ? INFO_ITEMS : INFO_ITEMS.filter((item) => item.category === cat);

  const badgeColors: Record<TrustedInfoItem["badge"], string> = {
    "정부 공인": "#2D6B45",
    "의학 검증": "#2D7A9A",
  };
  const careLabels: Partial<Record<ChatCareLevel, { text: string; background: string; color: string }>> = {
    clarify: { text: "증상을 조금 더 알려주세요", background: "#F5F1E9", color: "#6B5D2D" },
    contact_now: { text: "지금 의료진 확인이 필요해요", background: "#FFF0E6", color: "#9A4D20" },
    emergency: { text: "즉시 도움을 요청하세요", background: "#FDECEC", color: "#A12828" },
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");

    try {
      const response = await fetch(aiChatUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: messages.map(({ role, text, responseMode }) => ({ role, text, responseMode })),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "상담 서버에서 응답을 받지 못했습니다.");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.answer,
          sources: data.sources,
          careLevel: data.careLevel,
          responseMode: data.responseMode,
        },
      ]);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "상담 서버 연결에 실패했습니다.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `현재 AI 상담을 연결할 수 없습니다. ${detail}`,
        },
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader title="신뢰할 수 있는 정보" onBack={onBack} />

      <div className="px-5 py-5 space-y-5 flex-1 overflow-y-auto pb-20">
        <div
          className="rounded-2xl p-4 flex items-start gap-3"
          style={{ background: "rgba(45,122,154,0.08)", border: "1px solid rgba(45,122,154,0.2)" }}
        >
          <Shield size={18} className="shrink-0 mt-0.5" style={{ color: "#2D7A9A" }} />
          <p className="text-sm text-foreground leading-relaxed">
            <span className="font-semibold">검증된 출처만 표시합니다.</span> 정부·공공기관과 산부인과 전문기관 자료를 쉬운 말로 요약했습니다.
          </p>
        </div>

        <button
          onClick={() => onNavigate?.("medical-chat")}
          className="w-full py-4 rounded-2xl font-semibold text-white shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #2D7A9A, #4A9AB8)" }}
        >
          <MessageCircle size={18} />
          의학 정보 AI 챗봇 상담
        </button>

        <button
          onClick={() => onNavigate?.("benefits")}
          className="w-full py-4 rounded-2xl font-semibold text-white shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #69C99A, #2D7A9A)" }}
        >
          <Gift size={18} />
          현재 받을 수 있는 혜택보기
        </button>

        <div className="grid grid-cols-3 gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                setCat(category);
                setExpanded(null);
              }}
              className="px-3 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                background: cat === category ? "#C94E70" : "var(--secondary)",
                color: cat === category ? "white" : "var(--muted-foreground)",
              }}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((item) => (
            <div key={item.id} className="bg-card rounded-2xl border border-border overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                        style={{ background: badgeColors[item.badge] }}
                      >
                        {item.badge}
                      </span>
                      <span className="text-xs text-muted-foreground">{item.source}</span>
                    </div>
                    <p className="font-semibold text-sm text-foreground leading-snug">{item.title}</p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-muted-foreground mt-1 transition-transform duration-200 shrink-0"
                    style={{ transform: expanded === item.id ? "rotate(90deg)" : "rotate(0)" }}
                  />
                </div>
              </button>

              {expanded === item.id && (
                <div className="px-4 pb-4 border-t border-border">
                  <p className="text-sm text-foreground leading-relaxed mt-3">{item.summary}</p>
                  <button
                    onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium"
                    style={{ color: "#C94E70" }}
                  >
                    원문 출처 보기 <ExternalLink size={12} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showChatbot && (
        <div className="absolute inset-0 bg-background z-50 flex flex-col">
          <div className="flex items-center gap-3 px-5 py-4 bg-card/90 backdrop-blur-sm border-b border-border">
            <button onClick={() => setShowChatbot(false)} className="p-2 rounded-xl hover:bg-secondary transition-colors">
              <ArrowLeft size={20} className="text-foreground" />
            </button>
            <h1 className="font-semibold text-foreground">의학 정보 AI 상담</h1>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[80%] px-4 py-3 rounded-2xl"
                  style={{
                    background: msg.role === "user" ? "#C94E70" : "var(--card)",
                    color: msg.role === "user" ? "white" : "var(--foreground)",
                    border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
                  }}
                >
                  {msg.role === "assistant" && msg.careLevel && careLabels[msg.careLevel] && (
                    <span
                      className="inline-block text-xs font-semibold rounded-full px-2.5 py-1 mb-2"
                      style={{
                        background: careLabels[msg.careLevel]!.background,
                        color: careLabels[msg.careLevel]!.color,
                      }}
                    >
                      {careLabels[msg.careLevel]!.text}
                    </span>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
                  {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border space-y-1">
                      {msg.sources.map((source) => (
                        <a
                          key={source.url}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-xs font-medium underline break-words"
                          style={{ color: "#2D7A9A" }}
                        >
                          출처 보기: {source.organization} - {source.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-4 bg-card/90 backdrop-blur-sm border-t border-border">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="궁금한 점을 물어보세요..."
                className="flex-1 px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim()}
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white disabled:opacity-50"
                style={{ background: "#C94E70" }}
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              이 정보는 의사 상담을 대체하지 않습니다. 심각한 증상은 즉시 병원을 방문하세요.
            </p>
          </div>
        </div>
      )}

      {onNavigate && <BottomNav current="dashboard" onNavigate={onNavigate} />}
    </div>
  );
}
