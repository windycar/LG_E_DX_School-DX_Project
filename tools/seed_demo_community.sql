
USE campus_25KDT_LG_3;

SET NAMES utf8mb4;

START TRANSACTION;

/*
  MOMent 커뮤니티 시연 데이터

  - 시연 계정: 12명 (임산부 8명, 보호자 4명)
  - 게시글: 18개
  - 댓글: 42개
  - 좋아요: 게시글별 인기도에 따라 자동 분산
  - 모든 시연 계정 비밀번호: demo1234
  - 재실행 시 demo.community.*@moment.local 계정의 커뮤니티 데이터만 초기화
*/

-- -------------------------------------------------------------------
-- 1. 시연 계정 생성
-- -------------------------------------------------------------------

INSERT INTO USERS (
    email,
    password,
    name,
    nickname,
    role,
    baby_nickname,
    pregnancy_start_date,
    connection_code,
    parent_user_id
) VALUES
('demo.community.sora@moment.local',   'demo1234', '김소라', '소라맘',       'PREGNANT', '별이',   '2026-05-02', 'DM1001', NULL),
('demo.community.jiyun@moment.local',  'demo1234', '박지윤', '튼튼이엄마',   'PREGNANT', '튼튼이', '2026-03-14', 'DM1002', NULL),
('demo.community.minseo@moment.local', 'demo1234', '이민서', '초보예비맘',   'PREGNANT', '콩콩이', '2026-01-10', 'DM1003', NULL),
('demo.community.haeun@moment.local',  'demo1234', '최하은', '하은의기록',   'PREGNANT', '봄이',   '2025-12-01', 'DM1004', NULL),
('demo.community.yuna@moment.local',   'demo1234', '정유나', '쌍둥이맘유나', 'PREGNANT', '해와달', '2026-02-20', 'DM1005', NULL),
('demo.community.dabin@moment.local',  'demo1234', '한예은', '워킹맘예은',   'PREGNANT', '열무',   '2025-11-18', 'DM1006', NULL),
('demo.community.seoyeon@moment.local','demo1234', '오서연', '둘째맘서연',   'PREGNANT', '구름이', '2026-04-03', 'DM1007', NULL),
('demo.community.nari@moment.local',   'demo1234', '강나리', '나리의하루',   'PREGNANT', '토리',   '2025-10-15', 'DM1008', NULL),
('demo.community.junho@moment.local',  'demo1234', '김준호', '별이아빠',     'GUARDIAN', NULL,     NULL,         NULL,     NULL),
('demo.community.hyunwoo@moment.local','demo1234', '문현우', '튼튼이아빠',   'GUARDIAN', NULL,     NULL,         NULL,     NULL),
('demo.community.taemin@moment.local', 'demo1234', '신태민', '예비아빠태민', 'GUARDIAN', NULL,     NULL,         NULL,     NULL),
('demo.community.jisoo@moment.local',  'demo1234', '윤지수', '함께걷는지수', 'GUARDIAN', NULL,     NULL,         NULL,     NULL)
AS new_user
ON DUPLICATE KEY UPDATE
    password = new_user.password,
    name = new_user.name,
    nickname = new_user.nickname,
    role = new_user.role,
    baby_nickname = new_user.baby_nickname,
    pregnancy_start_date = new_user.pregnancy_start_date,
    connection_code = new_user.connection_code;

-- 시연 부부 4쌍 연결
UPDATE USERS AS pregnant
JOIN USERS AS guardian
  ON guardian.email = 'demo.community.junho@moment.local'
SET pregnant.parent_user_id = guardian.user_id,
    guardian.parent_user_id = pregnant.user_id
WHERE pregnant.email = 'demo.community.sora@moment.local';

UPDATE USERS AS pregnant
JOIN USERS AS guardian
  ON guardian.email = 'demo.community.hyunwoo@moment.local'
SET pregnant.parent_user_id = guardian.user_id,
    guardian.parent_user_id = pregnant.user_id
