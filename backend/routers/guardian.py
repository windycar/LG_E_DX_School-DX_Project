import json
from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, text
from sqlalchemy.orm import Session

import database
import models
import schemas

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
            exists = conn.execute(
                text("SHOW COLUMNS FROM GUARDIAN_MISSIONS LIKE :column_name"),
                {"column_name": column_name},
            ).first()
            if not exists:
                conn.execute(text(f"ALTER TABLE GUARDIAN_MISSIONS ADD COLUMN {column_name} {column_def}"))


def ensure_care_preference_schema():
    with database.engine.begin() as conn:
        avoid_keywords_column = conn.execute(
            text("SHOW COLUMNS FROM USER_CARE_PREFERENCES LIKE 'avoid_mission_keywords'")
        ).first()
        if avoid_keywords_column:
            conn.execute(text("ALTER TABLE USER_CARE_PREFERENCES DROP COLUMN avoid_mission_keywords"))


def get_guardian_for_pregnant_user(pregnant_user_id: int, db: Session):
    pregnant_user = db.query(models.User).filter(models.User.id == pregnant_user_id).first()
    if not pregnant_user:
        return None
    if pregnant_user.parent_user_id:
        guardian = (
            db.query(models.User)
            .filter(models.User.id == pregnant_user.parent_user_id, func.upper(models.User.role) == "GUARDIAN")
            .first()
        )
        if guardian:
            return guardian
    return (
        db.query(models.User)
        .filter(models.User.parent_user_id == pregnant_user_id, func.upper(models.User.role) == "GUARDIAN")
        .first()
    )


def get_or_create_care_preference(user_id: int, db: Session):
    preference = db.query(models.UserCarePreference).filter(models.UserCarePreference.user_id == user_id).first()
    if preference:
        return preference
    preference = models.UserCarePreference(user_id=user_id)
    db.add(preference)
    db.flush()
    return preference


def classify_mission_context(emotion: str, diary_content: str):
    text = f"{emotion or ''} {diary_content or ''}"
    groups = [
        ("warning_care", "주의 깊은 확인이 필요한 증상", ["가슴통증", "배뇨통", "질분비물"]),
        ("digestive_care", "위장 불편이 있는 상태", ["입덧", "메스꺼", "토할", "소화", "속이", "울렁", "역류", "변비"]),
        ("pain_care", "통증이나 저림이 있는 상태", ["두통", "허리통증", "골반통", "좌골신경통", "다리경련", "손발저림", "통증", "저림"]),
        ("fatigue_care", "피로하거나 순환 불편이 있는 상태", ["피로감", "피로", "어지러움", "빈혈", "붓기", "정맥류", "치질", "몸"]),
        ("rest_care", "휴식 환경 관리가 필요한 상태", ["수면장애", "코막힘", "코피", "잇몸출혈"]),
        ("urinary_care", "비뇨 관련 생활 배려가 필요한 상태", ["요실금"]),
        ("emotional_support", "정서적 지지가 필요한 상태", ["불안", "우울", "슬픔", "무서", "걱정", "화남", "스트레스"]),
    ]
    for mission_type, reason, keywords in groups:
        matched = next((keyword for keyword in keywords if keyword in text), None)
        if matched:
            return mission_type, reason, matched
    if emotion in ["불안", "우울", "화남", "피로"]:
        return "emotional_support", f"{emotion} 감정이 감지된 상태", emotion
    if emotion in ["행복", "안정", "설렘"]:
        return "positive", f"{emotion} 감정이 감지된 상태", emotion
    return "balanced", "명확한 위험 신호는 없지만 관심이 필요한 상태", None


