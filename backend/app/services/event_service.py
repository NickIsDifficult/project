from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
from typing import List

from app.models.event import Event
from app.schemas.event import EventCreate, EventUpdate, EventSearch


def get_events(db: Session, project_id: int) -> List[Event]:
    return (
        db.query(Event)
        .filter(Event.project_id == project_id)
        .order_by(Event.start_date.asc())
        .all()
    )


def search_events(db: Session, payload: EventSearch) -> List[Event]:
    q = db.query(Event).filter(Event.project_id == payload.project_id)

    if payload.start_date:
        q = q.filter(Event.end_date >= payload.start_date)
    if payload.end_date:
        q = q.filter(Event.start_date <= payload.end_date)
    if payload.keyword:
        q = q.filter(Event.title.like(f"%{payload.keyword}%"))

    return q.order_by(Event.start_date.asc()).all()


def create_event(db: Session, payload: EventCreate) -> Event:
    event = Event(
        project_id=payload.project_id,
        title=payload.title,
        description=payload.description,
        start_date=datetime.fromisoformat(payload.start_date),
        end_date=datetime.fromisoformat(payload.end_date),
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def update_event(db: Session, event_id: int, payload: EventUpdate) -> Event:
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(404, "해당 이벤트를 찾을 수 없습니다.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    db.commit()
    db.refresh(event)
    return event


def delete_event(db: Session, event_id: int):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(404, "해당 이벤트를 찾을 수 없습니다.")
    db.delete(event)
    db.commit()