WHERE pregnant.email = 'demo.community.jiyun@moment.local';

UPDATE USERS AS pregnant
JOIN USERS AS guardian
  ON guardian.email = 'demo.community.taemin@moment.local'
SET pregnant.parent_user_id = guardian.user_id,
    guardian.parent_user_id = pregnant.user_id
WHERE pregnant.email = 'demo.community.minseo@moment.local';

UPDATE USERS AS pregnant
JOIN USERS AS guardian
  ON guardian.email = 'demo.community.jisoo@moment.local'
SET pregnant.parent_user_id = guardian.user_id,
    guardian.parent_user_id = pregnant.user_id
WHERE pregnant.email = 'demo.community.haeun@moment.local';

-- -------------------------------------------------------------------
-- 2. 재실행을 위한 기존 시연 커뮤니티 데이터 정리
-- -------------------------------------------------------------------

DELETE post_like
FROM COMMUNITY_POST_LIKES AS post_like
LEFT JOIN COMMUNITY_POSTS AS post
  ON post.post_id = post_like.post_id
LEFT JOIN USERS AS post_author
  ON post_author.user_id = post.user_id
LEFT JOIN USERS AS like_user
  ON like_user.user_id = post_like.user_id
WHERE post_author.email LIKE 'demo.community.%@moment.local'
   OR like_user.email LIKE 'demo.community.%@moment.local';

DELETE comment
FROM COMMUNITY_COMMENTS AS comment
LEFT JOIN COMMUNITY_POSTS AS post
  ON post.post_id = comment.post_id
LEFT JOIN USERS AS post_author
  ON post_author.user_id = post.user_id
LEFT JOIN USERS AS comment_author
  ON comment_author.user_id = comment.user_id
WHERE post_author.email LIKE 'demo.community.%@moment.local'
   OR comment_author.email LIKE 'demo.community.%@moment.local';

DELETE post
FROM COMMUNITY_POSTS AS post
JOIN USERS AS post_author
  ON post_author.user_id = post.user_id
WHERE post_author.email LIKE 'demo.community.%@moment.local';

-- -------------------------------------------------------------------
-- 3. 게시글 원본 데이터
-- -------------------------------------------------------------------

DROP TEMPORARY TABLE IF EXISTS TEMP_DEMO_COMMUNITY_POSTS;

CREATE TEMPORARY TABLE TEMP_DEMO_COMMUNITY_POSTS (
    post_key VARCHAR(30) PRIMARY KEY,
    post_order INT NOT NULL,
    author_email VARCHAR(100) NOT NULL,
    pregnancy_period VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    popularity INT NOT NULL
);

INSERT INTO TEMP_DEMO_COMMUNITY_POSTS (
    post_key,
    post_order,
    author_email,
    pregnancy_period,
    title,
    content,
    created_at,
    popularity
) VALUES
('POST01',  1, 'demo.community.sora@moment.local',    '임신 초기', '입덧 때문에 아침 식사가 너무 어렵네요',
 '임신 6주차인데 아침마다 입덧이 심해서 물도 천천히 마시고 있어요. 공복을 피하려고 크래커를 준비했는데 다른 분들은 어떤 음식이 도움이 되었나요?', '2026-06-01 08:35:00', 9),
('POST02',  2, 'demo.community.jiyun@moment.local',   '임신 중기', '태동을 처음 느낀 날',
 '어젯밤 배 안에서 작은 물방울이 터지는 것 같은 느낌이 들었어요. 처음에는 장이 움직이는 줄 알았는데 반복되는 걸 보니 태동 같아서 정말 신기했습니다.', '2026-06-02 21:10:00', 8),
('POST03',  3, 'demo.community.minseo@moment.local',  '임신 중기', '임산부 운동은 어느 정도가 적당할까요?',
 '요즘 하루 30분 정도 걷고 있습니다. 무리하지 않는 선에서 스트레칭이나 수영도 해보고 싶은데 중기에 꾸준히 하기 좋은 운동 경험을 듣고 싶어요.', '2026-06-03 18:20:00', 7),