def build_guardian_mission(emotion: str, diary_content: str, preference):
    mission_type, reason_context, matched_keyword = classify_mission_context(emotion, diary_content)
    if preference and preference.preferred_mission_type != "balanced" and matched_keyword is None and mission_type != "warning_care":
        mission_type = preference.preferred_mission_type

    symptom_actions = {
        "가슴통증": "통증이 시작된 시간과 강도를 함께 기록하고 병원 연락 기준을 확인해주세요.",
        "배뇨통": "수분 섭취를 챙기고 배뇨통이 지속되는지 함께 기록해주세요.",
        "질분비물": "분비물 색과 냄새 변화를 기록하고 진료 문의를 준비해주세요.",
        "입덧": "냄새 강한 음식은 치우고 크래커와 따뜻한 물을 준비해주세요.",
        "소화": "가벼운 식사를 준비하고 식후 10분 산책을 제안해주세요.",
        "역류": "식후 바로 눕지 않도록 쿠션과 앉을 자리를 준비해주세요.",
        "변비": "물과 과일 간식을 챙기고 가벼운 움직임을 제안해주세요.",
        "두통": "조명을 낮추고 조용히 쉴 수 있는 자리를 만들어주세요.",
        "허리통증": "무거운 일을 대신하고 허리를 받칠 쿠션을 챙겨주세요.",
        "골반통": "걷는 거리를 줄이고 편히 앉을 자리를 먼저 준비해주세요.",
        "좌골신경통": "오래 서 있지 않도록 돕고 다리 받침을 준비해주세요.",
        "다리경련": "종아리 스트레칭을 도와주고 따뜻한 물을 챙겨주세요.",
        "손발저림": "손발을 따뜻하게 하고 편한 자세로 쉬게 도와주세요.",
        "피로감": "오늘 집안일 하나를 먼저 끝내고 낮잠 시간을 확보해주세요.",
        "어지러움": "갑자기 일어나지 않게 돕고 물과 간식을 챙겨주세요.",
        "빈혈": "철분을 챙길 수 있는 식사를 준비하고 무리한 활동을 막아주세요.",
        "붓기": "다리를 올릴 쿠션을 준비하고 짠 음식을 줄여주세요.",
        "정맥류": "오래 서 있지 않게 하고 다리 휴식 시간을 만들어주세요.",
        "치질": "화장실 시간을 편하게 쓸 수 있도록 배려하고 물을 챙겨주세요.",
        "수면장애": "침실 조명을 낮추고 잠들기 전 소음을 줄여주세요.",
        "코막힘": "실내 습도를 확인하고 따뜻한 물을 준비해주세요.",
        "코피": "휴지와 물을 준비하고 반복 여부 기록을 도와주세요.",
        "잇몸출혈": "부드러운 음식을 준비하고 출혈 반복 여부를 확인해주세요.",
        "요실금": "외출 전 화장실 위치와 휴식 동선을 먼저 챙겨주세요.",
    }

    missions = {
        "warning_care": {"title": "주의 신호를 함께 확인하는 미션", "content": "증상이 시작된 시간과 강도를 함께 기록하고, 통증이나 출혈이 계속되면 병원 문의를 준비해주세요."},
        "digestive_care": {"title": "속이 편해지도록 돕는 미션", "content": "냄새 강한 음식은 피하고 따뜻한 물과 부담 없는 간식을 준비해주세요."},
        "pain_care": {"title": "통증 부담을 줄이는 미션", "content": "무거운 일은 대신하고, 아내가 편한 자세로 쉴 수 있게 쿠션과 휴식 공간을 챙겨주세요."},
        "fatigue_care": {"title": "몸이 무거운 날의 케어 미션", "content": "집안일 하나를 먼저 끝내고 아내가 다리를 올리고 쉴 수 있도록 도와주세요."},
        "rest_care": {"title": "편안한 휴식 환경 미션", "content": "침실 조명을 낮추고 실내 습도와 환기를 확인해 편하게 쉴 수 있는 환경을 만들어주세요."},
        "urinary_care": {"title": "생활 동선을 배려하는 미션", "content": "외출이나 휴식 중 화장실을 편하게 이용할 수 있도록 동선과 휴식 시간을 챙겨주세요."},
        "emotional_support": {"title": "마음을 안정시키는 미션", "content": "해결책을 먼저 말하지 말고 10분 동안 아내의 이야기를 끊지 않고 들어주세요."},
        "conversation": {"title": "대화를 여는 미션", "content": "오늘 가장 힘들었던 순간과 도와줬으면 하는 일을 차분하게 물어봐 주세요."},
        "positive": {"title": "좋은 컨디션을 유지하는 미션", "content": "가벼운 산책이나 좋아하는 간식을 제안해서 좋은 기분이 이어지도록 도와주세요."},
        "balanced": {"title": "오늘의 기본 케어 미션", "content": "아내에게 오늘 컨디션을 물어보고 물 한 잔과 짧은 휴식 시간을 챙겨주세요."},
    }

    selected = missions.get(mission_type, missions["balanced"])
    content = symptom_actions.get(matched_keyword, selected["content"])
    care_style = preference.care_style if preference else "warm"
    if care_style == "practical":
        content = content.replace("해주세요.", "전달하고 바로 실행해주세요.")
    elif care_style == "short":
        content = content.split(".")[0] + "."

    return {
        "mission_type": mission_type,
        "mission_title": selected["title"],
        "mission_content": content,
        "mission_reason": f"오늘 기록에서 {reason_context}로 판단되어 이 미션을 추천했습니다.",
    }


