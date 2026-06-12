USE campus_25KDT_LG_3;
SET NAMES utf8mb4;

START TRANSACTION;

SET @pregnant_user_id := 16;
SET @guardian_user_id := 17;

INSERT INTO SMALL_TALK_TOPICS (question_text)
SELECT '요즘 서로에게 가장 고마운 점은 무엇인가요?'
WHERE NOT EXISTS (
    SELECT 1
    FROM SMALL_TALK_TOPICS
    WHERE question_text = '요즘 서로에게 가장 고마운 점은 무엇인가요?'
);

SET @thanks_topic_id := (
    SELECT topic_id
    FROM SMALL_TALK_TOPICS
    WHERE question_text = '요즘 서로에게 가장 고마운 점은 무엇인가요?'
    ORDER BY topic_id
    LIMIT 1
);

-- Move the previously seeded June 23 answers away from the historical topic 10.
UPDATE SMALL_TALK_ANSWERS
SET topic_id = @thanks_topic_id
WHERE user_id IN (@pregnant_user_id, @guardian_user_id)
  AND topic_id = 10
  AND created_at >= '2026-06-23'
  AND created_at < '2026-06-24';

DROP TEMPORARY TABLE IF EXISTS TEMP_DEMO_SMALLTALK;

CREATE TEMPORARY TABLE TEMP_DEMO_SMALLTALK (
    topic_id BIGINT NOT NULL,
    answer_date DATETIME NOT NULL,
    pregnant_answer TEXT NOT NULL,
    guardian_answer TEXT NOT NULL,
    PRIMARY KEY (topic_id, answer_date)
);

-- These topic IDs already exist in SMALL_TALK_TOPICS in the demo database.
INSERT INTO TEMP_DEMO_SMALLTALK (
    topic_id,
    answer_date,
    pregnant_answer,
    guardian_answer
) VALUES
(
    21,
    '2026-06-12 20:50:00',
    '아침에 몸이 가볍고 컨디션이 좋았던 순간이 가장 좋았어요. 꿀떡이도 건강하게 잘 지내는 것 같아서 행복했어요.',
    '소현이가 오늘은 몸이 괜찮다고 웃으며 말해준 순간이 가장 좋았어. 매일 편안했으면 좋겠어.'
),
(
    22,
    '2026-06-15 21:30:00',
    '병원에서 임신을 확인하고 아기 이야기를 나누기 시작했을 때 부모가 된다는 것이 실감났어요.',
    '소현이에게 임신 소식을 들었을 때 기쁘면서도 내가 가족을 더 잘 지켜야겠다는 책임감이 생겼어.'
),
(
    23,
    '2026-06-18 21:15:00',
    '자신의 마음을 솔직하게 표현하면서도 다른 사람을 배려할 줄 아는 따뜻한 아이로 자랐으면 좋겠어요.',
    '건강하고 자신감 있게 자랐으면 좋겠어. 실패하더라도 다시 도전할 수 있는 사람이 되면 좋겠어.'
),
(
    24,
    '2026-06-21 20:20:00',
    '날씨가 좋은 날에 세 식구가 함께 가까운 공원을 천천히 산책하고 싶어요.',
    '꿀떡이를 안고 가족사진을 찍고 싶어. 그리고 소현이와 아기 모두에게 고맙다고 말하고 싶어.'
),
(
    @thanks_topic_id,
    '2026-06-23 21:10:00',
    '몸이 힘들 때 말하지 않아도 집안일을 도와주고 편하게 쉴 수 있도록 배려해줄 때 가장 고마워요.',
    '힘든 임신 기간에도 꿀떡이를 위해 건강을 챙기고 밝게 생활하려고 노력하는 소현이에게 매일 고마워.'
),
(
    25,
    '2026-06-25 20:40:00',
    '꿀떡이가 학교생활 이야기를 들려주고 우리 부부가 함께 웃으며 들어주는 따뜻한 가족이면 좋겠어요.',
    '서로의 이야기를 잘 들어주고 주말마다 함께 시간을 보내는 건강하고 웃음 많은 가족일 것 같아.'
);

-- Abort naturally through the foreign-key join if the expected topics are missing.
INSERT INTO SMALL_TALK_ANSWERS (
    topic_id,
    user_id,
    connection_code,
    answer_content,
    match_status,
    created_at
)
SELECT
    data.topic_id,
    pregnant.user_id,
    COALESCE(pregnant.connection_code, 'DEMO_CODE'),
    data.pregnant_answer,
    'MATCHED',
    data.answer_date
FROM TEMP_DEMO_SMALLTALK AS data
JOIN SMALL_TALK_TOPICS AS topic
  ON topic.topic_id = data.topic_id
JOIN USERS AS pregnant
  ON pregnant.user_id = @pregnant_user_id
WHERE NOT EXISTS (
    SELECT 1
    FROM SMALL_TALK_ANSWERS AS existing
    WHERE existing.user_id = pregnant.user_id
      AND existing.topic_id = data.topic_id
      AND DATE(existing.created_at) = DATE(data.answer_date)
);

INSERT INTO SMALL_TALK_ANSWERS (
    topic_id,
    user_id,
    connection_code,
    answer_content,
    match_status,
    created_at
)
SELECT
    data.topic_id,
    guardian.user_id,
    COALESCE(pregnant.connection_code, guardian.connection_code, 'DEMO_CODE'),
    data.guardian_answer,
    'MATCHED',
    DATE_ADD(data.answer_date, INTERVAL 15 MINUTE)
FROM TEMP_DEMO_SMALLTALK AS data
JOIN SMALL_TALK_TOPICS AS topic
  ON topic.topic_id = data.topic_id
JOIN USERS AS pregnant
  ON pregnant.user_id = @pregnant_user_id
JOIN USERS AS guardian
  ON guardian.user_id = @guardian_user_id
WHERE NOT EXISTS (
    SELECT 1
    FROM SMALL_TALK_ANSWERS AS existing
    WHERE existing.user_id = guardian.user_id
      AND existing.topic_id = data.topic_id
      AND DATE(existing.created_at) = DATE(data.answer_date)
);

-- Keep the diary row explicitly linked to the small-talk topic as well.
UPDATE DIARY_LOGS AS diary
JOIN TEMP_DEMO_SMALLTALK AS data
  ON DATE(diary.recorded_at) = DATE(data.answer_date)
SET diary.small_talk_topic_id = data.topic_id
WHERE diary.user_id = @pregnant_user_id
  AND diary.recorded_at >= '2026-06-12'
  AND diary.recorded_at < '2026-06-26';

DROP TEMPORARY TABLE TEMP_DEMO_SMALLTALK;

COMMIT;

SELECT
    answer.answer_id,
    answer.created_at,
    topic.topic_id,
    topic.question_text,
    user_info.user_id,
    user_info.name,
    answer.answer_content,
    answer.match_status
FROM SMALL_TALK_ANSWERS AS answer
JOIN SMALL_TALK_TOPICS AS topic
  ON topic.topic_id = answer.topic_id
JOIN USERS AS user_info
  ON user_info.user_id = answer.user_id
WHERE answer.user_id IN (@pregnant_user_id, @guardian_user_id)
  AND answer.created_at >= '2026-06-12'
  AND answer.created_at < '2026-06-26'
ORDER BY answer.created_at, answer.user_id;

SELECT
    diary_id,
    recorded_at,
    small_talk_topic_id
FROM DIARY_LOGS
WHERE user_id = @pregnant_user_id
  AND recorded_at >= '2026-06-12'
  AND recorded_at < '2026-06-26'
ORDER BY recorded_at;
