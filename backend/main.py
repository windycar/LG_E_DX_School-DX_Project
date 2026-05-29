from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import models, schemas, database
app = FastAPI()
# backend/main.py
from fastapi.middleware.cors import CORSMiddleware # 1. 필수 import
import random
import string
from database import get_db 
from pydantic import BaseModel
import smalltalk_service
from datetime import date
import subprocess
import json
from sqlalchemy.orm import Session
import models, database, schemas
import requests # 🚀 날씨 API 호출을 위해 추가!

import os
from dotenv import load_dotenv
import os
import shutil
import subprocess
import requests
from fastapi import FastAPI, Depends, Form, File, UploadFile # 🚀 Form, File, UploadFile 추가!
from sqlalchemy.orm import Session
import models, database
import os
import sys
import importlib
import json
import shutil
import requests
from fastapi import FastAPI, Depends, Form, File, UploadFile
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import models, database, schemas
from dotenv import load_dotenv
# main.py 상단 라이브러리 임포트 영역에 아래를 추가합니다.
from fastapi.staticfiles import StaticFiles

# 앱 생성 코드(app = FastAPI()) 바로 아래에 다음 1줄을 추가하여 uploads 폴더를 웹에 개방합니다.
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

load_dotenv()
# CORS 정책 설정 (이게 있어야 브라우저가 통신을 허용합니다)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 모든 도메인에서의 접속을 허용
    allow_credentials=True,
    allow_methods=["*"], # 모든 통신 방식 허용
    allow_headers=["*"], # 모든 헤더 허용
)

os.makedirs("uploads", exist_ok=True)

# 🚀 [API 1] AI 감정 분석 (프론트에서 버튼 누를 때 실행)
# =====================================================================
print("🚀 AI 감정 분석 모델을 메모리에 적재 중입니다...")

# diary_emotion_ai/scripts 폴더를 파이썬 모듈 경로에 강제 추가
ai_scripts_path = os.path.abspath("../diary_emotion_ai/scripts")
if ai_scripts_path not in sys.path:
    sys.path.append(ai_scripts_path)

# 숫자로 시작하는 파이썬 파일을 동적으로 Import
# =====================================================================
# 🚀 [DX 혁신] AI 감정 분석 모델 In-Memory 단일 적재 (경로 자동 추적기 탑재)
# =====================================================================
print("🚀 AI 감정 분석 모델을 메모리에 적재 중입니다...")

# 현재 백엔드 폴더(main.py 위치)와 최상단 루트 폴더 계산
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)

# 마이 로드의 폴더 구조를 모두 탐색하여 AI 스크립트 폴더를 찾아냅니다!
possible_paths = [
    os.path.join(ROOT_DIR, "Project", "diary_emotion_ai", "scripts"), # 마이로드 탐색기 구조
    os.path.join(ROOT_DIR, "diary_emotion_ai", "scripts")             # 기본 예비 구조
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
    print(f"❌ AI 스크립트 경로를 찾지 못했습니다. 폴더 구조를 확인해주세요. (현재 검색 경로: {possible_paths})")

# =====================================================================

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 주소 허용 (실무에서는 ["http://localhost:5173"] 등으로 지정)
    allow_credentials=True,
    allow_methods=["*"],  # POST, GET, OPTIONS 등 모든 방식 허용
    allow_headers=["*"],  # 모든 헤더 허용
)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
os.makedirs("uploads", exist_ok=True)























class EmotionRequest(BaseModel):
    text: str
