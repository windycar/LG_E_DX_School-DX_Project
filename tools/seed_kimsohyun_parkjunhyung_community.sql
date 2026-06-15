USE campus_25KDT_LG_3;

SET NAMES utf8mb4;

START TRANSACTION;

-- 김소현 게시글 1건
INSERT INTO COMMUNITY_POSTS (
    user_id,
    pregnancy_period,
    title,
    content,
    created_at
)
SELECT
    user_info.user_id,
    '임신 초기',
    '임신 초기에는 이렇게 피곤한 게 맞나요?',
    '현재 6주차인데 퇴근하고 나면 바로 눕고 싶을 정도로 피곤합니다. 무리하지 않으려고 약속과 집안일을 줄이고 있는데 다른 분들은 초기 피로감을 어떻게 관리하셨나요?',
    '2026-06-15 16:10:00'
FROM USERS AS user_info
WHERE user_info.email = 'thgus@naver.com'
  AND NOT EXISTS (
      SELECT 1
      FROM COMMUNITY_POSTS AS existing_post
      WHERE existing_post.user_id = user_info.user_id
        AND existing_post.title = '임신 초기에는 이렇게 피곤한 게 맞나요?'
  );

-- 김소현 게시글 2건째
INSERT INTO COMMUNITY_POSTS (
    user_id,
    pregnancy_period,
    title,
    content,
    created_at
)
SELECT
    user_info.user_id,
    '임신 초기',
    '음식 냄새에 예민해져서 식사 준비가 고민이에요',
    '요즘 밥 냄새와 기름 냄새가 특히 힘들어서 먹을 수 있는 음식이 자주 달라집니다. 한 번에 많이 먹기보다 과일과 크래커를 조금씩 먹고 있는데 비슷한 경험이 있는 분들의 식사 팁이 궁금해요.',
    '2026-06-15 16:20:00'
FROM USERS AS user_info
WHERE user_info.email = 'thgus@naver.com'
  AND NOT EXISTS (
      SELECT 1
      FROM COMMUNITY_POSTS AS existing_post
      WHERE existing_post.user_id = user_info.user_id
        AND existing_post.title = '음식 냄새에 예민해져서 식사 준비가 고민이에요'
  );

-- 박준형 게시글 1건
INSERT INTO COMMUNITY_POSTS (
    user_id,
    pregnancy_period,
    title,
    content,
    created_at
)
SELECT
    user_info.user_id,
    '임신 초기',
    '입덧이 시작된 아내를 위해 준비한 것들',
    '냄새가 강한 요리는 제가 맡고 물과 간단한 간식을 가까이에 두고 있습니다. 매일 먹을 수 있는 음식이 달라서 정답을 정하기보다 그날 필요한 일을 먼저 물어보려고 해요.',
    '2026-06-15 16:25:00'
FROM USERS AS user_info
WHERE user_info.email = 'wnsgud@naver.com'
  AND NOT EXISTS (
      SELECT 1
      FROM COMMUNITY_POSTS AS existing_post
      WHERE existing_post.user_id = user_info.user_id
        AND existing_post.title = '입덧이 시작된 아내를 위해 준비한 것들'
  );

-- 김소현이 본인 게시글에 작성한 댓글
INSERT INTO COMMUNITY_COMMENTS (
    post_id,
    user_id,
    content,
    created_at
)
SELECT
    target_post.post_id,
    comment_user.user_id,
    '작성자입니다. 오늘은 퇴근 후 해야 할 일을 줄이고 일찍 쉬어보려고 해요. 몸의 변화를 자연스럽게 받아들이는 연습이 필요한 것 같습니다.',
    '2026-06-15 16:30:00'
FROM COMMUNITY_POSTS AS target_post
JOIN USERS AS post_author
  ON post_author.user_id = target_post.user_id
JOIN USERS AS comment_user
  ON comment_user.email = 'thgus@naver.com'
