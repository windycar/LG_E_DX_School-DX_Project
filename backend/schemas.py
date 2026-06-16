from pydantic import BaseModel, Field
from typing import Optional
from datetime import date

# =====================================================================
# 🔐 1. Auth & User Profile (계정 및 프로필)
# =====================================================================
class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    nickname: Optional[str] = None
    role: str
    baby_nickname: Optional[str] = None
    start_date: Optional[str] = None
    input_connection_code: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class ProfileUpdate(BaseModel):
    name: str
    nickname: Optional[str] = None
    baby_nickname: Optional[str] = None
    baby_gender: Optional[str] = None

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str


# =====================================================================
# 💬 2. Community (커뮤니티: 게시글 및 댓글)
# =====================================================================
class PostCreate(BaseModel):
    user_id: int
    pregnancy_period: str
    title: str
    content: str

class PostUpdate(BaseModel):
    user_id: int
    title: str
    content: str

class CommentCreate(BaseModel):
    user_id: int
    content: str

class CommentUpdate(BaseModel):
    user_id: int
    content: str


# =====================================================================
# 💌 3. SmallTalk (부부 스몰토크)
# =====================================================================
class SmallTalkSubmit(BaseModel):
    user_id: int
    topic_id: int
    answer_content: str


# =====================================================================
# 📖 4. Diary & AI Emotion (다이어리 및 AI 감정 분석)
# =====================================================================
class EmotionRequest(BaseModel):
    text: str

class DiaryLogCreate(BaseModel):
    user_id: int
    selected_emotion: str
    diary_content: str
    detected_emotion: Optional[str] = None  # AI 분석 결과 (없을 수도 있으므로 Optional)


# =====================================================================
# 🏠 5. Smart Home (가전 제어 및 AI 추천)
# =====================================================================
class ApplianceSettingUpsert(BaseModel):
    user_id: Optional[int] = None
    appliance_name: str
    control_command: str
    execution_status: str

class ApplianceSettingsBulkUpsert(BaseModel):
    user_id: int
    settings: list[ApplianceSettingUpsert]

class ArduinoConnectRequest(BaseModel):
    port: Optional[str] = None
    baudrate: int = 9600

class ArduinoSyncRequest(BaseModel):
    settings: list[ApplianceSettingUpsert]


# =====================================================================
# 🛡️ 6. Guardian (보호자 미션 및 상태 체크)
# =====================================================================
class UserCarePreferenceUpsert(BaseModel):
    preferred_mission_type: Optional[str] = "balanced"
    notification_enabled: Optional[bool] = True
    mission_time: Optional[str] = None
    care_style: Optional[str] = "warm"

class PregnancyStatusCheckCreate(BaseModel):
    user_id: int
    symptoms: list[str] = Field(default_factory=list)
    emotions: list[str] = Field(default_factory=list)


# =====================================================================
# 📅 7. Calendar (공유 캘린더)
# =====================================================================
class EventCreate(BaseModel):
    connection_code: str
    event_type: str
    title: str
    content: str
    event_date: date

class EventUpdate(BaseModel):
    event_type: str
    title: str
    content: str
    event_date: date