def create_guardian_mission_for_status_check(
    db: Session,
    pregnant_user_id: int,
    status_check_id: int,
    symptoms: list[str],
    emotions: list[str],
):
    guardian = get_guardian_for_pregnant_user(pregnant_user_id, db)
    if not guardian:
        return None
    existing = (
        db.query(models.GuardianMission)
        .filter(models.GuardianMission.status_check_id == status_check_id, models.GuardianMission.user_id == guardian.id)
        .first()
    )
    if existing:
        return existing
    preference = get_or_create_care_preference(guardian.id, db)
    mission_data = build_guardian_mission(
        emotions[0] if emotions else "중립",
        " ".join((symptoms or []) + (emotions or [])),
        preference,
    )
    mission = models.GuardianMission(
        status_check_id=status_check_id,
        user_id=guardian.id,
        mission_title=mission_data["mission_title"],
        mission_content=mission_data["mission_content"],
        mission_reason=mission_data["mission_reason"],
        mission_type=mission_data["mission_type"],
        execution_status="PENDING",
    )
    db.add(mission)
    db.flush()
    return mission


def parse_json_list(value):
    if not value:
        return []
    try:
        parsed = json.loads(value)
        return parsed if isinstance(parsed, list) else []
    except Exception:
        return []


def format_status_check(status_check):
    if not status_check:
        return None
    return {
        "status_check_id": status_check.status_check_id,
        "symptoms": parse_json_list(status_check.symptoms),
        "emotions": parse_json_list(status_check.emotions),
        "created_at": status_check.created_at.isoformat() if status_check.created_at else None,
    }


def format_guardian_mission(mission, status_check=None):
    if not mission:
        return None
    return {
        "mission_id": mission.mission_id,
        "analysis_id": mission.analysis_id,
        "status_check_id": mission.status_check_id,
        "mission_title": mission.mission_title,
        "mission_content": mission.mission_content,
        "mission_reason": mission.mission_reason,
        "mission_type": mission.mission_type,
        "execution_status": mission.execution_status,
        "created_at": mission.created_at.isoformat() if mission.created_at else None,
        "completed_at": mission.completed_at.isoformat() if mission.completed_at else None,
        "status_check": format_status_check(status_check),
    }


