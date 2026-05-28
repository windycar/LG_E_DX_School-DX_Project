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