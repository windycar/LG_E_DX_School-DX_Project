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
# 설정 만들기

# main.py 아래쪽에 추가

# 1. 프로필 수정 API
@app.put("/api/user/profile/{user_id}")
def update_profile(user_id: int, profile: schemas.ProfileUpdate, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    
    user.name = profile.name
    user.baby_nickname = profile.baby_nickname
    db.commit()
    return {"status": "Success", "message": "프로필이 수정되었습니다."}

# 2. 비밀번호 변경 API
@app.put("/api/user/password/{user_id}")
def update_password(user_id: int, passwords: schemas.PasswordUpdate, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    
    if user.password != passwords.current_password:
        raise HTTPException(status_code=400, detail="현재 비밀번호가 일치하지 않습니다.")
        
    user.password = passwords.new_password
    db.commit()
    return {"status": "Success", "message": "비밀번호가 변경되었습니다."}


# 🚀 1. 특정 게시글의 댓글 불러오기 API (작성자 ID 추가)
class CommentCreate(BaseModel):
    user_id: int
    content: str

# 🚀 1. 댓글 불러오기 API
@app.get("/api/posts/{post_id}/comments")
def get_comments(post_id: int, db: Session = Depends(database.get_db)):
    comments = db.query(models.Comment).filter(models.Comment.post_id == post_id).order_by(models.Comment.created_at.asc()).all()
    
    result = []
    for c in comments:
        user = db.query(models.User).filter(models.User.id == c.user_id).first()
        result.append({
            "id": c.comment_id, # 🚀 프론트엔드로 보낼 땐 c.comment_id 값을 꺼내서 보냅니다!
            "user_id": c.user_id,
            "content": c.content,
            "created_at": c.created_at,
            "author_name": user.name if user else "알 수 없는 유저", 
            "author_role": user.role if user else "",
            "pregnancy_start_date": str(user.pregnancy_start_date) if user and user.pregnancy_start_date else None
        })
    return {"status": "Success", "comments": result}

# 🚀 2. 댓글 등록 API
@app.post("/api/posts/{post_id}/comments")
def create_comment(post_id: int, comment: CommentCreate, db: Session = Depends(database.get_db)):
    new_comment = models.Comment(
        post_id=post_id,
        user_id=comment.user_id,
        content=comment.content,
        created_at=datetime.now()
    )
    db.add(new_comment)
    db.commit()
    return {"status": "Success", "message": "댓글이 등록되었습니다."}

# 🚀 3. 댓글 삭제 API
@app.delete("/api/comments/{comment_id}")
def delete_comment(comment_id: int, user_id: int, db: Session = Depends(database.get_db)):
    # 🚀 삭제할 때도 comment_id로 찾습니다!
    comment = db.query(models.Comment).filter(models.Comment.comment_id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")
    
    if comment.user_id != user_id:
        raise HTTPException(status_code=403, detail="본인의 댓글만 삭제할 수 있습니다.")
        
    db.delete(comment)
    db.commit()
    return {"status": "Success", "message": "댓글이 삭제되었습니다."}



# 스몰토크 가져오기
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
    
# 스몰토크 답변 저장
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















# 🚀 1. 커뮤니티 게시글 목록 불러오기 (USERS 테이블과 JOIN하여 진짜 이름/역할 연동)
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

# 🚀 1. 기존 로그인 API를 이걸로 덮어쓰십시오!
@app.post("/api/auth/login")
def login(request: schemas.LoginRequest, db: Session = Depends(database.get_db)):
    # 1. 사용자 인증
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user or user.password != request.password:
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 틀렸습니다.")
    
    # 2. 보호자(GUARDIAN)일 경우 연결된 임산부 정보(parent) 조회
    pregnant_info = None
    if user.role == "GUARDIAN" and user.parent_user_id:
        parent = db.query(models.User).filter(models.User.id == user.parent_user_id).first()
        if parent:
            pregnant_info = {
                "name": parent.name,
                "baby_nickname": parent.baby_nickname,
                "pregnancy_start_date": str(parent.pregnancy_start_date) if parent.pregnancy_start_date else None,
                "connection_code": parent.connection_code
            }
    
    # 3. 프론트엔드로 전달할 최종 데이터 구성
    return {
        "status": "Success",
        "user": {
            "user_id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "baby_nickname": user.baby_nickname,
            # 🚀 바로 이 부분! 임산부의 임신 시작일을 프론트로 보냅니다.
            "pregnancy_start_date": str(user.pregnancy_start_date) if user.pregnancy_start_date else None,
            "connection_code": user.connection_code,
            "parent_user_id": user.parent_user_id,
            "connected_pregnant": pregnant_info
        }
    }
    # 1. 사용자 인증
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user or user.password != request.password:
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 틀렸습니다.")
    
    # 2. 보호자(GUARDIAN)일 경우, 연결된 임산부 정보(parent) 조회
    pregnant_info = None
    if user.role == "GUARDIAN" and user.parent_user_id:
        pregnant_user = db.query(models.User).filter(models.User.id == user.parent_user_id).first()
        if pregnant_user:
            pregnant_info = {
                "name": pregnant_user.name,
                "baby_nickname": pregnant_user.baby_nickname,
                "pregnancy_start_date": str(pregnant_user.pregnancy_start_date),
                "connection_code": pregnant_user.connection_code # 🚀 보호자에게 임산부의 연결 코드를 명확히 전달
            }
    
    # 3. 프론트엔드로 전달할 최종 데이터 구성
    return {
        "status": "Success",
        "user": {
            "user_id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "baby_nickname": user.baby_nickname,
            "connection_code": user.connection_code, # 🚀 임산부 본인의 연결 코드 전달
            "parent_user_id": user.parent_user_id,
            "connected_pregnant": pregnant_info
        }
    }
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user or user.password != request.password:
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 틀렸습니다.")
    
    pregnant_info = None
    if user.role == "GUARDIAN" and user.parent_user_id:
        pregnant_user = db.query(models.User).filter(models.User.id == user.parent_user_id).first()
        if pregnant_user:
            pregnant_info = {
                "name": pregnant_user.name,
                "baby_nickname": pregnant_user.baby_nickname,
                "pregnancy_start_date": str(pregnant_user.pregnancy_start_date),
                "connection_code": pregnant_user.connection_code # 🚀 보호자를 위해 임산부의 연결 코드도 전달!
            }
    
    return {
        "status": "Success",
        "user": {
            "user_id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "baby_nickname": user.baby_nickname,
            "connection_code": user.connection_code,
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
        parent_user_id = pregnant_user.id # 🚀 수정: .id 대신 .user_id

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




# 🚀 설정창 & 메인화면 전용 데이터 불러오기 API (주차 계산용 데이터 추가됨!)
@app.get("/api/user/info/{identifier}")
def get_user_info(identifier: str, db: Session = Depends(database.get_db)):
    # identifier가 숫자(ID)인지 문자열(이메일)인지 판별하여 검색
    if identifier.isdigit():
        user = db.query(models.User).filter(models.User.id == int(identifier)).first()
    else:
        user = db.query(models.User).filter(models.User.email == identifier).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    partner_code = None
    pregnant_start_date = str(user.pregnancy_start_date) if user.pregnancy_start_date else None
    connected_name = None

    if user.role == "GUARDIAN" and user.parent_user_id:
        parent = db.query(models.User).filter(models.User.id == user.parent_user_id).first()
        if parent:
            partner_code = parent.connection_code
            pregnant_start_date = str(parent.pregnancy_start_date) if parent.pregnancy_start_date else None
            connected_name = parent.name

    return {
        "status": "Success",
        "user_id": user.id, # 🚀 회원가입 직후 동기화를 위해 고유 ID도 함께 반환합니다.
        "name": user.name,
        "baby_nickname": user.baby_nickname,
        "connection_code": user.connection_code,
        "partner_code": partner_code,
        "pregnancy_start_date": pregnant_start_date,
        "connected_name": connected_name
    }
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    partner_code = None
    # 🚀 임산부 본인의 시작일
    pregnant_start_date = str(user.pregnancy_start_date) if user.pregnancy_start_date else None
    connected_name = None

    # 🚀 보호자일 경우, 아내의 시작일과 이름을 가져옴
    if user.role == "GUARDIAN" and user.parent_user_id:
        parent = db.query(models.User).filter(models.User.id == user.parent_user_id).first()
        if parent:
            partner_code = parent.connection_code
            pregnant_start_date = str(parent.pregnancy_start_date) if parent.pregnancy_start_date else None
            connected_name = parent.name

    return {
        "status": "Success",
        "name": user.name,
        "baby_nickname": user.baby_nickname,
        "connection_code": user.connection_code,
        "partner_code": partner_code,
        "pregnancy_start_date": pregnant_start_date, # 🚀 추가됨!
        "connected_name": connected_name             # 🚀 추가됨!
    }
