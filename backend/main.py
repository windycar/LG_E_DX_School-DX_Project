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
import smalltalk_service
# 2. CORS 정책 설정 (이게 있어야 브라우저가 통신을 허용합니다)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 모든 도메인에서의 접속을 허용
    allow_credentials=True,
    allow_methods=["*"], # 모든 통신 방식 허용
    allow_headers=["*"], # 모든 헤더 허용
)
# backend/main.py


# main.py 아래쪽에 추가

@app.get("/api/smalltalk/{user_id}")
def get_smalltalk(user_id: int, db: Session = Depends(database.get_db)):
    # 1. 내 정보 가져오기 (컬럼명 user_id, 객체 속성 id)
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    
    # 2. 파트너 정보 가져오기
    partner = None
    if user.parent_user_id:
        partner = db.query(models.User).filter(models.User.id == user.parent_user_id).first()
    else:
        partner = db.query(models.User).filter(models.User.parent_user_id == user.id).first()

    # 3. 질문 선정
    today_topic = smalltalk_service.get_today_topic(db)
    
    # 4. 내/파트너 답변 가져오기
    my_answer_obj = db.query(models.SmallTalkAnswer).filter(
        models.SmallTalkAnswer.topic_id == today_topic.topic_id,
        models.SmallTalkAnswer.user_id == user.id
    ).first()

    partner_answer_obj = None
    if partner:
        partner_answer_obj = db.query(models.SmallTalkAnswer).filter(
            models.SmallTalkAnswer.topic_id == today_topic.topic_id,
            models.SmallTalkAnswer.user_id == partner.id # 🚀 .id로 통일
        ).first()

    return {
        "status": "Success",
        "topic": {"topic_id": today_topic.topic_id, "question_text": today_topic.question_text},
        "my_answer": my_answer_obj.answer_content if my_answer_obj else None,
        "partner_name": partner.name if partner else "파트너",
        "is_partner_answered": bool(partner_answer_obj),
        "partner_answer": partner_answer_obj.answer_content if (my_answer_obj and partner_answer_obj) else None
    }
    

@app.post("/api/smalltalk/answer")
def submit_smalltalk_answer(ans: schemas.SmallTalkSubmit, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == ans.user_id).first()
    conn_code = user.connection_code if user.connection_code else "DEMO_CODE"
    
    new_ans = models.SmallTalkAnswer(
        topic_id=ans.topic_id,
        user_id=ans.user_id,
        connection_code=conn_code,
        answer_content=ans.answer_content
    )
    db.add(new_ans)
    db.commit()
    return {"status": "Success"}























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
class PostCreate(BaseModel):
    user_id: int
    pregnancy_period: str
    title: str
    content: str

# 🚀 2. 새 게시글 작성하기 (schemas.PostCreate 규격 사용)
@app.post("/api/community/posts")
def create_community_post(post: PostCreate, db: Session = Depends(database.get_db)):
    # ERD 기준: 테이블명 COMMUNITY_POSTS
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
    
    pregnant_info = None
    if user.role == "GUARDIAN" and user.parent_user_id:
        # 여기서는 user.parent_user_id가 바로 임산부의 id임
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
            "user_id": user.id, # 🚀 코드에서는 무조건 .id로 접근!
            "name": user.name,
            "role": user.role,
            "parent_user_id": user.parent_user_id,
            "connected_pregnant": pregnant_info
        }
    }
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user or user.password != request.password:
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 틀렸습니다.")
    
    pregnant_info = None
    # 🚀 수정: .id 가 아니라 .user_id
    if user.role == "GUARDIAN" and user.parent_user_id:
        pregnant_user = db.query(models.User).filter(models.User.user_id == user.parent_user_id).first()
        if pregnant_user:
            pregnant_info = {
                "name": pregnant_user.name,
                "baby_nickname": pregnant_user.baby_nickname,
                "pregnancy_start_date": str(pregnant_user.pregnancy_start_date)
            }
    
    return {
        "status": "Success",
        "user": {
            "user_id": user.user_id, # 🚀 수정: .id 가 아니라 .user_id
            "name": user.name,
            "role": user.role,
            "parent_user_id": user.parent_user_id,
            "connected_pregnant": pregnant_info
        }
    }
    
    
# 회원가입 API
@app.post("/api/auth/register")
def register_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    parent_user_id = None # 기본값 설정
    if user.role == "PREGNANT":
        while True:
            new_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            if not db.query(models.User).filter(models.User.connection_code == new_code).first():
                connection_code = new_code
                break
    else: 
        connection_code = None
        pregnant_user = db.query(models.User).filter(models.User.connection_code == user.input_connection_code).first()
        if not pregnant_user:
            raise HTTPException(status_code=400, detail="유효하지 않은 인증코드입니다.")
        parent_user_id = pregnant_user.user_id # 🚀 수정: .id 대신 .user_id

    new_user = models.User(
        email=user.email,
        password=user.password,
        name=user.name,
        role=user.role,
        baby_nickname=user.baby_nickname,
        pregnancy_start_date=datetime.strptime(user.start_date, "%Y-%m-%d").date() if user.start_date else None,
        connection_code=connection_code,
        parent_user_id=parent_user_id
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


