import json
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

import database
import models
from community_text_analyzer import analyze_community_text

router = APIRouter(tags=["Admin"])


class CommunityAnalyzeRequest(BaseModel):
    stopwords: list[str] = []


def calculate_pregnancy_week(start_date):
    if not start_date:
        return None
    return max(0, (date.today() - start_date).days // 7)


def get_admin_user(identifier: str, db: Session):
    if str(identifier).isdigit():
        user = db.query(models.User).filter(models.User.id == int(identifier)).first()
    else:
        user = db.query(models.User).filter(models.User.email == identifier).first()

    if not user:
        raise HTTPException(status_code=404, detail="관리자 계정을 찾을 수 없습니다.")

    is_admin = (
        str(user.email or "").lower() == "admin"
        or str(user.name or "").lower() == "admin"
        or str(user.role or "").upper() == "ADMIN"
    )
    if not is_admin:
        raise HTTPException(status_code=403, detail="관리자 권한이 없습니다.")
    return user


def user_payload(user):
    return {
        "user_id": int(user.id),
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "baby_nickname": user.baby_nickname,
        "pregnancy_start_date": str(user.pregnancy_start_date) if user.pregnancy_start_date else None,
        "pregnancy_week": calculate_pregnancy_week(user.pregnancy_start_date),
        "connection_code": user.connection_code,
        "parent_user_id": user.parent_user_id,
    }


def today_active_user_count(db: Session):
    today = date.today()
    ids = set()
    sources = [
        db.query(models.CommunityPost.user_id).filter(func.date(models.CommunityPost.created_at) == today).all(),
        db.query(models.CommunityComment.user_id).filter(func.date(models.CommunityComment.created_at) == today).all(),
        db.query(models.DiaryLog.user_id).filter(func.date(models.DiaryLog.recorded_at) == today).all(),
        db.query(models.SmallTalkAnswer.user_id).filter(func.date(models.SmallTalkAnswer.created_at) == today).all(),
        db.query(models.PregnancyStatusCheck.user_id).filter(func.date(models.PregnancyStatusCheck.created_at) == today).all(),
    ]
    for rows in sources:
        for (user_id,) in rows:
            if user_id:
                ids.add(int(user_id))
    return len(ids)


def community_texts(db: Session):
    texts = [text or "" for (text,) in db.query(models.CommunityPost.content).all()]
    texts.extend(text or "" for (text,) in db.query(models.CommunityComment.content).all())
    return texts


def appliance_average_settings(db: Session):
    totals = {
        "temperature": [],
        "humidity": [],
        "mood_light_brightness": [],
        "aircon_fan": [],
        "air_purifier_speed": [],
    }
    for (command,) in db.query(models.ApplianceSetting.control_command).all():
        try:
            parsed = json.loads(command or "{}")
        except Exception:
            continue
        if isinstance(parsed.get("temp"), (int, float)):
            totals["temperature"].append(float(parsed["temp"]))
        if isinstance(parsed.get("humidity"), (int, float)):
            totals["humidity"].append(float(parsed["humidity"]))
        if isinstance(parsed.get("brightness"), (int, float)):
            totals["mood_light_brightness"].append(float(parsed["brightness"]))
        if isinstance(parsed.get("fan"), (int, float)):
            totals["aircon_fan"].append(float(parsed["fan"]))
        if isinstance(parsed.get("speed"), (int, float)):
            totals["air_purifier_speed"].append(float(parsed["speed"]))

    def avg(values):
        return round(sum(values) / len(values), 1) if values else None

    return {
        "target_temperature": avg(totals["temperature"]),
        "target_humidity": avg(totals["humidity"]),
        "mood_light_brightness": avg(totals["mood_light_brightness"]),
        "aircon_fan": avg(totals["aircon_fan"]),
        "air_purifier_speed": avg(totals["air_purifier_speed"]),
    }


def diary_environment_average(db: Session):
    temp, humidity = db.query(
        func.avg(models.DiaryLog.temperature_ambient),
        func.avg(models.DiaryLog.humidity_ambient),
    ).first()
    return {
        "felt_temperature": round(float(temp), 1) if temp is not None else None,
        "felt_humidity": round(float(humidity), 1) if humidity is not None else None,
    }


@router.get("/api/admin/overview/{admin_identifier}")
def get_admin_overview(admin_identifier: str, db: Session = Depends(database.get_db)):
    get_admin_user(admin_identifier, db)

    users = db.query(models.User).order_by(models.User.id.desc()).all()
    posts = (
        db.query(
            models.CommunityPost,
            models.User.name.label("author_name"),
            func.count(models.CommunityComment.comment_id).label("comment_count"),
        )
        .outerjoin(models.User, models.CommunityPost.user_id == models.User.id)
        .outerjoin(models.CommunityComment, models.CommunityPost.post_id == models.CommunityComment.post_id)
        .group_by(models.CommunityPost.post_id, models.User.name)
        .order_by(models.CommunityPost.created_at.desc())
        .limit(30)
        .all()
    )

    post_payloads = []
    for post, author_name, comment_count in posts:
        comments = (
            db.query(models.CommunityComment, models.User.name.label("author_name"))
            .outerjoin(models.User, models.CommunityComment.user_id == models.User.id)
            .filter(models.CommunityComment.post_id == post.post_id)
            .order_by(models.CommunityComment.created_at.asc())
            .limit(10)
            .all()
        )
        post_payloads.append({
            "post_id": int(post.post_id),
            "user_id": int(post.user_id) if post.user_id else None,
            "author": author_name or "익명",
            "pregnancy_period": post.pregnancy_period,
            "title": post.title,
            "content": post.content,
            "created_at": post.created_at.isoformat() if post.created_at else None,
            "comment_count": int(comment_count or 0),
            "comments": [
                {
                    "comment_id": int(comment.comment_id),
                    "post_id": int(comment.post_id),
                    "user_id": int(comment.user_id) if comment.user_id else None,
                    "author": comment_author or "익명",
                    "content": comment.content,
                    "created_at": comment.created_at.isoformat() if comment.created_at else None,
                }
                for comment, comment_author in comments
            ],
        })

    period_distribution = [
        {"label": label or "미지정", "count": int(count)}
        for label, count in db.query(models.CommunityPost.pregnancy_period, func.count(models.CommunityPost.post_id))
        .group_by(models.CommunityPost.pregnancy_period)
        .all()
    ]
    emotion_distribution = [
        {"label": label or "미지정", "count": int(count)}
        for label, count in db.query(models.DiaryLog.selected_emotion, func.count(models.DiaryLog.diary_id))
        .group_by(models.DiaryLog.selected_emotion)
        .all()
    ]
    appliance_distribution = [
        {"label": label or "미지정", "count": int(count)}
        for label, count in db.query(models.ApplianceSetting.appliance_name, func.count(models.ApplianceSetting.setting_id))
        .group_by(models.ApplianceSetting.appliance_name)
        .all()
    ]
    text_analysis = analyze_community_text(community_texts(db), [], limit=10)

    return {
        "status": "Success",
        "stats": {
            "total_users": db.query(models.User).count(),
            "pregnant_users": db.query(models.User).filter(func.upper(models.User.role) == "PREGNANT").count(),
            "guardian_users": db.query(models.User).filter(func.upper(models.User.role) == "GUARDIAN").count(),
            "community_posts": db.query(models.CommunityPost).count(),
            "community_comments": db.query(models.CommunityComment).count(),
            "diary_logs": db.query(models.DiaryLog).count(),
            "today_active_users": today_active_user_count(db),
            "status_checks": db.query(models.PregnancyStatusCheck).count(),
            "guardian_missions": db.query(models.GuardianMission).count(),
            "appliance_settings": db.query(models.ApplianceSetting).count(),
        },
        "users": [user_payload(user) for user in users],
        "posts": post_payloads,
        "analytics": {
            "period_distribution": period_distribution,
            "emotion_distribution": emotion_distribution,
            "appliance_distribution": appliance_distribution,
            "keyword_distribution": [{"label": row["word"], "count": row["count"]} for row in text_analysis["top_words"]],
            "environment_average": diary_environment_average(db),
            "appliance_average": appliance_average_settings(db),
        },
    }


@router.post("/api/admin/community/analyze/{admin_identifier}")
def analyze_admin_community(
    admin_identifier: str,
    payload: CommunityAnalyzeRequest,
    db: Session = Depends(database.get_db),
):
    get_admin_user(admin_identifier, db)
    analysis = analyze_community_text(community_texts(db), payload.stopwords, limit=50)
    return {"status": "Success", "analysis": analysis}


@router.delete("/api/admin/users/{user_id}")
def admin_delete_user(user_id: int, admin_identifier: str = Query(...), db: Session = Depends(database.get_db)):
    admin = get_admin_user(admin_identifier, db)
    if admin.id == user_id:
        raise HTTPException(status_code=400, detail="관리자 본인 계정은 삭제할 수 없습니다.")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="회원을 찾을 수 없습니다.")

    diary_ids = [row.diary_id for row in db.query(models.DiaryLog.diary_id).filter(models.DiaryLog.user_id == user_id).all()]
    if diary_ids:
        db.query(models.AiAnalysisResult).filter(models.AiAnalysisResult.diary_id.in_(diary_ids)).delete(synchronize_session=False)
    db.query(models.CommunityComment).filter(models.CommunityComment.user_id == user_id).delete()
    post_ids = [row.post_id for row in db.query(models.CommunityPost.post_id).filter(models.CommunityPost.user_id == user_id).all()]
    if post_ids:
        db.query(models.CommunityComment).filter(models.CommunityComment.post_id.in_(post_ids)).delete(synchronize_session=False)
    db.query(models.CommunityPost).filter(models.CommunityPost.user_id == user_id).delete()
    db.query(models.SmallTalkAnswer).filter(models.SmallTalkAnswer.user_id == user_id).delete()
    db.query(models.DiaryLog).filter(models.DiaryLog.user_id == user_id).delete()
    db.query(models.ApplianceSetting).filter(models.ApplianceSetting.user_id == user_id).delete()
    db.query(models.GuardianMission).filter(models.GuardianMission.user_id == user_id).delete()
    db.query(models.PregnancyStatusCheck).filter(models.PregnancyStatusCheck.user_id == user_id).delete()
    db.query(models.UserCarePreference).filter(models.UserCarePreference.user_id == user_id).delete()
    db.delete(user)
    db.commit()
    return {"status": "Success"}


@router.delete("/api/admin/community/posts/{post_id}")
def admin_delete_post(post_id: int, admin_identifier: str = Query(...), db: Session = Depends(database.get_db)):
    get_admin_user(admin_identifier, db)
    post = db.query(models.CommunityPost).filter(models.CommunityPost.post_id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    db.query(models.CommunityComment).filter(models.CommunityComment.post_id == post_id).delete()
    db.delete(post)
    db.commit()
    return {"status": "Success"}


@router.delete("/api/admin/community/comments/{comment_id}")
def admin_delete_comment(comment_id: int, admin_identifier: str = Query(...), db: Session = Depends(database.get_db)):
    get_admin_user(admin_identifier, db)
    comment = db.query(models.CommunityComment).filter(models.CommunityComment.comment_id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")
    db.delete(comment)
    db.commit()
    return {"status": "Success"}
