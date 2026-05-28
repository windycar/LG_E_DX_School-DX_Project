// 데모 사용자
export const DEMO_USERS = [
  {
    email: 'mom@demo.kr',
    password: '1234',
    name: '이수진',
    role: 'pregnant',
    pregnancyWeek: 28,
    nickname: '행복한예비맘',
    babyNickname: '콩이',
    inviteCode: 'MOMDAL28',
  },
  {
    email: 'dad@demo.kr',
    password: '1234',
    name: '이준혁',
    role: 'guardian',
    pregnancyWeek: 28,
    nickname: '든든한아빠',
    babyNickname: '콩이',
  },
];

// 주간 기분 점수
export const MOOD_HISTORY = [
  { day: '월', score: 3.2 },
  { day: '화', score: 2.8 },
  { day: '수', score: 3.8 },
  { day: '목', score: 2.5 },
  { day: '금', score: 4.1 },
  { day: '토', score: 3.6 },
  { day: '일', score: 4.2 },
];

// 커뮤니티 게시물
export const POSTS_INIT = [
  {
    id: 1,
    week: 28,
    avatar: '🤰',
    author: '행복한예비맘',
    content:
      '28주차 접어들면서 좌골신경통이 너무 심한데 다들 어떻게 관리하시나요? 저는 옆으로 누워서 쿠션 끼는 게 제일 편하더라고요.',
    likes: 24,
    comments: 8,
    time: '2시간 전',
  },
  {
    id: 2,
    week: 27,
    avatar: '💕',
    author: '뽀짝맘',
    content:
      '임신 중 배가 고픈게 진짜 배고픈건지 입덧인건지 너무 헷갈려요. 조금씩 자주 먹는 게 최고인 것 같아요 🍎',
    likes: 36,
    comments: 12,
    time: '4시간 전',
  },
  {
    id: 3,
    week: 29,
    avatar: '⭐',
    author: '달빛엄마',
    content:
      '요즘 태동이 너무 강해서 잠을 못 자겠어요 ㅠㅠ 근데 느낄 때마다 신기하고 행복해서 참게 되네요 🌟',
    likes: 58,
    comments: 21,
    time: '6시간 전',
  },
  {
    id: 4,
    week: 28,
    avatar: '🌸',
    author: '초보예비맘',
    content:
      '첫 임신이라 모르는 게 너무 많아요. 이 앱 덕분에 많이 도움받고 있어요! 다들 건강한 임신하세요 💪',
    likes: 42,
    comments: 15,
    time: '8시간 전',
  },
];

// 신뢰 정보
export const INFO_ITEMS = [
  {
    id: 1,
    category: '영양',
    emoji: '🥦',
    title: '임신 중 엽산 섭취의 중요성',
    summary:
      '엽산은 태아의 신경관 발달에 필수적입니다. 임신 초기부터 하루 400~600mcg 섭취가 권장됩니다.',
    source: '대한산부인과학회',
    badge: '의학 검증',
  },
  {
    id: 2,
    category: '운동',
    emoji: '🏊',
    title: '임산부 안전 운동 가이드',
    summary:
      '수영, 가벼운 걷기, 산전 요가는 임신 중 안전한 운동입니다. 주 3회, 30분 이내 권장.',
    source: '보건복지부',
    badge: '정부 공인',
  },
  {
    id: 3,
    category: '정신건강',
    emoji: '💙',
    title: '산전 우울증 이해하기',
    summary:
      '임산부 10~20%가 경험하는 산전 우울증. 전문가 상담이 중요하며 방치 시 산후 우울증으로 이어질 수 있습니다.',
    source: 'WHO 가이드라인',
    badge: 'WHO 인증',
  },
  {
    id: 4,
    category: '태아발달',
    emoji: '👶',
    title: '28주차 태아 발달 정보',
    summary:
      '임신 28주차에는 태아의 뇌가 빠르게 발달하며, 눈을 뜨고 감을 수 있게 됩니다. 체중은 약 1kg.',
    source: '대한산부인과학회',
    badge: '의학 검증',
  },
  {
    id: 5,
    category: '수면',
    emoji: '😴',
    title: '임산부 수면 가이드',
    summary:
      '좌측 수면 자세가 혈액순환에 가장 좋습니다. 무릎 사이에 베개를 끼우면 더욱 편안합니다.',
    source: '보건복지부',
    badge: '정부 공인',
  },
];

// 보호자 다이어리 초기값
export const GUARDIAN_ENTRIES_INIT = [
  {
    id: 1,
    date: '2026년 5월 21일',
    content:
      '오늘 수진이가 많이 힘들어 보였다. 발이 많이 붓고 허리가 아프다고 했는데 내가 도와줄 수 있는 게 별로 없어서 미안했다. 그래도 아이의 태동을 처음으로 함께 느꼈을 때 정말 감격스러웠다.',
    mood: '💙',
  },
  {
    id: 2,
    date: '2026년 5월 19일',
    content:
      '수진이를 위해 저염 식사를 준비했다. 오늘은 기분이 좋아 보여서 나도 행복했다. 28주차가 되니 배가 정말 많이 나왔다. 우리 아기가 얼마나 클지 기대된다.',
    mood: '😊',
  },
];