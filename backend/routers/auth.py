from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from datetime import datetime, date, timedelta
import os
import random
import string

from dotenv import load_dotenv

import models
import schemas
import database

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env.demo-login"), override=True)

router = APIRouter(tags=["Auth & Profile"])


def resolve_demo_login(login_id: str, password: str):
    aliases = {
        os.getenv("DEMO_MOM_LOGIN_ID", "").strip().lower(): (
            os.getenv("DEMO_MOM_EMAIL", "").strip().lower(),
            os.getenv("DEMO_MOM_PASSWORD", ""),
        ),
        os.getenv("DEMO_DAD_LOGIN_ID", "").strip().lower(): (
            os.getenv("DEMO_DAD_EMAIL", "").strip().lower(),
            os.getenv("DEMO_DAD_PASSWORD", ""),
        ),
    }
    aliases.pop("", None)

    target = aliases.get(login_id)
    if not target:
        return login_id, False

    target_email, alias_password = target
    if not target_email or not alias_password or password != alias_password:
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 틀렸습니다.")
    return target_email, True


def ensure_user_schema():
    with database.engine.begin() as conn:
        nickname_column = conn.execute(
            text("SHOW COLUMNS FROM USERS LIKE 'nickname'")
        ).first()
        if not nickname_column:
            conn.execute(text("ALTER TABLE USERS ADD COLUMN nickname VARCHAR(50) NULL AFTER name"))

def ensure_admin_user():
    with database.SessionLocal() as db:
        admin_user = (
            db.query(models.User)
            .filter((models.User.email == "admin") | (models.User.role == "ADMIN"))
            .first()
        )
        if admin_user:
            return

        db.add(models.User(
            email="admin",
            password="admin",
            name="admin",
            role="ADMIN",
            baby_nickname=None,
            pregnancy_start_date=None,
            connection_code=None,
            parent_user_id=None,
        ))
        db.commit()

@router.post("/api/auth/register")
def register_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    normalized_email = user.email.strip().lower()
    normalized_name = user.name.strip()
    normalized_nickname = (user.nickname or "").strip()
    normalized_role = user.role.strip().upper()

    if normalized_role not in {"PREGNANT", "GUARDIAN"}:
        raise HTTPException(status_code=400, detail="올바른 회원 유형을 선택해 주세요.")
    if not normalized_name:
        raise HTTPException(status_code=400, detail="이름을 입력해 주세요.")
    if not normalized_nickname:
        raise HTTPException(status_code=400, detail="커뮤니티 닉네임을 입력해 주세요.")
    if "@" not in normalized_email or normalized_email.startswith("@") or normalized_email.endswith("@"):
        raise HTTPException(status_code=400, detail="올바른 이메일 형식을 입력해 주세요.")
    if len(user.password) < 6:
        raise HTTPException(status_code=400, detail="비밀번호는 6자 이상 입력해 주세요.")

    existing_user = (
        db.query(models.User)
        .filter(func.lower(models.User.email) == normalized_email)
        .first()
    )
    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="이미 사용 중인 이메일입니다. 다른 이메일을 입력해 주세요.",
        )

    parent_user_id = None
    pregnancy_start_date = None

    if normalized_role == "PREGNANT":
        if not user.start_date:
            raise HTTPException(status_code=400, detail="임신 시작일을 입력해 주세요.")
        try:
            pregnancy_start_date = datetime.strptime(user.start_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="임신 시작일 형식이 올바르지 않습니다.")

        today = date.today()
        min_start_date = today - timedelta(days=280)
        if pregnancy_start_date < min_start_date or pregnancy_start_date > today:
            raise HTTPException(status_code=400, detail="임신 시작일은 오늘 기준 280일 전부터 오늘까지만 선택할 수 있습니다.")

    if normalized_role == "PREGNANT":
        while True:
            new_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            if not db.query(models.User).filter(models.User.connection_code == new_code).first():
                connection_code = new_code
                break
    else:
        connection_code = None
        normalized_code = (user.input_connection_code or "").strip().upper()
        pregnant_user = db.query(models.User).filter(models.User.connection_code == normalized_code).first()
        if not pregnant_user:
            raise HTTPException(status_code=400, detail="유효하지 않은 인증코드입니다.")
        if pregnant_user.parent_user_id:
            raise HTTPException(status_code=409, detail="이미 보호자 계정과 연결된 인증코드입니다.")
        parent_user_id = pregnant_user.id

    new_user = models.User(
        email=normalized_email,
        password=user.password,
        name=normalized_name,
        nickname=normalized_nickname,
        role=normalized_role,
        baby_nickname=(user.baby_nickname or "").strip() or None,
        pregnancy_start_date=pregnancy_start_date,
        connection_code=connection_code,
        parent_user_id=parent_user_id
    )
    db.add(new_user)
    db.flush() 
    
    if normalized_role == "GUARDIAN" and parent_user_id:
        pregnant_user = db.query(models.User).filter(models.User.id == parent_user_id).first()
        if pregnant_user:
            pregnant_user.parent_user_id = new_user.id
    
    db.commit()
    return {"status": "Success", "connection_code": connection_code}

