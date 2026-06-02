import os
import json
import importlib
import sys

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import database
import models
from routers import admin, appliances, auth, calendar, community, diary, guardian, smalltalk

load_dotenv()

models.Base.metadata.create_all(bind=database.engine)

API_PUBLIC_BASE_URL = os.getenv("API_PUBLIC_BASE_URL", "http://localhost:8000").rstrip("/")
BACKEND_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("BACKEND_ALLOWED_ORIGINS", "*").split(",")
    if origin.strip()
]

try:
    guardian.ensure_mission_schema()
except Exception as e:
    print(f"guardian mission schema check skipped: {e}")

try:
    community.ensure_community_like_schema()
except Exception as e:
    print(f"community like schema check skipped: {e}")

try:
    auth.ensure_admin_user()
except Exception as e:
    print(f"admin user seed skipped: {e}")

try:
    diary.ensure_ai_recommendation_seed()
except Exception as e:
    print(f"weekly ai recommendation seed skipped: {e}")

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


@app.get("/")
def root():
    return {"status": "ok", "service": "FastAPI backend", "api_public_base_url": API_PUBLIC_BASE_URL}


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "FastAPI backend", "api_public_base_url": API_PUBLIC_BASE_URL}


if os.getenv("ENABLE_LOCAL_DIARY_AI", "false").lower() == "true":
    # Optional only. Render Free can exceed 512MB when loading local model data.
    base_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(base_dir)
    possible_paths = [
        os.path.join(root_dir, "Project", "diary_emotion_ai", "scripts"),
        os.path.join(root_dir, "diary_emotion_ai", "scripts"),
    ]
    ai_scripts_path = next((path for path in possible_paths if os.path.exists(path)), None)
    if ai_scripts_path:
        if ai_scripts_path not in sys.path:
            sys.path.append(ai_scripts_path)
        try:
            diary_ai = importlib.import_module("03_predict_diary_emotion")
            ai_model = json.loads(diary_ai.MODEL_PATH.read_text(encoding="utf-8"))
            app.state.diary_ai = diary_ai
            app.state.AI_MODEL = ai_model
            print("Optional diary emotion model loaded.")
        except Exception as e:
            print(f"optional diary emotion model load skipped: {e}")

app.include_router(auth.router)
app.include_router(appliances.router)
app.include_router(diary.router)
app.include_router(guardian.router)
app.include_router(community.router)
app.include_router(calendar.router)
app.include_router(smalltalk.router)
app.include_router(admin.router)
