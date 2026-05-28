# smalltalk_service.py (새 파일)
from datetime import datetime
from sqlalchemy.orm import Session
import models

def get_today_topic(db: Session):
    # 질문 리스트
    questions = [
        "오늘 좋았던 순간은?", "우리가 부모가 된다는 걸 처음 실감했던 순간은?",
        "우리 아이가 커서 어떤 성격을 가졌으면 좋겠나요?", "태어날 아이와 가장 먼저 함께 해보고 싶은 일은?",
        "부모로서 나의 가장 큰 장점은 무엇이 될까요?", "임신 기간 중 가장 기억에 남는 에피소드가 있나요?",
        "우리 부부의 모습을 꼭 닮았으면 하는 부분이 있나요?", "아이의 이름을 지을 때 가장 중요하게 생각하는 것은?",
        "임신 사실을 처음 알았을 때 어떤 기분이 들었나요?", "서로에게 가장 고마웠던 순간은 언제인가요?",
        "출산 후 가장 먹고 싶은 음식이나 가고 싶은 곳은?", "아이가 태어나면 어떤 자장가를 불러주고 싶나요?",
        "육아를 하면서 우리가 절대 잊지 말아야 할 약속 하나는?", "10년 뒤 우리 가족은 어떤 모습일까요?",
        "요즘 가장 큰 고민이나 걱정거리가 있다면 무엇인가요?", "파트너가 부모로서 참 멋질 것 같다고 느낀 순간은?",
        "아이가 태어나기 전 둘만의 데이트로 하고 싶은 것은?", "가족이란 무엇이라고 생각하나요?",
        "첫 태동을 느꼈을 때의 기분을 한 단어로 표현한다면?", "아이가 컸을 때 꼭 들려주고 싶은 우리 부부의 이야기는?"
    ]

    # DB에 질문 없으면 초기화
    if db.query(models.SmallTalkTopic).count() == 0:
        for q in questions:
            db.add(models.SmallTalkTopic(question_text=q))
        db.commit()

    # 날짜 기준으로 오늘 질문 1개만 확실하게 반환
    today_day = datetime.now().timetuple().tm_yday
    topics = db.query(models.SmallTalkTopic).all()
    return topics[today_day % len(topics)]