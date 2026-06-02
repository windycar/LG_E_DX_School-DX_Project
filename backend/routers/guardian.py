import json
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text
import models
import schemas
import database

router = APIRouter(tags=["Guardian"])

def ensure_mission_schema():
    mission_columns = {
        "status_check_id": "BIGINT NULL",
        "mission_title": "VARCHAR(200) NOT NULL DEFAULT '오늘의 케어 미션'",
        "mission_reason": "TEXT NULL",
        "mission_type": "VARCHAR(50) NOT NULL DEFAULT 'emotional_support'",
        "completed_at": "DATETIME NULL",
    }
    with database.engine.begin() as conn:
        for column_name, column_def in mission_columns.items():
            exists = conn.execute(text("SHOW COLUMNS FROM GUARDIAN_MISSIONS LIKE :column_name"), {"column_name": column_name}).first()
            if not exists:
                conn.execute(text(f"ALTER TABLE GUARDIAN_MISSIONS ADD COLUMN {column_name} {column_def}"))

def get_guardian_for_pregnant_user(pregnant_user_id: int, db: Session):
    pregnant_user = db.query(models.User).filter(models.User.id == pregnant_user_id).first()
    if not pregnant_user: return None
    if pregnant_user.parent_user_id:
        guardian = db.query(models.User).filter(models.User.id == pregnant_user.parent_user_id, func.upper(models.User.role) == "GUARDIAN").first()
        if guardian: return guardian
    return db.query(models.User).filter(models.User.parent_user_id == pregnant_user_id, func.upper(models.User.role) == "GUARDIAN").first()

def get_or_create_care_preference(user_id: int, db: Session):
    preference = db.query(models.UserCarePreference).filter(models.UserCarePreference.user_id == user_id).first()
    if preference: return preference
    preference = models.UserCarePreference(user_id=user_id)
    db.add(preference)
    db.flush()
    return preference

def classify_mission_context(emotion: str, diary_content: str):
    text = f"{emotion or ''} {diary_content or ''}"
    if any(k in text for k in ["입덧", "메스꺼", "토할", "소화", "속이", "울렁"]): return "physical_care", "속이 불편한 상태"
    if any(k in text for k in ["허리", "통증", "붓기", "다리", "배가", "피로", "힘들", "잠"]): return "housework", "몸이 무겁거나 피로한 상태"
    if any(k in text for k in ["불안", "우울", "슬픔", "무서", "걱정", "화남", "스트레스"]): return "emotional_support", "정서적 지지가 필요한 상태"
    if emotion in ["불안", "우울", "화남", "피로"]: return "emotional_support", f"{emotion} 감정이 감지된 상태"
    if emotion in ["행복", "안정", "설렘"]: return "positive", f"{emotion} 감정이 감지된 상태"
    return "balanced", "특별한 위험 신호는 없지만 관심이 필요한 상태"

def build_guardian_mission(emotion: str, diary_content: str, preference):
    mission_type, reason_context = classify_mission_context(emotion, diary_content)
    if preference and preference.preferred_mission_type != "balanced": mission_type = preference.preferred_mission_type

    missions = {
        "physical_care": {"title": "몸 상태를 먼저 살피는 미션", "content": "따뜻한 물이나 부담 없는 간식을 준비하고, 실내를 환기한 뒤 아내가 바로 쉴 수 있게 해주세요."},
        "housework": {"title": "집안 부담을 줄이는 미션", "content": "오늘은 설거지, 빨래, 바닥 정리 중 하나를 먼저 끝내고 아내에게 쉬라고 말해주세요."},
        "emotional_support": {"title": "마음을 안정시키는 미션", "content": "해결책을 먼저 말하지 말고 10분 동안 아내의 이야기를 끊지 않고 들어주세요."},
        "conversation": {"title": "대화를 여는 미션", "content": "오늘 가장 힘들었던 순간과 도와줬으면 하는 일을 차분하게 물어봐 주세요."},
        "positive": {"title": "좋은 컨디션을 유지하는 미션", "content": "가벼운 산책이나 좋아하는 간식을 제안해서 좋은 기분이 이어지도록 도와주세요."},
        "balanced": {"title": "오늘의 기본 케어 미션", "content": "아내에게 오늘 컨디션을 물어보고 물 한 잔과 짧은 휴식 시간을 챙겨주세요."},
    }

    selected = missions.get(mission_type, missions["balanced"])
    content = selected["content"]
    care_style = preference.care_style if preference else "warm"
    if care_style == "practical": content = content.replace("말해주세요", "전달하고 바로 실행해주세요")
    elif care_style == "short": content = content.split(".")[0] + "."

    avoid_keywords = [item.strip() for item in (preference.avoid_mission_keywords or "").split(",") if item.strip()]
    if any(keyword in content for keyword in avoid_keywords):
        mission_type = "balanced"; selected = missions["balanced"]; content = selected["content"]

    return {"mission_type": mission_type, "mission_title": selected["title"], "mission_content": content, "mission_reason": f"오늘 기록에서 {reason_context}로 판단되어 이 미션을 추천했습니다."}