('POST04',  4, 'demo.community.haeun@moment.local',   '임신 후기', '출산 가방 체크리스트 공유해요',
 '병원 서류, 산모용품, 아기 옷, 충전기까지 챙겼습니다. 실제로 입원해 보신 분들이 꼭 필요했다고 느낀 물건이 있다면 알려주세요.', '2026-06-04 10:05:00', 9),
('POST05',  5, 'demo.community.yuna@moment.local',    '쌍둥이 임신', '쌍둥이 임신 중 수면 자세 고민',
 '배가 빠르게 불러와서 왼쪽으로 누워도 허리와 골반이 불편합니다. 바디필로우를 사용하고 있는데 쌍둥이 임산부 분들의 수면 팁이 궁금해요.', '2026-06-05 23:12:00', 6),
('POST06',  6, 'demo.community.dabin@moment.local',   '임신 후기', '워킹맘의 막달 출퇴근 경험',
 '출산휴가 전까지 출근 중인데 오후가 되면 다리가 많이 붓습니다. 회사에 양해를 구해 중간중간 걷고 있지만 체력 관리가 쉽지 않네요.', '2026-06-06 19:40:00', 7),
('POST07',  7, 'demo.community.seoyeon@moment.local', '임신 초기', '둘째 임신은 첫째 때와 정말 다르네요',
 '첫째 때는 잠을 충분히 잤는데 지금은 아이를 돌보면서 입덧까지 겪으니 하루가 빠듯합니다. 둘째 임신 중 체력 배분 방법을 나누고 싶어요.', '2026-06-07 14:25:00', 5),
('POST08',  8, 'demo.community.nari@moment.local',    '출산 준비', '예정일이 가까워지니 마음이 복잡해요',
 '기대되면서도 출산 과정이 두렵습니다. 호흡 연습과 출산 영상을 보며 준비하고 있는데 긴장을 줄이는 데 도움이 된 방법이 있을까요?', '2026-06-08 22:00:00', 8),
('POST09',  9, 'demo.community.junho@moment.local',   '보호자 이야기', '입덧이 심한 아내에게 어떻게 도와주면 좋을까요?',
 '냄새에 예민해져서 요리는 제가 하고 있습니다. 필요한 걸 물어보면 괜찮다고만 해서, 부담을 주지 않으면서 실질적으로 도울 방법을 배우고 싶습니다.', '2026-06-09 09:15:00', 9),
('POST10', 10, 'demo.community.hyunwoo@moment.local', '보호자 이야기', '태동을 함께 기다리는 시간이 좋네요',
 '아내가 태동을 느꼈다고 할 때마다 손을 올려보지만 저는 아직 확실히 못 느꼈습니다. 그래도 매일 아기에게 인사하며 기다리고 있어요.', '2026-06-09 20:30:00', 6),
('POST11', 11, 'demo.community.taemin@moment.local',  '보호자 이야기', '첫 산부인과 동행 전에 준비할 것',
 '다음 주에 처음으로 함께 검진을 갑니다. 의사 선생님께 물어볼 질문이나 보호자가 미리 알아두면 좋은 내용이 있다면 조언 부탁드립니다.', '2026-06-10 11:45:00', 7),
('POST12', 12, 'demo.community.jisoo@moment.local',   '보호자 이야기', '출산이 가까운 배우자와 대화하는 법',
 '아내가 요즘 출산 걱정을 자주 이야기합니다. 해결책을 바로 말하기보다 먼저 들어주는 것이 좋다는 걸 배우고 있는데, 다른 보호자 분들은 어떻게 대화하시나요?', '2026-06-10 21:05:00', 8),