# -------------------------------------------------------------------
# 🤖 [API 1] AI 감정 분석 (In-Memory Direct Call - 응답속도 0.05초)
# -------------------------------------------------------------------
@app.post("/api/ai/emotion")
def analyze_diary_emotion(req: schemas.EmotionRequest):
    if not req.text.strip():
        return {"status": "Error", "message": "텍스트가 없습니다."}

    try:
        # 💡 subprocess 폐기! 메모리에 올라간 마이 로드의 predict 함수를 즉각 호출합니다.
        # 반환값인 prediction에는 문자열(예: "화남", "행복")이 정확히 떨어집니다.
        prediction, probabilities = diary_ai.predict(AI_MODEL, req.text)
        
        emoji_map = {
            "행복": "😊", "안정": "🙂", "설렘": "🥰", 
            "중립": "😐", "불안": "😟", "피로": "😫", 
            "우울": "😔", "화남": "😡"
        }
        
        return {
            "status": "Success", 
            "emotion_label": prediction,
            "emoji": emoji_map.get(prediction, "😐")
        }
    except Exception as e:
        print("AI 다이렉트 분석 에러:", e)
        return {"status": "Error", "message": "서버 내부 AI 엔진 오류가 발생했습니다."}
    if not req.text.strip():
        return {"status": "Error", "message": "텍스트가 없습니다."}

    try:
        # 💡 [주의] 이 경로가 백엔드 폴더(backend) 기준으로 정확해야 합니다!
        script_path = "../diary_emotion_ai/scripts/03_predict_diary_emotion.py"
        
        # 파이썬 스크립트 실행
        result = subprocess.run(
            ["python", script_path, req.text], 
            capture_output=True, text=True, encoding='utf-8'
        )
        
        output = result.stdout.strip()
        error_output = result.stderr.strip() # 에러 로그 캡처
        
        # 🔥 마이 로드, 백엔드 검은 창에 뜨는 이 로그를 반드시 확인하십시오! 🔥
        print(f"=== 🤖 AI 분석 결과 로그 ===")
        print(f"입력문장: {req.text}")
        print(f"정상출력(stdout): {output}")
        print(f"에러출력(stderr): {error_output}")
        print(f"=============================")

        predicted_label = "중립" 
        emotions = ["행복", "안정", "설렘", "중립", "불안", "피로", "우울", "화남"]
        for e in emotions:
            if e in output: # 스크립트가 뱉은 글자 중에 감정 단어가 있으면 교체!
                predicted_label = e
                break
                
        emoji_map = {"행복": "😊", "안정": "🙂", "설렘": "🥰", "중립": "😐", "불안": "😟", "피로": "😫", "우울": "😔", "화남": "😡"}
        
        return {"status": "Success", "emotion_label": predicted_label, "emoji": emoji_map.get(predicted_label, "😐")}
    except Exception as e:
        print("AI 실행 자체 에러:", e)
        return {"status": "Error", "message": str(e)}

# -------------------------------------------------------------------
# 💾 [API 2] 다이어리 + 사진 + 날씨 DB 저장 API (Form 데이터 방식)
# -------------------------------------------------------------------
# 🚀 2. 다이어리 저장 API 교체 (날짜 지정 기능 추가!)
@app.post("/api/diary/logs")
def create_diary_log(
    user_id: int = Form(...),
    selected_emotion: str = Form(...),
    diary_content: str = Form(...),
    detected_emotion: str = Form(None),
    image: UploadFile = File(None),
    date: str = Form(None), # 🗓️ 프론트엔드에서 선택한 날짜를 받습니다!
    db: Session = Depends(database.get_db)
):
    try:
        saved_image_path = None
        if image:
            saved_image_path = f"uploads/{image.filename}"
            with open(saved_image_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)

        # ---------------------------------------------------------
        # ⛅ 1. 날씨 API 가져오기 (.env 파일 수정하셨으니 이제 잘 될 겁니다!)
        # ---------------------------------------------------------
        WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
        city = "Seoul"
        weather_desc = "알 수 없음"
        if WEATHER_API_KEY:
            weather_url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={WEATHER_API_KEY}&lang=kr"
            res = requests.get(weather_url)
            if res.status_code == 200:
                weather_desc = res.json()['weather'][0]['description']
            else:
                print(f"⛅ 날씨 API 에러: {res.status_code} - {res.text}")

        # ---------------------------------------------------------
        # 📝 2. 이모지 -> 텍스트 키워드 변환 (😊 -> 행복)
        # ---------------------------------------------------------
        reverse_emoji_map = {
            "😊": "행복", "🙂": "안정", "🥰": "설렘", "😐": "중립",
            "😟": "불안", "😫": "피로", "😔": "우울", "😡": "화남"
        }
        db_emotion_text = reverse_emoji_map.get(selected_emotion, selected_emotion)

        # ---------------------------------------------------------
        # 🌡️ 3. 가전 센서 온습도 랜덤 생성기 (21~26도 / 40~60%)
        # ---------------------------------------------------------
        dummy_temperature = round(random.uniform(21.0, 26.0), 1)
        dummy_humidity = round(random.uniform(40.0, 60.0), 1)
        
        # 4. DB 테이블에 데이터 맵핑
        new_diary = models.DiaryLog(
            user_id=user_id,
            selected_emotion=db_emotion_text,   # 🚀 변환된 텍스트('행복' 등) 저장!
            diary_content=diary_content,
            image_path=saved_image_path,
            temperature_ambient=dummy_temperature, # 🚀 랜덤 온도 저장!
            humidity_ambient=dummy_humidity,       # 🚀 랜덤 습도 저장!
            weather_ambient=weather_desc           
        )
        
        # 🔥 유저가 날짜를 선택해서 보냈다면, DB의 시간을 그 날짜로 덮어씁니다!
        if date:
            new_diary.recorded_at = datetime.strptime(date, "%Y-%m-%d")

        db.add(new_diary)
        db.flush()

        if detected_emotion:
            new_analysis = models.AiAnalysisResult(
                diary_id=new_diary.diary_id,
                detected_emotion=detected_emotion
            )
            db.add(new_analysis)

        db.commit()
        return {"status": "Success", "message": "성공적으로 저장되었습니다."}
        
    except Exception as e:
        db.rollback() 
        return {"status": "Error", "message": str(e)}

