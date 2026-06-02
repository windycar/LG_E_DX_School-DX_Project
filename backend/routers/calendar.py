from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models
import schemas
import database

router = APIRouter(tags=["Calendar"])

@router.get("/api/calendar/events/{connection_code}")
def get_calendar_events(connection_code: str, db: Session = Depends(database.get_db)):
    if not connection_code or connection_code == "None": return {"status": "Success", "events": []}
    events = db.query(models.SharedCalendarEvent).filter(models.SharedCalendarEvent.connection_code == connection_code).all()
    return {"status": "Success", "events": [{"event_id": e.event_id, "event_type": e.event_type, "title": e.title, "content": e.content, "event_date": str(e.event_date)} for e in events]}

@router.post("/api/calendar/events")
def create_calendar_event(event: schemas.EventCreate, db: Session = Depends(database.get_db)):
    db.add(models.SharedCalendarEvent(connection_code=event.connection_code, event_type=event.event_type, title=event.title, content=event.content, event_date=event.event_date))
    db.commit()
    return {"status": "Success"}

@router.delete("/api/calendar/events/{event_id}")
def delete_calendar_event(event_id: int, db: Session = Depends(database.get_db)):
    event = db.query(models.SharedCalendarEvent).filter(models.SharedCalendarEvent.event_id == event_id).first()
    if not event: raise HTTPException(status_code=404, detail="일정을 찾을 수 없습니다.")
    db.delete(event); db.commit()
    return {"status": "Success"}

@router.get("/api/calendar/checkups/{connection_code}")
def get_checkup_dates(connection_code: str, db: Session = Depends(database.get_db)):
    try:
        today = date.today()
        events = db.query(models.SharedCalendarEvent).filter(models.SharedCalendarEvent.connection_code == connection_code, models.SharedCalendarEvent.event_type.in_(["hospital", "ultrasound", "clinic"])).all()
        past_events = [e for e in events if e.event_date and e.event_date <= today]
        future_events = [e for e in events if e.event_date and e.event_date > today]
        recent_event = max(past_events, key=lambda x: x.event_date) if past_events else None
        next_event = min(future_events, key=lambda x: x.event_date) if future_events else None
        def format_date(d): return f"{d.year}년 {d.month}월 {d.day}일" if d else "등록된 일정 없음"
        return {"status": "Success", "recent_checkup": format_date(recent_event.event_date) if recent_event else "등록된 일정 없음", "next_checkup": format_date(next_event.event_date) if next_event else "등록된 일정 없음"}
    except Exception as e: return {"status": "Error", "message": str(e)}