('POST13', 13, 'demo.community.sora@moment.local',    '임신 초기', '오늘 처음 심장 소리를 들었어요',
 '진료실에서 빠르게 뛰는 심장 소리를 듣는 순간 눈물이 났습니다. 아직 조심스러운 시기지만 오늘의 감동을 기록하고 싶어 글을 남깁니다.', '2026-06-11 12:20:00', 10),
('POST14', 14, 'demo.community.minseo@moment.local',  '임신 중기', '임산부 영양제 복용 시간 정리',
 '철분은 공복에 먹으면 속이 불편해서 저녁 식사 후로 옮겼고, 엽산과 비타민D는 아침에 먹고 있어요. 병원 안내를 우선으로 하되 복용 알림을 설정하니 빠뜨리지 않게 됐습니다.', '2026-06-11 18:45:00', 7),
('POST15', 15, 'demo.community.dabin@moment.local',   '임신 후기', '붓기 완화에 도움이 된 생활 습관',
 '오래 앉아 있지 않고 한 시간마다 가볍게 움직이며, 퇴근 후에는 다리를 심장보다 조금 높게 두고 쉬고 있습니다. 갑작스러운 심한 붓기는 병원에 문의하려고 해요.', '2026-06-12 08:10:00', 8),
('POST16', 16, 'demo.community.yuna@moment.local',    '쌍둥이 임신', '아기 용품을 두 개씩 사야 할지 고민이에요',
 '카시트와 침대처럼 반드시 각각 필요한 것과 함께 써도 되는 물건을 구분하고 있습니다. 쌍둥이 육아 경험이 있는 분들의 현실적인 구매 기준이 궁금합니다.', '2026-06-12 16:35:00', 6),
('POST17', 17, 'demo.community.seoyeon@moment.local', '임신 초기', '첫째에게 동생 소식을 어떻게 알려주셨나요?',
 '아직 임신 초기라 조심스럽지만 첫째가 엄마의 변화를 눈치채고 있습니다. 나이에 맞게 동생 이야기를 시작하는 좋은 방법을 알고 싶어요.', '2026-06-13 09:05:00', 7),
('POST18', 18, 'demo.community.nari@moment.local',    '출산 준비', '출산 전 마지막 주말을 편안하게 보냈어요',
 '멀리 나가지 않고 집 근처를 산책하고 아기 방을 정리했습니다. 배우자와 사진도 남기고 서로 수고했다고 이야기하니 마음이 한결 차분해졌어요.', '2026-06-13 13:20:00', 9);

INSERT INTO COMMUNITY_POSTS (
    user_id,
    pregnancy_period,
    title,
    content,
    created_at
)
SELECT
    user_info.user_id,
    post_data.pregnancy_period,
    post_data.title,
    post_data.content,
    post_data.created_at
FROM TEMP_DEMO_COMMUNITY_POSTS AS post_data
JOIN USERS AS user_info
  ON user_info.email = post_data.author_email
ORDER BY post_data.post_order;

-- -------------------------------------------------------------------
-- 4. 댓글 원본 데이터
-- -------------------------------------------------------------------

DROP TEMPORARY TABLE IF EXISTS TEMP_DEMO_COMMUNITY_COMMENTS;

CREATE TEMPORARY TABLE TEMP_DEMO_COMMUNITY_COMMENTS (
    comment_order INT PRIMARY KEY,
    post_key VARCHAR(30) NOT NULL,
    author_email VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME NOT NULL
);