# 🚀 3. 내 일기 불러오기 API가 잘 있는지 확인! (안 보였던 이유 해결)
# 🚀 [API 3] 내 다이어리 목록 불러오기 (DB 텍스트 -> 프론트 이모지 변환 탑재)
@app.get("/api/diary/logs/{user_id}")
def get_diary_logs(user_id: int, db: Session = Depends(database.get_db)):
    try:
        logs = db.query(models.DiaryLog).filter(models.DiaryLog.user_id == user_id).order_by(models.DiaryLog.recorded_at.desc()).all()
        
        # ---------------------------------------------------------
        # 📝 텍스트(DB) -> 이모지(화면) 강제 변환기
        # ---------------------------------------------------------
        keyword_to_emoji = {
            "행복": "😊", "안정": "🙂", "설렘": "🥰", "중립": "😐",
            "불안": "😟", "피로": "😫", "우울": "😔", "화남": "😡"
        }
        
        result = []
        for log in logs:
            date_str = str(log.recorded_at).split(" ")[0] if log.recorded_at else "2026-05-26"
            img_list = [f"http://localhost:8000/{log.image_path}"] if log.image_path else []

            # 🚀 DB에 저장된 '행복'을 꺼내 다시 '😊'로 바꿔줍니다. (매칭 안되면 기본 😐)
            display_mood = keyword_to_emoji.get(log.selected_emotion, "😐")

            result.append({
                "id": log.diary_id,
                "date": date_str,
                "mood": display_mood, # 🚀 프론트엔드에는 이모지로 날아갑니다!
                "content": log.diary_content,
                "images": img_list,
                "type": "daily" 
            })
            
        return {"status": "Success", "entries": result}
    except Exception as e:
        return {"status": "Error", "message": str(e)}
    try:
        logs = db.query(models.DiaryLog).filter(models.DiaryLog.user_id == user_id).order_by(models.DiaryLog.recorded_at.desc()).all()
        result = []
        for log in logs:
            # 시간까지 나오는 DB 데이터를 'YYYY-MM-DD' 날짜만 나오게 깔끔하게 자름
            date_str = str(log.recorded_at).split(" ")[0] if log.recorded_at else "2026-05-26"
            img_list = [f"http://localhost:8000/{log.image_path}"] if log.image_path else []

            result.append({
                "id": log.diary_id,
                "date": date_str,
                "mood": log.selected_emotion,
                "content": log.diary_content,
                "images": img_list,
                "type": "daily" 
            })
        return {"status": "Success", "entries": result}
    except Exception as e:
        return {"status": "Error", "message": str(e)}
    































# 일정 등록용 데이터 검증 스키마
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
# 🚀 1. 캘린더 일정 불러오기 API (부부의 connection_code로 검색)
@app.get("/api/calendar/events/{connection_code}")
def get_calendar_events(connection_code: str, db: Session = Depends(database.get_db)):
    # connection_code가 없는 경우(연동 안됨) 빈 배열 반환
    if not connection_code or connection_code == "None":
        return {"status": "Success", "events": []}
        
    events = db.query(models.SharedCalendarEvent).filter(
        models.SharedCalendarEvent.connection_code == connection_code
    ).all()
    
    result = []
    for e in events:
        result.append({
            "event_id": e.event_id,
            "event_type": e.event_type,
            "title": e.title,
            "content": e.content,
            "event_date": str(e.event_date)
        })
    return {"status": "Success", "events": result}

# 🚀 2. 새 일정 등록 API
@app.post("/api/calendar/events")
def create_calendar_event(event: EventCreate, db: Session = Depends(database.get_db)):
    if not event.connection_code or event.connection_code == "None":
        raise HTTPException(status_code=400, detail="부부 연동 코드가 필요합니다.")
        
    new_event = models.SharedCalendarEvent(
        connection_code=event.connection_code,
        event_type=event.event_type,
        title=event.title,
        content=event.content,
        event_date=event.event_date
    )
    db.add(new_event)
    db.commit()
    return {"status": "Success", "message": "일정이 등록되었습니다."}

# 🚀 4. 일정 삭제 API
@app.delete("/api/calendar/events/{event_id}")
def delete_calendar_event(event_id: int, db: Session = Depends(database.get_db)):
    event = db.query(models.SharedCalendarEvent).filter(models.SharedCalendarEvent.event_id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="일정을 찾을 수 없습니다.")
    
    db.delete(event)
    db.commit()
    return {"status": "Success", "message": "일정이 삭제되었습니다."}



















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