WHERE post_author.email = 'thgus@naver.com'
  AND target_post.title = '임신 초기에는 이렇게 피곤한 게 맞나요?'
  AND NOT EXISTS (
      SELECT 1
      FROM COMMUNITY_COMMENTS AS existing_comment
      WHERE existing_comment.post_id = target_post.post_id
        AND existing_comment.user_id = comment_user.user_id
        AND existing_comment.content = '작성자입니다. 오늘은 퇴근 후 해야 할 일을 줄이고 일찍 쉬어보려고 해요. 몸의 변화를 자연스럽게 받아들이는 연습이 필요한 것 같습니다.'
  );

-- 박준형이 김소현 게시글에 작성한 댓글
INSERT INTO COMMUNITY_COMMENTS (
    post_id,
    user_id,
    content,
    created_at
)
SELECT
    target_post.post_id,
    comment_user.user_id,
    '요즘 많이 피곤해 보여서 저녁 집안일은 제가 맡고 있습니다. 쉬는 데 미안함을 느끼지 않도록 옆에서 잘 도와줄게요.',
    '2026-06-15 16:35:00'
FROM COMMUNITY_POSTS AS target_post
JOIN USERS AS post_author
  ON post_author.user_id = target_post.user_id
JOIN USERS AS comment_user
  ON comment_user.email = 'wnsgud@naver.com'
WHERE post_author.email = 'thgus@naver.com'
  AND target_post.title = '임신 초기에는 이렇게 피곤한 게 맞나요?'
  AND NOT EXISTS (
      SELECT 1
      FROM COMMUNITY_COMMENTS AS existing_comment
      WHERE existing_comment.post_id = target_post.post_id
        AND existing_comment.user_id = comment_user.user_id
        AND existing_comment.content = '요즘 많이 피곤해 보여서 저녁 집안일은 제가 맡고 있습니다. 쉬는 데 미안함을 느끼지 않도록 옆에서 잘 도와줄게요.'
  );

-- 박준형이 김소현의 식사 고민 글에 작성한 댓글
INSERT INTO COMMUNITY_COMMENTS (
    post_id,
    user_id,
    content,
    created_at
)
SELECT
    target_post.post_id,
    comment_user.user_id,
    '먹을 수 있는 음식이 매일 달라서 몇 가지 선택지를 준비해 두고 있습니다. 냄새가 덜 퍼지도록 환기도 제가 맡을게요.',
    '2026-06-15 16:38:00'
FROM COMMUNITY_POSTS AS target_post
JOIN USERS AS post_author
  ON post_author.user_id = target_post.user_id
JOIN USERS AS comment_user
  ON comment_user.email = 'wnsgud@naver.com'
WHERE post_author.email = 'thgus@naver.com'
  AND target_post.title = '음식 냄새에 예민해져서 식사 준비가 고민이에요'
  AND NOT EXISTS (
      SELECT 1
      FROM COMMUNITY_COMMENTS AS existing_comment
      WHERE existing_comment.post_id = target_post.post_id
        AND existing_comment.user_id = comment_user.user_id
        AND existing_comment.content = '먹을 수 있는 음식이 매일 달라서 몇 가지 선택지를 준비해 두고 있습니다. 냄새가 덜 퍼지도록 환기도 제가 맡을게요.'
  );

-- 김소현이 박준형 게시글에 작성한 댓글
INSERT INTO COMMUNITY_COMMENTS (
    post_id,
    user_id,
    content,
    created_at
)
SELECT
    target_post.post_id,
    comment_user.user_id,
    '필요한 걸 말하기 전에 먼저 챙겨줘서 정말 든든해요. 특히 음식 냄새가 힘든 날 요리를 맡아주는 게 가장 도움이 됩니다.',
    '2026-06-15 16:42:00'
FROM COMMUNITY_POSTS AS target_post
JOIN USERS AS post_author
  ON post_author.user_id = target_post.user_id
JOIN USERS AS comment_user
  ON comment_user.email = 'thgus@naver.com'