INSERT INTO TEMP_DEMO_COMMUNITY_COMMENTS (
    comment_order,
    post_key,
    author_email,
    content,
    created_at
) VALUES
( 1, 'POST01', 'demo.community.jiyun@moment.local',   '저는 침대 옆에 크래커와 미지근한 물을 두고 눈 뜨자마자 조금씩 먹었어요. 한 번에 많이 먹지 않는 게 도움이 됐습니다.', '2026-06-01 09:10:00'),
( 2, 'POST01', 'demo.community.haeun@moment.local',   '차갑고 신맛 나는 과일이 잘 맞았지만 사람마다 다르더라고요. 물도 못 마실 정도면 꼭 병원에 상담해 보세요.', '2026-06-01 10:25:00'),
( 3, 'POST01', 'demo.community.junho@moment.local',   '저희도 냄새가 적은 음식 위주로 준비하고 있습니다. 보호자 입장에서도 어떤 음식이 괜찮았는지 기록해 두니 도움이 됐어요.', '2026-06-01 12:40:00'),
( 4, 'POST02', 'demo.community.sora@moment.local',    '글만 읽어도 설레네요. 저도 그 순간을 기다리고 있어요.', '2026-06-02 21:35:00'),
( 5, 'POST02', 'demo.community.hyunwoo@moment.local', '아내가 비슷하게 표현했어요. 보호자인 저도 함께 느끼는 날을 기다리는 중입니다.', '2026-06-02 22:05:00'),
( 6, 'POST03', 'demo.community.dabin@moment.local',   '담당 의사에게 확인하고 걷기와 가벼운 스트레칭을 꾸준히 했어요. 숨이 찰 정도로 무리하지 않는 게 중요했습니다.', '2026-06-03 19:10:00'),
( 7, 'POST03', 'demo.community.yuna@moment.local',    '저는 쌍둥이라 운동 강도를 더 낮추라는 안내를 받았어요. 임신 상태마다 달라서 병원 기준을 먼저 따르는 게 좋습니다.', '2026-06-03 20:15:00'),
( 8, 'POST04', 'demo.community.nari@moment.local',    '긴 충전 케이블과 작은 텀블러가 실제로 유용하다는 이야기를 많이 들었어요. 저도 체크리스트에 추가했습니다.', '2026-06-04 10:50:00'),
( 9, 'POST04', 'demo.community.jisoo@moment.local',   '보호자용 얇은 겉옷과 간단한 간식도 챙겨두면 좋습니다. 급하게 움직일 때 생각보다 놓치기 쉽더라고요.', '2026-06-04 12:00:00'),
(10, 'POST04', 'demo.community.dabin@moment.local',   '산모수첩과 신분증은 가방 가장 바깥쪽에 넣어두었어요. 바로 꺼낼 수 있어서 편했습니다.', '2026-06-04 15:30:00'),
(11, 'POST05', 'demo.community.minseo@moment.local',  '무릎 사이와 배 아래에 작은 쿠션을 각각 받치니 허리 부담이 줄었어요.', '2026-06-06 08:20:00'),
(12, 'POST05', 'demo.community.yuna@moment.local',    '작성자입니다. 쿠션 위치를 여러 방식으로 바꿔보니 조금 나아졌어요. 답변 감사합니다.', '2026-06-06 10:40:00'),
(13, 'POST06', 'demo.community.seoyeon@moment.local', '회사에 임신 사실을 공유하고 휴식 시간을 확보한 게 정말 중요했어요. 몸이 보내는 신호를 우선하세요.', '2026-06-06 20:05:00'),
(14, 'POST06', 'demo.community.taemin@moment.local',  '보호자 입장에서 퇴근 후 집안일을 미리 나누는 것도 도움이 될 것 같습니다. 무리하지 마세요.', '2026-06-06 21:30:00'),
(15, 'POST07', 'demo.community.haeun@moment.local',   '첫째와 함께 낮잠 시간을 만들고 완벽하게 하려는 마음을 내려놓았어요. 주변 도움을 구하는 것도 필요합니다.', '2026-06-07 15:10:00'),
(16, 'POST07', 'demo.community.jiyun@moment.local',   '간단히 먹을 수 있는 음식을 미리 준비해 두면 체력 소모가 줄더라고요.', '2026-06-07 16:45:00'),
(17, 'POST08', 'demo.community.sora@moment.local',    '불안한 마음이 자연스럽다는 말을 들으니 조금 편해졌어요. 호흡을 길게 내쉬는 연습을 하고 있습니다.', '2026-06-08 22:30:00'),
(18, 'POST08', 'demo.community.jisoo@moment.local',   '배우자와 걱정되는 상황을 구체적으로 이야기하고 역할을 정해두니 막연한 불안이 줄었습니다.', '2026-06-09 07:40:00'),
(19, 'POST08', 'demo.community.haeun@moment.local',   '병원에 언제 연락하고 이동할지 기준을 메모해 두는 것도 마음을 안정시키는 데 도움이 됐어요.', '2026-06-09 09:00:00'),
(20, 'POST09', 'demo.community.sora@moment.local',    '필요한 걸 계속 묻기보다 물과 간단한 간식을 가까이에 두어주는 게 편했어요. 조용히 집안일을 해주는 것도 큰 도움입니다.', '2026-06-09 09:45:00'),
(21, 'POST09', 'demo.community.jiyun@moment.local',   '괜찮다고 말해도 힘들 때가 있어요. 오늘은 이것과 저것 중 뭘 해줄까처럼 선택지를 주면 답하기 쉬웠습니다.', '2026-06-09 10:20:00'),
(22, 'POST09', 'demo.community.taemin@moment.local',  '저도 배우는 중입니다. 해결하려고 서두르기보다 상태를 관찰하고 필요한 일을 먼저 해보겠습니다.', '2026-06-09 11:10:00'),
(23, 'POST10', 'demo.community.hyunwoo@moment.local', '작성자입니다. 오늘은 손끝에 아주 작게 느껴진 것 같아서 둘이 한참 웃었습니다.', '2026-06-10 07:50:00'),
(24, 'POST10', 'demo.community.junho@moment.local',   '매일 같은 시간에 이야기해 주는 것도 좋은 추억이 될 것 같아요.', '2026-06-10 08:15:00'),
(25, 'POST11', 'demo.community.minseo@moment.local',  '평소 불편한 증상과 복용 중인 영양제를 메모해 가면 질문하기 편합니다.', '2026-06-10 12:25:00'),
(26, 'POST11', 'demo.community.jisoo@moment.local',   '검진 내용을 함께 듣고 집에 와서 정리해 주는 것만으로도 든든하다고 하더라고요.', '2026-06-10 13:10:00'),
(27, 'POST12', 'demo.community.nari@moment.local',    '저는 조언보다 지금 어떤 점이 가장 걱정되는지 물어봐 주는 것이 좋았어요.', '2026-06-10 21:40:00'),
(28, 'POST12', 'demo.community.dabin@moment.local',   '말없이 손을 잡아주고 끝까지 들어주는 날이 필요했습니다. 해결책은 나중에 함께 찾아도 괜찮아요.', '2026-06-10 22:15:00'),
(29, 'POST12', 'demo.community.junho@moment.local',   '보호자끼리도 이런 경험을 공유하니 도움이 됩니다. 저도 먼저 듣는 연습을 해보겠습니다.', '2026-06-11 07:20:00'),
(30, 'POST13', 'demo.community.seoyeon@moment.local', '정말 축하드려요. 그 순간의 감동이 오래 기억에 남을 것 같습니다.', '2026-06-11 12:45:00'),
(31, 'POST13', 'demo.community.junho@moment.local',   '함께 들었는데 저도 울컥했습니다. 건강하게 잘 자라길 응원해 주세요.', '2026-06-11 13:05:00'),
(32, 'POST13', 'demo.community.yuna@moment.local',    '두 아기의 심장 소리를 처음 들었던 날이 생각나네요. 소중한 기록 잘 남기셨습니다.', '2026-06-11 14:30:00'),
(33, 'POST14', 'demo.community.jiyun@moment.local',   '알림 설정 좋은 방법이네요. 저도 철분 복용 시간을 자주 놓쳐서 적용해 봐야겠어요.', '2026-06-11 19:20:00'),
(34, 'POST14', 'demo.community.haeun@moment.local',   '영양제마다 함께 먹으면 안 되는 음식이나 약이 있을 수 있어서 병원과 약사에게 확인하는 게 가장 정확했습니다.', '2026-06-11 20:00:00'),
(35, 'POST15', 'demo.community.minseo@moment.local',  '압박 양말도 병원에 물어보고 사용하니 편했어요. 갑자기 한쪽만 붓거나 통증이 있으면 바로 확인해야 한다고 들었습니다.', '2026-06-12 09:00:00'),
(36, 'POST15', 'demo.community.dabin@moment.local',   '작성자입니다. 오늘은 점심시간에도 짧게 걸었더니 어제보다 덜 붓는 느낌입니다.', '2026-06-12 13:15:00'),
(37, 'POST16', 'demo.community.seoyeon@moment.local', '중고로 구해도 되는 품목과 안전 때문에 새 제품이 필요한 품목을 나눠보면 예산 계획에 도움이 될 것 같아요.', '2026-06-12 17:20:00'),
(38, 'POST16', 'demo.community.yuna@moment.local',    '작성자입니다. 카시트처럼 각각 필요한 물건부터 우선순위를 정해보겠습니다.', '2026-06-12 18:05:00'),
(39, 'POST17', 'demo.community.jisoo@moment.local',   '그림책을 활용해서 가족이 늘어나는 이야기를 자연스럽게 시작하는 방법도 좋다고 들었습니다.', '2026-06-13 09:40:00'),
(40, 'POST17', 'demo.community.haeun@moment.local',   '첫째가 느낄 감정도 충분히 들어주고, 동생 준비에 작은 역할을 주니 관심을 긍정적으로 표현했어요.', '2026-06-13 10:30:00'),
(41, 'POST18', 'demo.community.sora@moment.local',    '읽는 저도 마음이 편안해지네요. 두 분과 아기 모두 건강한 만남이 되길 바랍니다.', '2026-06-13 13:50:00'),
(42, 'POST18', 'demo.community.jisoo@moment.local',   '거창한 계획보다 함께 쉬고 이야기하는 시간이 가장 좋은 준비일 수 있겠네요. 응원합니다.', '2026-06-13 14:10:00');