def get_latest_status_check_for_guardian(guardian_user_id: int, db: Session):
    guardian = db.query(models.User).filter(models.User.id == guardian_user_id).first()
    if not guardian:
        return None

    pregnant_user = None
    if guardian.parent_user_id:
        pregnant_user = (
            db.query(models.User)
            .filter(models.User.id == guardian.parent_user_id, func.upper(models.User.role) == "PREGNANT")
            .first()
        )
    if not pregnant_user:
        pregnant_user = (
            db.query(models.User)
            .filter(models.User.parent_user_id == guardian_user_id, func.upper(models.User.role) == "PREGNANT")
            .first()
        )
    if not pregnant_user:
        return None

    return (
        db.query(models.PregnancyStatusCheck)
        .filter(
            models.PregnancyStatusCheck.user_id == pregnant_user.id,
            func.date(models.PregnancyStatusCheck.created_at) == date.today(),
        )
        .order_by(models.PregnancyStatusCheck.created_at.desc())
        .first()
    )


@router.post("/api/status-checks")
def create_status_check(payload: schemas.PregnancyStatusCheckCreate, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role.upper() != "PREGNANT":
        raise HTTPException(status_code=400, detail="임산부 계정만 상태 체크를 등록할 수 있습니다.")

    status_check = models.PregnancyStatusCheck(
        user_id=payload.user_id,
        symptoms=json.dumps(payload.symptoms, ensure_ascii=False),
        emotions=json.dumps(payload.emotions, ensure_ascii=False),
    )
    db.add(status_check)
    db.flush()
    mission = create_guardian_mission_for_status_check(
        db=db,
        pregnant_user_id=payload.user_id,
        status_check_id=status_check.status_check_id,
        symptoms=payload.symptoms,
        emotions=payload.emotions,
    )
    db.commit()
    return {"status": "Success", "status_check_id": status_check.status_check_id, "guardian_mission": format_guardian_mission(mission, status_check)}


@router.get("/api/guardian/missions/today/{guardian_user_id}")
def get_today_guardian_mission(guardian_user_id: int, db: Session = Depends(database.get_db)):
    mission = (
        db.query(models.GuardianMission)
        .filter(models.GuardianMission.user_id == guardian_user_id, func.date(models.GuardianMission.created_at) == date.today())
        .order_by(models.GuardianMission.created_at.desc())
        .first()
    )
    status_check = None
    if mission and mission.status_check_id:
        status_check = (
            db.query(models.PregnancyStatusCheck)
            .filter(models.PregnancyStatusCheck.status_check_id == mission.status_check_id)
            .first()
        )
    if not status_check:
        status_check = get_latest_status_check_for_guardian(guardian_user_id, db)
    return {"status": "Success", "mission": format_guardian_mission(mission, status_check)}


@router.put("/api/guardian/missions/{mission_id}/complete")
def complete_guardian_mission(mission_id: int, db: Session = Depends(database.get_db)):
    mission = db.query(models.GuardianMission).filter(models.GuardianMission.mission_id == mission_id).first()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    mission.execution_status = "COMPLETED"
    mission.completed_at = datetime.now()
    db.commit()
    return {"status": "Success", "mission": format_guardian_mission(mission)}


@router.get("/api/guardian/preferences/{guardian_user_id}")
def get_guardian_preferences(guardian_user_id: int, db: Session = Depends(database.get_db)):
    preference = get_or_create_care_preference(guardian_user_id, db)
    db.commit()
    return {
        "status": "Success",
        "preference": {
            "preferred_mission_type": preference.preferred_mission_type,
            "notification_enabled": preference.notification_enabled,
            "mission_time": preference.mission_time,
            "care_style": preference.care_style,
        },
    }


@router.put("/api/guardian/preferences/{guardian_user_id}")
def update_guardian_preferences(guardian_user_id: int, payload: schemas.UserCarePreferenceUpsert, db: Session = Depends(database.get_db)):
    preference = get_or_create_care_preference(guardian_user_id, db)
    preference.preferred_mission_type = payload.preferred_mission_type or "balanced"
    preference.notification_enabled = bool(payload.notification_enabled)
    preference.mission_time = payload.mission_time
    preference.care_style = payload.care_style or "warm"
    db.commit()
    return {"status": "Success"}