def create_guardian_mission_for_status_check(db: Session, pregnant_user_id: int, status_check_id: int, symptoms: list[str], emotions: list[str]):
    guardian = get_guardian_for_pregnant_user(pregnant_user_id, db)
    if not guardian: return None
    existing = db.query(models.GuardianMission).filter(models.GuardianMission.status_check_id == status_check_id, models.GuardianMission.user_id == guardian.id).first()
    if existing: return existing
    preference = get_or_create_care_preference(guardian.id, db)
    mission_data = build_guardian_mission(emotions[0] if emotions else "중립", " ".join((symptoms or []) + (emotions or [])), preference)
    mission = models.GuardianMission(
        status_check_id=status_check_id, user_id=guardian.id, mission_title=mission_data["mission_title"],
        mission_content=mission_data["mission_content"], mission_reason=mission_data["mission_reason"],
        mission_type=mission_data["mission_type"], execution_status="PENDING",
    )
    db.add(mission); db.flush()
    return mission

def format_guardian_mission(mission):
    if not mission: return None
    return {
        "mission_id": mission.mission_id, "analysis_id": mission.analysis_id, "status_check_id": mission.status_check_id,
        "mission_title": mission.mission_title, "mission_content": mission.mission_content, "mission_reason": mission.mission_reason,
        "mission_type": mission.mission_type, "execution_status": mission.execution_status,
        "created_at": mission.created_at.isoformat() if mission.created_at else None, "completed_at": mission.completed_at.isoformat() if mission.completed_at else None,
    }

@router.post("/api/status-checks")
def create_status_check(payload: schemas.PregnancyStatusCheckCreate, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == payload.user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    if user.role.upper() != "PREGNANT": raise HTTPException(status_code=400, detail="임산부 계정만 상태 체크를 등록할 수 있습니다.")

    status_check = models.PregnancyStatusCheck(user_id=payload.user_id, symptoms=json.dumps(payload.symptoms, ensure_ascii=False), emotions=json.dumps(payload.emotions, ensure_ascii=False))
    db.add(status_check); db.flush()
    mission = create_guardian_mission_for_status_check(db=db, pregnant_user_id=payload.user_id, status_check_id=status_check.status_check_id, symptoms=payload.symptoms, emotions=payload.emotions)
    db.commit()
    return {"status": "Success", "status_check_id": status_check.status_check_id, "guardian_mission": format_guardian_mission(mission)}

@router.get("/api/guardian/missions/today/{guardian_user_id}")
def get_today_guardian_mission(guardian_user_id: int, db: Session = Depends(database.get_db)):
    mission = db.query(models.GuardianMission).filter(models.GuardianMission.user_id == guardian_user_id, func.date(models.GuardianMission.created_at) == date.today()).order_by(models.GuardianMission.created_at.desc()).first()
    return {"status": "Success", "mission": format_guardian_mission(mission)}

@router.put("/api/guardian/missions/{mission_id}/complete")
def complete_guardian_mission(mission_id: int, db: Session = Depends(database.get_db)):
    mission = db.query(models.GuardianMission).filter(models.GuardianMission.mission_id == mission_id).first()
    if not mission: raise HTTPException(status_code=404, detail="Mission not found")
    mission.execution_status = "COMPLETED"
    mission.completed_at = datetime.now()
    db.commit()
    return {"status": "Success", "mission": format_guardian_mission(mission)}

@router.get("/api/guardian/preferences/{guardian_user_id}")
def get_guardian_preferences(guardian_user_id: int, db: Session = Depends(database.get_db)):
    preference = get_or_create_care_preference(guardian_user_id, db)
    db.commit()
    return {"status": "Success", "preference": {"preferred_mission_type": preference.preferred_mission_type, "notification_enabled": preference.notification_enabled, "mission_time": preference.mission_time, "care_style": preference.care_style, "avoid_mission_keywords": preference.avoid_mission_keywords}}

@router.put("/api/guardian/preferences/{guardian_user_id}")
def update_guardian_preferences(guardian_user_id: int, payload: schemas.UserCarePreferenceUpsert, db: Session = Depends(database.get_db)):
    preference = get_or_create_care_preference(guardian_user_id, db)
    preference.preferred_mission_type = payload.preferred_mission_type or "balanced"
    preference.notification_enabled = bool(payload.notification_enabled)
    preference.mission_time = payload.mission_time
    preference.care_style = payload.care_style or "warm"
    preference.avoid_mission_keywords = payload.avoid_mission_keywords
    db.commit()
    return {"status": "Success"}