from sqlalchemy import Column, BigInteger, Integer, String, Text, DateTime, Date, ForeignKey, DECIMAL
from sqlalchemy.sql import func
from database import Base

# 1. 사용자 테이블
class User(Base):
    __tablename__ = "USERS"
    id = Column("user_id", Integer, primary_key=True, index=True) 
    email = Column(String(100), unique=True, index=True)
    password = Column(String(255))
    name = Column(String(50))
    role = Column(String(20))
    baby_nickname = Column(String(50), nullable=True)
    pregnancy_start_date = Column(Date, nullable=True)
    connection_code = Column(String(20), nullable=True)
    parent_user_id = Column(Integer, nullable=True)

# 2. 다이어리 로그 테이블
class DiaryLog(Base):
    __tablename__ = "DIARY_LOGS"
    diary_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("USERS.user_id"))
    temperature_ambient = Column(DECIMAL(4,2), nullable=True)
    humidity_ambient = Column(DECIMAL(4,2), nullable=True)
    weather_ambient = Column(String(50), nullable=True)
    selected_emotion = Column(String(50))
    stress_level = Column(Integer, nullable=True)
    diary_content = Column(Text)
    small_talk_topic_id = Column(Integer, nullable=True)
    recorded_at = Column(DateTime, default=func.now())
    image_path = Column(String(255), nullable=True)

# 3. AI 분석 결과 테이블
class AiAnalysisResult(Base):
    __tablename__ = "AI_ANALYSIS_RESULTS"
    analysis_id = Column(Integer, primary_key=True, index=True)
    diary_id = Column(Integer, ForeignKey("DIARY_LOGS.diary_id"), unique=True)
    detected_emotion = Column(String(50))
    analyzed_at = Column(DateTime, default=func.now())

# 4. 커뮤니티 게시글 테이블
class CommunityPost(Base):
    __tablename__ = "COMMUNITY_POSTS"
    post_id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("USERS.user_id"), nullable=False)
    pregnancy_period = Column(String(50), nullable=True) 
    title = Column(String(200), nullable=True)           
    content = Column(Text, nullable=True)                
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# 🚀 5. 커뮤니티 댓글 테이블 (에러의 원인이었던 녀석을 완벽하게 수정!)
class CommunityComment(Base):
    __tablename__ = "COMMUNITY_COMMENTS"
    comment_id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("COMMUNITY_POSTS.post_id"))
    user_id = Column(Integer, ForeignKey("USERS.user_id"))
    content = Column(Text)
    created_at = Column(DateTime, default=func.now())

# 6. 스몰토크 주제 테이블
class SmallTalkTopic(Base):
    __tablename__ = "SMALL_TALK_TOPICS"
    topic_id = Column(BigInteger, primary_key=True, index=True)
    question_text = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# 7. 스몰토크 답변 테이블
class SmallTalkAnswer(Base):
    __tablename__ = "SMALL_TALK_ANSWERS"
    answer_id = Column(BigInteger, primary_key=True, index=True)
    topic_id = Column(BigInteger, ForeignKey("SMALL_TALK_TOPICS.topic_id"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("USERS.user_id"), nullable=False)
    connection_code = Column(String(100), nullable=True)
    answer_content = Column(Text, nullable=False)
    match_status = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# 8. 부부 공유 캘린더 일정 테이블
class SharedCalendarEvent(Base):
    __tablename__ = "SHARED_CALENDAR_EVENTS"
    event_id = Column(Integer, primary_key=True, index=True)
    connection_code = Column(String(100), index=True) 
    event_type = Column(String(50))  
    title = Column(String(200))      
    content = Column(Text)           
    event_date = Column(Date)        
    created_at = Column(DateTime, default=func.now())

# ... (기존 User 모델 등 유지) ...

# 🚀 댓글 테이블 추가


class ApplianceSetting(Base):
    __tablename__ = "APPLIANCE_SETTINGS"

    setting_id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    analysis_id = Column(BigInteger, nullable=True)
    user_id = Column(BigInteger, nullable=True, index=True)
    appliance_name = Column(String(50), nullable=False)
    control_command = Column(Text, nullable=False)
    execution_status = Column(String(20), nullable=False, default="OFF")
