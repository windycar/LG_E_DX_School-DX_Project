from sqlalchemy import Column, Integer, String, Date
from database import Base
from sqlalchemy import Column, BigInteger, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
import datetime
# backend/models.py
# backend/models.py
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


# (다른 import가 있다면 그대로 두십시오)

class CommunityPost(Base):
    __tablename__ = "COMMUNITY_POSTS"

    post_id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("USERS.user_id"), nullable=False)
    pregnancy_period = Column(String(50), nullable=True) # 초기, 중기, 후기
    title = Column(String(200), nullable=True)           # 제목
    content = Column(Text, nullable=True)                # 내용
    created_at = Column(DateTime(timezone=True), server_default=func.now())
# models.py 맨 아래에 추가

class SmallTalkTopic(Base):
    __tablename__ = "SMALL_TALK_TOPICS"
    topic_id = Column(BigInteger, primary_key=True, index=True)
    question_text = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SmallTalkAnswer(Base):
    __tablename__ = "SMALL_TALK_ANSWERS"
    answer_id = Column(BigInteger, primary_key=True, index=True)
    topic_id = Column(BigInteger, ForeignKey("SMALL_TALK_TOPICS.topic_id"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("USERS.user_id"), nullable=False)
    connection_code = Column(String(100), nullable=True)
    answer_content = Column(Text, nullable=False)
    match_status = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ... (기존 User 모델 등 유지) ...

# 🚀 댓글 테이블 추가
class Comment(Base):
    __tablename__ = "COMMUNITY_COMMENTS"

    comment_id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, index=True)
    user_id = Column(Integer, index=True)
    content = Column(String(500))
    # 👇 여기가 핵심입니다! 파이썬 에러가 나지 않는 완벽한 방법
    created_at = Column(DateTime, default=func.now())


class ApplianceSetting(Base):
    __tablename__ = "APPLIANCE_SETTINGS"

    setting_id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    analysis_id = Column(BigInteger, nullable=True)
    user_id = Column(BigInteger, nullable=True, index=True)
    appliance_name = Column(String(50), nullable=False)
    control_command = Column(Text, nullable=False)
    execution_status = Column(String(20), nullable=False, default="OFF")
