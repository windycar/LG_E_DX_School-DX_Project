from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
import models
import schemas
import database
import smalltalk_service

router = APIRouter(tags=["Smalltalk"])

@router.get("/api/smalltalk/{user_id}")
def get_smalltalk(user_id: int, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user: raise HTTPException(status_code=404)
    
    partner = db.query(models.User).filter(models.User.id == user.parent_user_id).first() if user.parent_user_id else db.query(models.User).filter(models.User.parent_user_id == user.id).first()
    today_topic = smalltalk_service.get_today_topic(db)
    today = date.today()
    
    my_answer_obj = db.query(models.SmallTalkAnswer).filter(
        models.SmallTalkAnswer.topic_id == today_topic.topic_id,
        models.SmallTalkAnswer.user_id == user.id,
        func.date(models.SmallTalkAnswer.created_at) == today,
    ).order_by(models.SmallTalkAnswer.created_at.desc()).first()
    partner_answer_obj = db.query(models.SmallTalkAnswer).filter(
        models.SmallTalkAnswer.topic_id == today_topic.topic_id,
        models.SmallTalkAnswer.user_id == partner.id,
        func.date(models.SmallTalkAnswer.created_at) == today,
    ).order_by(models.SmallTalkAnswer.created_at.desc()).first() if partner else None

    return {
        "status": "Success",
        "topic": {"topic_id": today_topic.topic_id, "question_text": today_topic.question_text},
        "my_answer": my_answer_obj.answer_content if my_answer_obj else None,
        "partner_name": partner.name if partner else "파트너",
        "is_partner_answered": bool(partner_answer_obj),
        "partner_answer": partner_answer_obj.answer_content if (my_answer_obj and partner_answer_obj) else None
    }
    
@router.post("/api/smalltalk/answer")
def submit_smalltalk_answer(ans: schemas.SmallTalkSubmit, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == ans.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(models.SmallTalkAnswer).filter(
        models.SmallTalkAnswer.topic_id == ans.topic_id,
        models.SmallTalkAnswer.user_id == ans.user_id,
        func.date(models.SmallTalkAnswer.created_at) == date.today(),
    ).order_by(models.SmallTalkAnswer.created_at.desc()).first()

    if existing:
        existing.answer_content = ans.answer_content
    else:
        db.add(models.SmallTalkAnswer(
            topic_id=ans.topic_id,
            user_id=ans.user_id,
            connection_code=user.connection_code if user.connection_code else "DEMO_CODE",
            answer_content=ans.answer_content,
        ))
    db.commit()
    return {"status": "Success"}
