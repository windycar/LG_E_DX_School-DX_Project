from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str
    baby_nickname: Optional[str] = None
    start_date: Optional[str] = None
    input_connection_code: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str

class PostCreate(BaseModel):
    user_id: int
    pregnancy_period: str
    title: str
    content: str
# schemas.py 맨 아래에 추가

class SmallTalkSubmit(BaseModel):
    user_id: int
    topic_id: int
    answer_content: str


class ProfileUpdate(BaseModel):
    name: str
    baby_nickname: str | None = None

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

class EmotionRequest(BaseModel):
    text: str

class DiaryLogCreate(BaseModel):
    user_id: int
    selected_emotion: str
    diary_content: str
    detected_emotion: Optional[str] = None  # AI 분석 결과 (없을 수도 있으므로 Optional)



class ApplianceSettingUpsert(BaseModel):
    user_id: Optional[int] = None
    appliance_name: str
    control_command: str
    execution_status: str
    analysis_id: Optional[int] = None


class ApplianceSettingsBulkUpsert(BaseModel):
    user_id: Optional[int] = None
    settings: list[ApplianceSettingUpsert]
