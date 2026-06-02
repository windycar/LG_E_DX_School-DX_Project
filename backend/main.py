import os
import sys
import json
import importlib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

import models
import database
# 분할된 라우터 임포트
from routers import auth, appliances, diary, guardian, community, calendar, smalltalk, admin

# 1. 초기 설정
load_dotenv()
models.Base.metadata.create_all(bind=database.engine)
API_PUBLIC_BASE_URL = os.getenv("API_PUBLIC_BASE_URL", "http://localhost:8000").rstrip("/")
BACKEND_ALLOWED_ORIGINS = [
    origin.strip() for origin in os.getenv("BACKEND_ALLOWED_ORIGINS", "*").split(",") if origin.strip()
]

# DB 시드 및 스키마 초기화
try: guardian.ensure_mission_schema()
except Exception as e: print(f"guardian mission schema check skipped: {e}")

try: community.ensure_community_like_schema()
except Exception as e: print(f"community like schema check skipped: {e}")

try: auth.ensure_admin_user()
except Exception as e: print(f"admin user seed skipped: {e}")

try: diary.ensure_ai_recommendation_seed()
except Exception as e: print(f"weekly ai recommendation seed skipped: {e}")

app = FastAPI(title="Pregnancy Smart Care API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=BACKEND_ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "FastAPI backend", "api_public_base_url": API_PUBLIC_BASE_URL}

# 2. AI 감정 분석 모델 적재
print("🚀 AI 감정 분석 모델을 메모리에 적재 중입니다...")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)
possible_paths = [os.path.join(ROOT_DIR, "Project", "diary_emotion_ai", "scripts"), os.path.join(ROOT_DIR, "diary_emotion_ai", "scripts")]

ai_scripts_path = next((p for p in possible_paths if os.path.exists(p)), None)
if ai_scripts_path:
    if ai_scripts_path not in sys.path: sys.path.append(ai_scripts_path)
    try:
        diary_ai = importlib.import_module("03_predict_diary_emotion")
        AI_MODEL = json.loads(diary_ai.MODEL_PATH.read_text(encoding="utf-8"))
        
        # 💡 분할된 라우터에서 AI 모델을 사용할 수 있도록 app.state에 할당
        app.state.diary_ai = diary_ai
        app.state.AI_MODEL = AI_MODEL
        print("✅ AI 모델 적재 완료! (추론 대기 상태)")
    except Exception as e: print(f"❌ AI 모델 로드 실패: {e}")
else: print(f"❌ AI 스크립트 경로를 찾지 못했습니다. (현재 검색 경로: {possible_paths})")

# 3. 라우터 조립
app.include_router(auth.router)
app.include_router(appliances.router)
app.include_router(diary.router)
app.include_router(guardian.router)
app.include_router(community.router)
app.include_router(calendar.router)
app.include_router(smalltalk.router)
app.include_router(admin.router)