INSERT INTO COMMUNITY_COMMENTS (
    post_id,
    user_id,
    content,
    created_at
)
SELECT
    post.post_id,
    comment_user.user_id,
    comment_data.content,
    comment_data.created_at
FROM TEMP_DEMO_COMMUNITY_COMMENTS AS comment_data
JOIN TEMP_DEMO_COMMUNITY_POSTS AS post_data
  ON post_data.post_key = comment_data.post_key
JOIN USERS AS post_user
  ON post_user.email = post_data.author_email
JOIN COMMUNITY_POSTS AS post
  ON post.user_id = post_user.user_id
 AND post.title = post_data.title
JOIN USERS AS comment_user
  ON comment_user.email = comment_data.author_email
ORDER BY comment_data.comment_order;

-- -------------------------------------------------------------------
-- 5. 좋아요 데이터
-- -------------------------------------------------------------------

DROP TEMPORARY TABLE IF EXISTS TEMP_DEMO_COMMUNITY_USERS;

CREATE TEMPORARY TABLE TEMP_DEMO_COMMUNITY_USERS (
    user_order INT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO TEMP_DEMO_COMMUNITY_USERS (user_order, email) VALUES
( 1, 'demo.community.sora@moment.local'),
( 2, 'demo.community.jiyun@moment.local'),
( 3, 'demo.community.minseo@moment.local'),
( 4, 'demo.community.haeun@moment.local'),
( 5, 'demo.community.yuna@moment.local'),
( 6, 'demo.community.dabin@moment.local'),
( 7, 'demo.community.seoyeon@moment.local'),
( 8, 'demo.community.nari@moment.local'),
( 9, 'demo.community.junho@moment.local'),
(10, 'demo.community.hyunwoo@moment.local'),
(11, 'demo.community.taemin@moment.local'),
(12, 'demo.community.jisoo@moment.local');

/*
  popularity가 높은 글일수록 많은 사용자가 좋아요를 누른다.
  작성자 본인의 좋아요는 제외하며 MOD 조건으로 글마다 참여자가 달라진다.
*/
INSERT IGNORE INTO COMMUNITY_POST_LIKES (
    post_id,
    user_id,
    created_at
)
SELECT
    post.post_id,
    like_user.user_id,
    DATE_ADD(post_data.created_at, INTERVAL (like_data.user_order * 37 + post_data.post_order * 11) MINUTE)
FROM TEMP_DEMO_COMMUNITY_POSTS AS post_data
JOIN USERS AS post_author
  ON post_author.email = post_data.author_email
JOIN COMMUNITY_POSTS AS post
  ON post.user_id = post_author.user_id
 AND post.title = post_data.title
CROSS JOIN TEMP_DEMO_COMMUNITY_USERS AS like_data
JOIN USERS AS like_user
  ON like_user.email = like_data.email
WHERE like_user.user_id <> post.user_id
  AND MOD(like_data.user_order * 7 + post_data.post_order * 3, 12) < post_data.popularity;

DROP TEMPORARY TABLE TEMP_DEMO_COMMUNITY_COMMENTS;
DROP TEMPORARY TABLE TEMP_DEMO_COMMUNITY_USERS;
DROP TEMPORARY TABLE TEMP_DEMO_COMMUNITY_POSTS;

COMMIT;

-- -------------------------------------------------------------------
-- 6. 실행 결과 확인
-- -------------------------------------------------------------------

SELECT
    user_id,
    email,
    password,
    nickname,
    role,
    baby_nickname,
    pregnancy_start_date,
    parent_user_id
FROM USERS
WHERE email LIKE 'demo.community.%@moment.local'
ORDER BY role DESC, user_id;

SELECT
    post.post_id,
    author.nickname AS author,
    author.role,
    post.pregnancy_period,
    post.title,
    post.created_at,
    COUNT(DISTINCT comment.comment_id) AS comment_count,
    COUNT(DISTINCT post_like.like_id) AS like_count
FROM COMMUNITY_POSTS AS post
JOIN USERS AS author
  ON author.user_id = post.user_id
LEFT JOIN COMMUNITY_COMMENTS AS comment
  ON comment.post_id = post.post_id
LEFT JOIN COMMUNITY_POST_LIKES AS post_like
  ON post_like.post_id = post.post_id
WHERE author.email LIKE 'demo.community.%@moment.local'
GROUP BY
    post.post_id,
    author.nickname,
    author.role,
    post.pregnancy_period,
    post.title,
    post.created_at
ORDER BY post.created_at DESC;

SELECT
    (SELECT COUNT(*)
       FROM USERS
      WHERE email LIKE 'demo.community.%@moment.local') AS demo_users,
    (SELECT COUNT(*)
       FROM COMMUNITY_POSTS AS post
       JOIN USERS AS author ON author.user_id = post.user_id
      WHERE author.email LIKE 'demo.community.%@moment.local') AS demo_posts,
    (SELECT COUNT(*)
       FROM COMMUNITY_COMMENTS AS comment
       JOIN COMMUNITY_POSTS AS post ON post.post_id = comment.post_id
       JOIN USERS AS author ON author.user_id = post.user_id
      WHERE author.email LIKE 'demo.community.%@moment.local') AS demo_comments,
    (SELECT COUNT(*)
       FROM COMMUNITY_POST_LIKES AS post_like
       JOIN COMMUNITY_POSTS AS post ON post.post_id = post_like.post_id
       JOIN USERS AS author ON author.user_id = post.user_id
      WHERE author.email LIKE 'demo.community.%@moment.local') AS demo_likes;
