from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import models, schemas, database
from fastapi.middleware.cors import CORSMiddleware
import schemas
app = FastAPI()
# backend/main.py
from fastapi.middleware.cors import CORSMiddleware # 1. 필수 import
import random
import string


# 2. CORS 정책 설정 (이게 있어야 브라우저가 통신을 허용합니다)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 모든 도메인 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# backend/main.py











# 로그인 기능 
# backend/main.py

@app.post("/api/auth/login")
def login(request: schemas.LoginRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    
    if not user or user.password != request.password:
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 틀렸습니다.")
    
    # 🚀 연동된 임산부 정보 조회 (보호자인 경우)
    pregnant_info = None
    if user.role == "GUARDIAN" and user.parent_user_id:
        pregnant_user = db.query(models.User).filter(models.User.id == user.parent_user_id).first()
        if pregnant_user:
            pregnant_info = {
                "name": pregnant_user.name,
                "baby_nickname": pregnant_user.baby_nickname,
                "pregnancy_start_date": str(pregnant_user.pregnancy_start_date)
            }
    
    return {
        "status": "Success",
        "user": {
            "user_id": user.id,
            "name": user.name,
            "role": user.role,
            "parent_user_id": user.parent_user_id,
            "connected_pregnant": pregnant_info # 🚀 실제 연동된 임산부 정보 포함
        }
    }
# 회원가입 API
@app.post("/api/auth/register")
def register_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    # 1. 임산부인 경우
    if user.role == "PREGNANT":
        while True:
            # 1. 랜덤 코드 생성
            new_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            
            # 2. DB에 이미 존재하는지 확인
            existing_user = db.query(models.User).filter(models.User.connection_code == new_code).first()
            
            # 3. 중복이 없으면 루프 탈출
            if not existing_user:
                connection_code = new_code
                break
    
    # 2. 보호자인 경우 (인증 코드 검증)
    else: 
        connection_code = None
        pregnant_user = db.query(models.User).filter(models.User.connection_code == user.input_connection_code).first()
        if not pregnant_user:
            raise HTTPException(status_code=400, detail="유효하지 않은 인증코드입니다.")
        
        # 🚀 수정: .user_id 대신 .id 를 사용하십시오. 
        # (models.py에서 id = Column("user_id", ...) 라고 정의했으므로 
        # 파이썬 객체는 여전히 id라는 이름으로 이 값을 가집니다.)
        parent_user_id = pregnant_user.id

    # 3. 유저 저장
    new_user = models.User(
        email=user.email,
        password=user.password,
        name=user.name,
        role=user.role,
        baby_nickname=user.baby_nickname,
        pregnancy_start_date=datetime.strptime(user.start_date, "%Y-%m-%d").date() if user.start_date else None,
        connection_code=connection_code,
        parent_user_id=parent_user_id # 🚀 연결 완료!
    )
    
    db.add(new_user)
    db.commit()
    return {"status": "Success", "connection_code": connection_code}

# 현재 주차 계산 API (필요할 때 호출)
@app.get("/api/user/pregnancy-week/{user_id}")
def get_week(user_id: int, db: Session = Depends(database.get_db)):


    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or not user.pregnancy_start_date:
        return {"week": 0}
    
    # 오늘 날짜 - 시작 날짜 = 지난 일수
    delta = datetime.now().date() - user.pregnancy_start_date
    current_week = (delta.days // 7) + 1 # 1주차부터 시작
    return {"week": current_week}