@router.post("/api/auth/login")
def login(request: schemas.LoginRequest, db: Session = Depends(database.get_db)):
    login_id = request.email.strip().lower()
    normalized_email, authenticated_by_alias = resolve_demo_login(login_id, request.password)
    user = db.query(models.User).filter(func.lower(models.User.email) == normalized_email).first()
    if not user or (not authenticated_by_alias and user.password != request.password):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 틀렸습니다.")
    
    pregnant_info = None
    guardian_info = None
    effective_baby_nickname = user.baby_nickname
    effective_pregnancy_start_date = user.pregnancy_start_date
    
    if user.role == "GUARDIAN" and user.parent_user_id:
        parent = db.query(models.User).filter(models.User.id == user.parent_user_id).first()
        if parent:
            effective_baby_nickname = parent.baby_nickname
            effective_pregnancy_start_date = parent.pregnancy_start_date
            pregnant_info = {
                "name": parent.name,
                "baby_nickname": parent.baby_nickname,
                "pregnancy_start_date": str(parent.pregnancy_start_date) if parent.pregnancy_start_date else None,
                "connection_code": parent.connection_code
            }
    elif user.role == "PREGNANT" and user.parent_user_id:
        guardian = db.query(models.User).filter(models.User.id == user.parent_user_id).first()
        if guardian:
            guardian_info = {
                "name": guardian.name,
                "email": guardian.email
            }
    
    return {
        "status": "Success",
        "user": {
            "user_id": user.id,
            "email": user.email,
            "name": user.name,
            "nickname": user.nickname or user.name,
            "role": user.role,
            "baby_nickname": effective_baby_nickname,
            "pregnancy_start_date": str(effective_pregnancy_start_date) if effective_pregnancy_start_date else None,
            "connection_code": user.connection_code,
            "parent_user_id": user.parent_user_id,
            "connected_pregnant": pregnant_info,
            "connected_guardian": guardian_info
        }
    }

@router.get("/api/user/info/{identifier}")
def get_user_info(identifier: str, db: Session = Depends(database.get_db)):
    if identifier.isdigit():
        user = db.query(models.User).filter(models.User.id == int(identifier)).first()
    else:
        user = db.query(models.User).filter(func.lower(models.User.email) == identifier.strip().lower()).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    partner_code = None
    pregnant_start_date = str(user.pregnancy_start_date) if user.pregnancy_start_date else None
    effective_baby_nickname = user.baby_nickname
    connected_name = None
    connected_email = None

    if user.role == "GUARDIAN" and user.parent_user_id:
        parent = db.query(models.User).filter(models.User.id == user.parent_user_id).first()
        if parent:
            partner_code = parent.connection_code
            pregnant_start_date = str(parent.pregnancy_start_date) if parent.pregnancy_start_date else None
            effective_baby_nickname = parent.baby_nickname
            connected_name = parent.name
            connected_email = parent.email
    elif user.role == "PREGNANT" and user.parent_user_id:
        guardian = db.query(models.User).filter(models.User.id == user.parent_user_id).first()
        if guardian:
            connected_name = guardian.name
            connected_email = guardian.email

    return {
        "status": "Success",
        "user_id": user.id,
        "name": user.name,
        "nickname": user.nickname or user.name,
        "baby_nickname": effective_baby_nickname,
        "connection_code": user.connection_code,
        "partner_code": partner_code,
        "pregnancy_start_date": pregnant_start_date,
        "connected_name": connected_name,
        "connected_email": connected_email
    }