WHERE post_author.email = 'wnsgud@naver.com'
  AND target_post.title = '입덧이 시작된 아내를 위해 준비한 것들'
  AND NOT EXISTS (
      SELECT 1
      FROM COMMUNITY_COMMENTS AS existing_comment
      WHERE existing_comment.post_id = target_post.post_id
        AND existing_comment.user_id = comment_user.user_id
        AND existing_comment.content = '필요한 걸 말하기 전에 먼저 챙겨줘서 정말 든든해요. 특히 음식 냄새가 힘든 날 요리를 맡아주는 게 가장 도움이 됩니다.'
  );

-- 박준형이 본인 게시글에 작성한 댓글
INSERT INTO COMMUNITY_COMMENTS (
    post_id,
    user_id,
    content,
    created_at
)
SELECT
    target_post.post_id,
    comment_user.user_id,
    '작성자입니다. 해결책을 서두르기보다 오늘 가장 힘든 일이 무엇인지 먼저 듣는 방식으로 계속 맞춰보겠습니다.',
    '2026-06-15 16:45:00'
FROM COMMUNITY_POSTS AS target_post
JOIN USERS AS post_author
  ON post_author.user_id = target_post.user_id
JOIN USERS AS comment_user
  ON comment_user.email = 'wnsgud@naver.com'
WHERE post_author.email = 'wnsgud@naver.com'
  AND target_post.title = '입덧이 시작된 아내를 위해 준비한 것들'
  AND NOT EXISTS (
      SELECT 1
      FROM COMMUNITY_COMMENTS AS existing_comment
      WHERE existing_comment.post_id = target_post.post_id
        AND existing_comment.user_id = comment_user.user_id
        AND existing_comment.content = '작성자입니다. 해결책을 서두르기보다 오늘 가장 힘든 일이 무엇인지 먼저 듣는 방식으로 계속 맞춰보겠습니다.'
  );

-- 김소현이 다른 초기 임산부 게시글에 작성한 댓글
INSERT INTO COMMUNITY_COMMENTS (
    post_id,
    user_id,
    content,
    created_at
)
SELECT
    target_post.post_id,
    comment_user.user_id,
    '저도 요즘 오후가 되면 눈을 뜨기 힘들 정도로 피곤해요. 할 일을 줄이고 잘 수 있을 때 쉬는 연습을 하고 있습니다.',
    '2026-06-15 16:50:00'
FROM COMMUNITY_POSTS AS target_post
JOIN USERS AS post_author
  ON post_author.user_id = target_post.user_id
JOIN USERS AS comment_user
  ON comment_user.email = 'thgus@naver.com'
WHERE post_author.email = 'demo.community.sora@moment.local'
  AND target_post.title = '임신 초기 피로감, 다들 어떻게 쉬고 계세요?'
  AND NOT EXISTS (
      SELECT 1
      FROM COMMUNITY_COMMENTS AS existing_comment
      WHERE existing_comment.post_id = target_post.post_id
        AND existing_comment.user_id = comment_user.user_id
        AND existing_comment.content = '저도 요즘 오후가 되면 눈을 뜨기 힘들 정도로 피곤해요. 할 일을 줄이고 잘 수 있을 때 쉬는 연습을 하고 있습니다.'
  );

-- 김소현이 입덧 관련 게시글에 작성한 댓글
INSERT INTO COMMUNITY_COMMENTS (
    post_id,
    user_id,
    content,
    created_at
)
SELECT
    target_post.post_id,
    comment_user.user_id,
    '저도 공복이면 속이 더 불편해서 침대 옆에 크래커를 두고 조금씩 먹고 있어요. 물도 한 번에 마시기보다 나누어 마시는 게 편했습니다.',
    '2026-06-15 16:55:00'
FROM COMMUNITY_POSTS AS target_post
JOIN USERS AS post_author
  ON post_author.user_id = target_post.user_id
JOIN USERS AS comment_user
  ON comment_user.email = 'thgus@naver.com'
