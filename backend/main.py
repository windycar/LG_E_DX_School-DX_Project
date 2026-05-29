import os
import sys
import json
import shutil
import random
import string
import requests
import importlib
from datetime import datetime, date

from fastapi import FastAPI, Depends, HTTPException, Form, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from dotenv import load_dotenv

import models
import schemas
import database
import smalltalk_service

# =====================================================================
# 🛠️ 1. 초기 설정 (DB, CORS, 정적 파일)
# =====================================================================
load_dotenv()
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# =====================================================================
# 🤖 2. AI 감정 분석 모델 적재
# =====================================================================
print("🚀 AI 감정 분석 모델을 메모리에 적재 중입니다...")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)

possible_paths = [
    os.path.join(ROOT_DIR, "Project", "diary_emotion_ai", "scripts"),
    os.path.join(ROOT_DIR, "diary_emotion_ai", "scripts")
]

ai_scripts_path = None
for p in possible_paths:
    if os.path.exists(p):
        ai_scripts_path = p
        break

if ai_scripts_path:
    if ai_scripts_path not in sys.path:
        sys.path.append(ai_scripts_path)
    try:
        diary_ai = importlib.import_module("03_predict_diary_emotion")
        AI_MODEL = json.loads(diary_ai.MODEL_PATH.read_text(encoding="utf-8"))
        print("✅ AI 모델 적재 완료! (추론 대기 상태)")
    except Exception as e:
        print(f"❌ AI 모델 로드 실패: {e}")
else:
    print(f"❌ AI 스크립트 경로를 찾지 못했습니다. (현재 검색 경로: {possible_paths})")


# =====================================================================
# 📦 3. 데이터 검증용 스키마 (Pydantic Models)
# =====================================================================
class CommentCreate(BaseModel):
    user_id: int
    content: str

class EmotionRequest(BaseModel):
    text: str

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

class PostCreate(BaseModel):
    user_id: int
    pregnancy_period: str
    title: str
    content: str


# =====================================================================
# 🔐 4. 계정 및 프로필 API
# =====================================================================
@app.post("/api/auth/register")
def register_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    parent_user_id = None
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
        parent_user_id = pregnant_user.id

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

@app.post("/api/auth/login")
def login(request: schemas.LoginRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user or user.password != request.password:
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 틀렸습니다.")
    
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
    
    return {
        "status": "Success",
        "user": {
            "user_id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "baby_nickname": user.baby_nickname,
            "pregnancy_start_date": str(user.pregnancy_start_date) if user.pregnancy_start_date else None,
            "connection_code": user.connection_code,
            "parent_user_id": user.parent_user_id,
            "connected_pregnant": pregnant_info
        }
    }

@app.get("/api/user/info/{identifier}")
def get_user_info(identifier: str, db: Session = Depends(database.get_db)):
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
        "user_id": user.id,
        "name": user.name,
        "baby_nickname": user.baby_nickname,
        "connection_code": user.connection_code,
        "partner_code": partner_code,
        "pregnancy_start_date": pregnant_start_date,
        "connected_name": connected_name
    }

