from sqlalchemy import Column, BigInteger, Integer, String, Text, DateTime, Date, ForeignKey, DECIMAL, Boolean
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


class CommunityPostLike(Base):
    __tablename__ = "COMMUNITY_POST_LIKES"
    like_id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    post_id = Column(BigInteger, ForeignKey("COMMUNITY_POSTS.post_id"), nullable=False, index=True)
    user_id = Column(BigInteger, ForeignKey("USERS.user_id"), nullable=False, index=True)
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


class GuardianMission(Base):
    __tablename__ = "GUARDIAN_MISSIONS"

    mission_id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    analysis_id = Column(BigInteger, ForeignKey("AI_ANALYSIS_RESULTS.analysis_id"), nullable=True, index=True)
    status_check_id = Column(BigInteger, ForeignKey("PREGNANCY_STATUS_CHECKS.status_check_id"), nullable=True, index=True)
    user_id = Column(BigInteger, ForeignKey("USERS.user_id"), nullable=False, index=True)
    mission_title = Column(String(200), nullable=False)
    mission_content = Column(Text, nullable=False)
    mission_reason = Column(Text, nullable=True)
    mission_type = Column(String(50), nullable=False, default="emotional_support")
    execution_status = Column(String(50), nullable=False, default="PENDING")
    created_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime, nullable=True)


class UserCarePreference(Base):
    __tablename__ = "USER_CARE_PREFERENCES"

    preference_id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("USERS.user_id"), nullable=False, unique=True, index=True)
    preferred_mission_type = Column(String(50), nullable=False, default="balanced")
    notification_enabled = Column(Boolean, nullable=False, default=True)
    mission_time = Column(String(20), nullable=True)
    care_style = Column(String(50), nullable=False, default="warm")
    avoid_mission_keywords = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class PregnancyStatusCheck(Base):
    __tablename__ = "PREGNANCY_STATUS_CHECKS"

    status_check_id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("USERS.user_id"), nullable=False, index=True)
    symptoms = Column(Text, nullable=True)
    emotions = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())


class WeeklyAiRecommendation(Base):
    __tablename__ = "WEEKLY_AI_RECOMMENDATIONS"

    recommendation_id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    pregnancy_week = Column(Integer, nullable=False, index=True)
    recommendation_type = Column(String(50), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)


class TrustedPregnancyInfo(Base):
    __tablename__ = "TRUSTED_PREGNANCY_INFO"

    info_id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    source = Column(String(100), nullable=True)
    pregnancy_period = Column(String(50), nullable=True)
