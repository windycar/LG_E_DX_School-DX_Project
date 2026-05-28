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
from database import get_db
from pydantic import BaseModel
# 2. CORS 정책 설정 (이게 있어야 브라우저가 통신을 허용합니다)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 모든 도메인 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# backend/main.py

# 🚀 1. 게시글 목록 불러오기 (USERS 테이블과 JOIN하여 진짜 이름/역할 연동)
@app.get("/api/community/posts")
def get_community_posts(db: Session = Depends(database.get_db)):
    # COMMUNITY_POSTS와 USERS 테이블을 작성자 ID(user_id) 기준으로 조인합니다.
    results = db.query(models.CommunityPost, models.User)\
                .join(models.User, models.CommunityPost.user_id == models.User.id)\
                .order_by(models.CommunityPost.created_at.desc()).all()
    
    posts_list = []
    for post, user in results:
        posts_list.append({
            "id": post.post_id,
            "user_id": post.user_id,
            "period": post.pregnancy_period,
            "title": post.title,
            "content": post.content,
            "created_at": post.created_at,
            # 🚀 데베 USERS 테이블에서 실시간으로 가져온 진짜 회원 정보 연동!
            "role": "pregnant" if user.role == "PREGNANT" else "guardian", 
            "author": user.name, # 유저 테이블의 진짜 이름
            "avatar": "🤰" if user.role == "PREGNANT" else "👨",
            "likes": 0,
            "comments": 0
        })
    return {"status": "Success", "posts": posts_list}


# 🚀 2. 새 게시글 작성하기 (schemas.PostCreate 규격 사용)
@app.post("/api/community/posts")
def create_community_post(post: schemas.PostCreate, db: Session = Depends(database.get_db)):
    # schemas.py에 정의한 규격을 그대로 사용하여 안전하게 DB에 인서트합니다.
    new_post = models.CommunityPost(
        user_id=post.user_id,
        pregnancy_period=post.pregnancy_period,
        title=post.title,
        content=post.content
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return {"status": "Success", "post": new_post}
# main.py 의 게시글 작성(post) 코드 아래에 추가하십시오.
# 삭제버튼을 허용하는 게시글 삭제 코드
@app.delete("/api/community/posts/{post_id}")
def delete_community_post(post_id: int, db: Session = Depends(database.get_db)):
    # DB에서 해당 ID의 게시글을 찾습니다
    post = db.query(models.CommunityPost).filter(models.CommunityPost.post_id == post_id).first()
    
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    
    # 찾았으면 삭제합니다
    db.delete(post)
    db.commit()
    return {"status": "Success", "message": "게시글이 삭제되었습니다."}





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


