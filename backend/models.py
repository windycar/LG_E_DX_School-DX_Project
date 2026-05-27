from sqlalchemy import Column, Integer, String, Date
from database import Base

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
    
    # 🚀 이 부분이 빠져있어서 에러가 났던 것입니다! 추가하십시오.
    parent_user_id = Column(Integer, nullable=True)