WHERE post_author.email = 'demo.community.sora@moment.local'
  AND target_post.title = '입덧 때문에 아침 식사가 너무 어렵네요'
  AND NOT EXISTS (
      SELECT 1
      FROM COMMUNITY_COMMENTS AS existing_comment
      WHERE existing_comment.post_id = target_post.post_id
        AND existing_comment.user_id = comment_user.user_id
        AND existing_comment.content = '저도 공복이면 속이 더 불편해서 침대 옆에 크래커를 두고 조금씩 먹고 있어요. 물도 한 번에 마시기보다 나누어 마시는 게 편했습니다.'
  );

-- 박준형이 다른 보호자 게시글에 작성한 댓글
INSERT INTO COMMUNITY_COMMENTS (
    post_id,
    user_id,
    content,
    created_at
)
SELECT
    target_post.post_id,
    comment_user.user_id,
    '저도 집안일을 정해두되 상태가 달라지는 날에는 계획을 바꾸려고 합니다. 보호자가 먼저 살피는 게 중요하다는 말에 공감합니다.',
    '2026-06-15 17:00:00'
FROM COMMUNITY_POSTS AS target_post
JOIN USERS AS post_author
  ON post_author.user_id = target_post.user_id
JOIN USERS AS comment_user
  ON comment_user.email = 'wnsgud@naver.com'
WHERE post_author.email = 'demo.community.junho@moment.local'
  AND target_post.title = '아내가 쉬는 동안 제가 맡을 일을 정리했습니다'
  AND NOT EXISTS (
      SELECT 1
      FROM COMMUNITY_COMMENTS AS existing_comment
      WHERE existing_comment.post_id = target_post.post_id
        AND existing_comment.user_id = comment_user.user_id
        AND existing_comment.content = '저도 집안일을 정해두되 상태가 달라지는 날에는 계획을 바꾸려고 합니다. 보호자가 먼저 살피는 게 중요하다는 말에 공감합니다.'
  );

-- 박준형이 입덧 보호자 게시글에 작성한 댓글
INSERT INTO COMMUNITY_COMMENTS (
    post_id,
    user_id,
    content,
    created_at
)
SELECT
    target_post.post_id,
    comment_user.user_id,
    '저희도 비슷한 시기라 공감합니다. 물과 간단한 간식을 가까이 두고 냄새가 강한 요리를 대신하는 것부터 실천하고 있어요.',
    '2026-06-15 17:05:00'
FROM COMMUNITY_POSTS AS target_post
JOIN USERS AS post_author
  ON post_author.user_id = target_post.user_id
JOIN USERS AS comment_user
  ON comment_user.email = 'wnsgud@naver.com'
WHERE post_author.email = 'demo.community.junho@moment.local'
  AND target_post.title = '입덧이 심한 아내에게 어떻게 도와주면 좋을까요?'
  AND NOT EXISTS (
      SELECT 1
      FROM COMMUNITY_COMMENTS AS existing_comment
      WHERE existing_comment.post_id = target_post.post_id
        AND existing_comment.user_id = comment_user.user_id
        AND existing_comment.content = '저희도 비슷한 시기라 공감합니다. 물과 간단한 간식을 가까이 두고 냄새가 강한 요리를 대신하는 것부터 실천하고 있어요.'
  );

COMMIT;

SELECT
    user_info.user_id,
    user_info.name,
    user_info.email,
    COUNT(DISTINCT authored_post.post_id) AS post_count,
    COUNT(DISTINCT authored_comment.comment_id) AS comment_count
FROM USERS AS user_info
LEFT JOIN COMMUNITY_POSTS AS authored_post
  ON authored_post.user_id = user_info.user_id
LEFT JOIN COMMUNITY_COMMENTS AS authored_comment
  ON authored_comment.user_id = user_info.user_id
WHERE user_info.email IN ('thgus@naver.com', 'wnsgud@naver.com')
GROUP BY user_info.user_id, user_info.name, user_info.email
ORDER BY user_info.user_id;