@router.put("/api/user/profile/{user_id}")
def update_profile(user_id: int, profile: schemas.ProfileUpdate, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    normalized_name = profile.name.strip()
    if not normalized_name:
        raise HTTPException(status_code=400, detail="이름을 입력해 주세요.")
    user.name = normalized_name
    user.nickname = (profile.nickname or "").strip() or user.nickname
    baby_nickname = (profile.baby_nickname or "").strip() or None
    if user.role == "GUARDIAN" and user.parent_user_id:
        pregnant_user = db.query(models.User).filter(models.User.id == user.parent_user_id).first()
        if pregnant_user:
            pregnant_user.baby_nickname = baby_nickname
    else:
        user.baby_nickname = baby_nickname
    db.commit()
    return {"status": "Success", "message": "프로필이 수정되었습니다."}

@router.put("/api/user/password/{user_id}")
def update_password(user_id: int, passwords: schemas.PasswordUpdate, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    if user.password != passwords.current_password:
        raise HTTPException(status_code=400, detail="현재 비밀번호가 일치하지 않습니다.")
    if len(passwords.new_password) < 6:
        raise HTTPException(status_code=400, detail="새 비밀번호는 6자 이상 입력해 주세요.")
    user.password = passwords.new_password
    db.commit()
    return {"status": "Success", "message": "비밀번호가 변경되었습니다."}

@router.delete("/api/auth/withdraw/{user_id}")
def withdraw_user(user_id: int, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    try:
        if user.role == "PREGNANT":
            if user.parent_user_id:
                guardian = db.query(models.User).filter(models.User.id == user.parent_user_id).first()
                if guardian:
                    db.query(models.CommunityPost).filter(models.CommunityPost.user_id == guardian.id).delete()
                    db.query(models.CommunityComment).filter(models.CommunityComment.user_id == guardian.id).delete()
                    db.query(models.SmallTalkAnswer).filter(models.SmallTalkAnswer.user_id == guardian.id).delete()
                    db.delete(guardian)
            
            diary_logs = db.query(models.DiaryLog).filter(models.DiaryLog.user_id == user_id).all()
            for log in diary_logs:
                db.query(models.AiAnalysisResult).filter(models.AiAnalysisResult.diary_id == log.diary_id).delete()
            db.query(models.DiaryLog).filter(models.DiaryLog.user_id == user_id).delete()
            db.query(models.CommunityComment).filter(models.CommunityComment.user_id == user_id).delete()
            db.query(models.CommunityPost).filter(models.CommunityPost.user_id == user_id).delete()
            db.query(models.SmallTalkAnswer).filter(models.SmallTalkAnswer.user_id == user_id).delete()
            if user.connection_code:
                db.query(models.SharedCalendarEvent).filter(models.SharedCalendarEvent.connection_code == user.connection_code).delete()
            db.query(models.ApplianceSetting).filter(models.ApplianceSetting.user_id == user_id).delete()
            db.delete(user)
        elif user.role == "GUARDIAN":
            db.query(models.CommunityPost).filter(models.CommunityPost.user_id == user_id).delete()
            db.query(models.CommunityComment).filter(models.CommunityComment.user_id == user_id).delete()
            db.query(models.SmallTalkAnswer).filter(models.SmallTalkAnswer.user_id == user_id).delete()
            db.query(models.ApplianceSetting).filter(models.ApplianceSetting.user_id == user_id).delete()
            db.delete(user)
        db.commit()
        return {"status": "Success", "message": "회원탈퇴가 완료되었습니다."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"탈퇴 중 오류 발생: {str(e)}")