@app.put("/api/user/profile/{user_id}")
def update_profile(user_id: int, profile: schemas.ProfileUpdate, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    user.name = profile.name
    user.baby_nickname = profile.baby_nickname
    db.commit()
    return {"status": "Success", "message": "프로필이 수정되었습니다."}

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


# =====================================================================
# 🏠 5. 스마트홈(가전 제어) API (🚀 찐 DB 연동 완료!)
# =====================================================================
@app.post("/api/appliances/bulk")
def update_appliances_bulk(payload: schemas.ApplianceSettingsBulkUpsert, db: Session = Depends(database.get_db)):
    try:
        # 프론트가 보낸 여러 개의 가전 설정을 하나씩 꺼내어 DB에 저장합니다.
        for item in payload.settings:
            # 1. 이미 저장된 설정이 있는지 DB에서 찾기
            setting = db.query(models.ApplianceSetting).filter(
                models.ApplianceSetting.user_id == payload.user_id,
                models.ApplianceSetting.appliance_name == item.appliance_name
            ).first()

            if setting:
                # 2. 있으면 새 값으로 덮어쓰기 (Update)
                setting.control_command = item.control_command
                setting.execution_status = item.execution_status
            else:
                # 3. 없으면 새로 만들어 넣기 (Insert)
                new_setting = models.ApplianceSetting(
                    user_id=payload.user_id,
                    appliance_name=item.appliance_name,
                    control_command=item.control_command,
                    execution_status=item.execution_status
                )
                db.add(new_setting)
        
        db.commit()
        return {"status": "Success", "message": "가전 설정이 DB에 완벽하게 저장되었습니다!"}
    except Exception as e:
        db.rollback()
        print(f"🚨 가전 설정 저장 에러: {str(e)}")
        return {"status": "Error", "message": str(e)}

@app.get("/api/appliances/{user_id}")
def get_user_appliances(user_id: int, db: Session = Depends(database.get_db)):
    try:
        # DB에서 해당 유저의 가전 설정을 모두 불러옵니다.
        settings = db.query(models.ApplianceSetting).filter(models.ApplianceSetting.user_id == user_id).all()
        
        result = []
        for s in settings:
            result.append({
                "appliance_name": s.appliance_name,
                "control_command": s.control_command,
                "execution_status": s.execution_status
            })
            
        return {"status": "Success", "settings": result}
    except Exception as e:
        return {"status": "Error", "message": str(e)}


# =====================================================================
# 📖 6. 다이어리 & AI 감정 분석 API
# =====================================================================
@app.post("/api/ai/emotion")
def analyze_diary_emotion(req: EmotionRequest):
    if not req.text.strip():
        return {"status": "Error", "message": "텍스트가 없습니다."}
    try:
        prediction, probabilities = diary_ai.predict(AI_MODEL, req.text)
        emoji_map = {
            "행복": "😊", "안정": "🙂", "설렘": "🥰", "중립": "😐",
            "불안": "😟", "피로": "😫", "우울": "😔", "화남": "😡"
        }
        return {"status": "Success", "emotion_label": prediction, "emoji": emoji_map.get(prediction, "😐")}
    except Exception as e:
        return {"status": "Error", "message": "AI 오류가 발생했습니다."}

@app.post("/api/diary/logs")
def create_diary_log(
    user_id: int = Form(...),
    selected_emotion: str = Form(...),
    diary_content: str = Form(...),
    detected_emotion: str = Form(None),
    image: UploadFile = File(None),
    date: str = Form(None),
    db: Session = Depends(database.get_db)
):
    try:
        saved_image_path = None
        if image:
            saved_image_path = f"uploads/{image.filename}"
            with open(saved_image_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)

        WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
        weather_desc = "알 수 없음"
        if WEATHER_API_KEY:
            res = requests.get(f"http://api.openweathermap.org/data/2.5/weather?q=Seoul&appid={WEATHER_API_KEY}&lang=kr")
            if res.status_code == 200:
                weather_desc = res.json()['weather'][0]['description']

        reverse_emoji_map = {"😊": "행복", "🙂": "안정", "🥰": "설렘", "😐": "중립", "😟": "불안", "😫": "피로", "😔": "우울", "😡": "화남"}
        db_emotion_text = reverse_emoji_map.get(selected_emotion, selected_emotion)

        dummy_temperature = round(random.uniform(21.0, 26.0), 1)
        dummy_humidity = round(random.uniform(40.0, 60.0), 1)
        
        new_diary = models.DiaryLog(
            user_id=user_id,
            selected_emotion=db_emotion_text,
            diary_content=diary_content,
            image_path=saved_image_path,
            temperature_ambient=dummy_temperature,
            humidity_ambient=dummy_humidity,
            weather_ambient=weather_desc           
        )
        if date:
            new_diary.recorded_at = datetime.strptime(date, "%Y-%m-%d")

        db.add(new_diary)
        db.flush()

        if detected_emotion:
            new_analysis = models.AiAnalysisResult(diary_id=new_diary.diary_id, detected_emotion=detected_emotion)
            db.add(new_analysis)

        db.commit()
        return {"status": "Success", "message": "성공적으로 저장되었습니다."}
    except Exception as e:
        db.rollback() 
        return {"status": "Error", "message": str(e)}

@app.get("/api/diary/logs/{user_id}")
def get_diary_logs(user_id: int, db: Session = Depends(database.get_db)):
    try:
        logs = db.query(models.DiaryLog).filter(models.DiaryLog.user_id == user_id).order_by(models.DiaryLog.recorded_at.desc()).all()
        keyword_to_emoji = {"행복": "😊", "안정": "🙂", "설렘": "🥰", "중립": "😐", "불안": "😟", "피로": "😫", "우울": "😔", "화남": "😡"}
        result = []
        for log in logs:
            date_str = str(log.recorded_at).split(" ")[0] if log.recorded_at else "2026-05-26"
            img_list = [f"http://localhost:8000/{log.image_path}"] if log.image_path else []
            display_mood = keyword_to_emoji.get(log.selected_emotion, "😐")
            result.append({
                "id": log.diary_id,
                "date": date_str,
                "mood": display_mood,
                "content": log.diary_content,
                "images": img_list,
                "type": "daily" 
            })
        return {"status": "Success", "entries": result}
    except Exception as e:
        return {"status": "Error", "message": str(e)}


# =====================================================================
# 💬 7. 커뮤니티 API (게시글 & 댓글)
# =====================================================================
@app.get("/api/community/posts")
def get_community_posts(db: Session = Depends(database.get_db)):
    try:
        results = db.query(
            models.CommunityPost,
            models.User.name,
            models.User.role,
            models.User.pregnancy_start_date,
            func.count(models.CommunityComment.comment_id).label("comment_count")
        ).outerjoin(
            models.User, models.CommunityPost.user_id == models.User.id
        ).outerjoin(
            models.CommunityComment, models.CommunityPost.post_id == models.CommunityComment.post_id
        ).group_by(models.CommunityPost.post_id, models.User.id).order_by(models.CommunityPost.created_at.desc()).all()
        
        posts = []
        for post, user_name, user_role, preg_date, count in results:
            posts.append({
                "post_id": post.post_id,
                "user_id": post.user_id,
                "pregnancy_period": post.pregnancy_period,
                "title": post.title,
                "content": post.content,
                "created_at": post.created_at,
                "author": user_name or "익명",
                "role": user_role,
                "comment_count": count
            })
        return {"status": "Success", "posts": posts}
    except Exception as e:
        return {"status": "Error", "message": str(e)}

@app.post("/api/community/posts")
def create_community_post(post: PostCreate, db: Session = Depends(database.get_db)):
    new_post = models.CommunityPost(
        user_id=post.user_id,
        pregnancy_period=post.pregnancy_period,
        title=post.title,
        content=post.content
    )
    db.add(new_post)
    db.commit()
    return {"status": "Success"}

@app.delete("/api/community/posts/{post_id}")
def delete_community_post(post_id: int, db: Session = Depends(database.get_db)):
    post = db.query(models.CommunityPost).filter(models.CommunityPost.post_id == post_id).first()
    if not post: raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    db.delete(post)
    db.commit()
    return {"status": "Success"}

@app.get("/api/posts/{post_id}/comments")
def get_post_comments(post_id: int, db: Session = Depends(database.get_db)):
    try:
        comments = db.query(
            models.CommunityComment, models.User.name, models.User.role, models.User.pregnancy_start_date
        ).outerjoin(
            models.User, models.CommunityComment.user_id == models.User.id
        ).filter(models.CommunityComment.post_id == post_id).order_by(models.CommunityComment.created_at.asc()).all()

        result = []
        for c, user_name, user_role, start_date in comments:
            result.append({
                "id": c.comment_id,
                "user_id": c.user_id,
                "content": c.content,
                "created_at": c.created_at,
                "author_name": user_name or "익명",
                "author_role": user_role,
                "pregnancy_start_date": str(start_date) if start_date else None
            })
        return {"status": "Success", "comments": result}
    except Exception as e:
        return {"status": "Error", "message": str(e)}

@app.post("/api/posts/{post_id}/comments")
def create_post_comment(post_id: int, comment_data: CommentCreate, db: Session = Depends(database.get_db)):
    try:
        new_comment = models.CommunityComment(
            post_id=post_id,
            user_id=comment_data.user_id,
            content=comment_data.content
        )
        db.add(new_comment)
        db.commit()
        return {"status": "Success"}
    except Exception as e:
        db.rollback()
        return {"status": "Error", "message": str(e)}

@app.delete("/api/comments/{comment_id}")
def delete_comment(comment_id: int, user_id: int, db: Session = Depends(database.get_db)):
    comment = db.query(models.CommunityComment).filter(models.CommunityComment.comment_id == comment_id).first()
    if not comment: raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")
    if comment.user_id != user_id: raise HTTPException(status_code=403, detail="권한이 없습니다.")
    db.delete(comment)
    db.commit()
    return {"status": "Success"}


# =====================================================================
# 📊 8. 마이페이지 (내 활동 내역) API
# =====================================================================
@app.get("/api/community/posts/count/{user_id}")
def get_community_posts_count(user_id: int, db: Session = Depends(database.get_db)):
    count = db.query(models.CommunityPost).filter(models.CommunityPost.user_id == user_id).count()
    return {"status": "Success", "count": count}

@app.get("/api/community/comments/count/{user_id}")
def get_community_comments_count(user_id: int, db: Session = Depends(database.get_db)):
    count = db.query(models.CommunityComment).filter(models.CommunityComment.user_id == user_id).count()
    return {"status": "Success", "count": count}

@app.get("/api/community/my-posts/{user_id}")
def get_my_posts(user_id: int, db: Session = Depends(database.get_db)):
    try:
        results = db.query(
            models.CommunityPost, models.User.name.label("author_name"), models.User.role.label("author_role"), func.count(models.CommunityComment.comment_id).label("comment_count")
        ).outerjoin(models.User, models.CommunityPost.user_id == models.User.id)\
         .outerjoin(models.CommunityComment, models.CommunityPost.post_id == models.CommunityComment.post_id)\
         .filter(models.CommunityPost.user_id == user_id)\
         .group_by(models.CommunityPost.post_id, models.User.id).order_by(models.CommunityPost.created_at.desc()).all()

        posts = []
        for post, author_name, author_role, count in results:
            posts.append({
                "post_id": post.post_id, "user_id": post.user_id, "pregnancy_period": post.pregnancy_period,
                "title": post.title, "content": post.content, "created_at": post.created_at,
                "author": author_name or "익명", "role": author_role, "comment_count": count
            })
        return {"status": "Success", "posts": posts}
    except Exception as e:
        return {"status": "Error", "message": str(e)}

@app.get("/api/community/my-comments/{user_id}")
def get_my_commented_posts(user_id: int, db: Session = Depends(database.get_db)):
    try:
        subquery = db.query(models.CommunityComment.post_id).filter(models.CommunityComment.user_id == user_id).distinct().subquery()
        results = db.query(
            models.CommunityPost, models.User.name.label("author_name"), models.User.role.label("author_role"), func.count(models.CommunityComment.comment_id).label("comment_count")
        ).outerjoin(models.User, models.CommunityPost.user_id == models.User.id)\
         .outerjoin(models.CommunityComment, models.CommunityPost.post_id == models.CommunityComment.post_id)\
         .filter(models.CommunityPost.post_id.in_(subquery))\
         .group_by(models.CommunityPost.post_id, models.User.id).order_by(models.CommunityPost.created_at.desc()).all()

        posts = []
        for post, author_name, author_role, count in results:
            posts.append({
                "post_id": post.post_id, "user_id": post.user_id, "pregnancy_period": post.pregnancy_period,
                "title": post.title, "content": post.content, "created_at": post.created_at,
                "author": author_name or "익명", "role": author_role, "comment_count": count
            })
        return {"status": "Success", "comments": posts} 
    except Exception as e:
        return {"status": "Error", "message": str(e)}


# =====================================================================
# 📅 9. 캘린더 (일정 관리) API
# =====================================================================
@app.get("/api/calendar/events/{connection_code}")
def get_calendar_events(connection_code: str, db: Session = Depends(database.get_db)):
    if not connection_code or connection_code == "None":
        return {"status": "Success", "events": []}
    events = db.query(models.SharedCalendarEvent).filter(models.SharedCalendarEvent.connection_code == connection_code).all()
    result = [{"event_id": e.event_id, "event_type": e.event_type, "title": e.title, "content": e.content, "event_date": str(e.event_date)} for e in events]
    return {"status": "Success", "events": result}

@app.post("/api/calendar/events")
def create_calendar_event(event: EventCreate, db: Session = Depends(database.get_db)):
    new_event = models.SharedCalendarEvent(
        connection_code=event.connection_code, event_type=event.event_type,
        title=event.title, content=event.content, event_date=event.event_date
    )
    db.add(new_event)
    db.commit()
    return {"status": "Success"}

@app.delete("/api/calendar/events/{event_id}")
def delete_calendar_event(event_id: int, db: Session = Depends(database.get_db)):
    event = db.query(models.SharedCalendarEvent).filter(models.SharedCalendarEvent.event_id == event_id).first()
    if not event: raise HTTPException(status_code=404, detail="일정을 찾을 수 없습니다.")
    db.delete(event)
    db.commit()
    return {"status": "Success"}

@app.get("/api/calendar/checkups/{connection_code}")
def get_checkup_dates(connection_code: str, db: Session = Depends(database.get_db)):
    try:
        today = date.today()
        hospital_types = ["hospital", "ultrasound", "clinic"]
        events = db.query(models.SharedCalendarEvent).filter(
            models.SharedCalendarEvent.connection_code == connection_code,
            models.SharedCalendarEvent.event_type.in_(hospital_types)
        ).all()

        past_events = [e for e in events if e.event_date and e.event_date <= today]
        future_events = [e for e in events if e.event_date and e.event_date > today]

        recent_event = max(past_events, key=lambda x: x.event_date) if past_events else None
        next_event = min(future_events, key=lambda x: x.event_date) if future_events else None

        def format_date(d): return f"{d.year}년 {d.month}월 {d.day}일" if d else "등록된 일정 없음"

        return {
            "status": "Success",
            "recent_checkup": format_date(recent_event.event_date) if recent_event else "등록된 일정 없음",
            "next_checkup": format_date(next_event.event_date) if next_event else "등록된 일정 없음"
        }
    except Exception as e:
        return {"status": "Error", "message": str(e)}


# =====================================================================
# 💬 10. 스몰토크 API
# =====================================================================
@app.get("/api/smalltalk/{user_id}")
def get_smalltalk(user_id: int, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user: raise HTTPException(status_code=404)
    
    partner = db.query(models.User).filter(models.User.id == user.parent_user_id).first() if user.parent_user_id else db.query(models.User).filter(models.User.parent_user_id == user.id).first()
    today_topic = smalltalk_service.get_today_topic(db)
    
    my_answer_obj = db.query(models.SmallTalkAnswer).filter(models.SmallTalkAnswer.topic_id == today_topic.topic_id, models.SmallTalkAnswer.user_id == user.id).first()
    partner_answer_obj = db.query(models.SmallTalkAnswer).filter(models.SmallTalkAnswer.topic_id == today_topic.topic_id, models.SmallTalkAnswer.user_id == partner.id).first() if partner else None

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
    new_ans = models.SmallTalkAnswer(
        topic_id=ans.topic_id, user_id=ans.user_id,
        connection_code=user.connection_code if user.connection_code else "DEMO_CODE",
        answer_content=ans.answer_content
    )
    db.add(new_ans)
    db.commit()
    return {"status": "Success"}