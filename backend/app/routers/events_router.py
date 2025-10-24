# app/routers/events_router.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.event import EventCreate, EventUpdate, EventOut, EventSearch
from app.services import event_service

router = APIRouter(prefix="/events", tags=["events"])

# GET /events
@router.get("", response_model=List[EventOut])
def list_events(project_id: int = Query(...), db: Session = Depends(get_db)):
    return event_service.get_events(db, project_id)


# POST /events (검색)
@router.post("", response_model=List[EventOut])
def list_events_post(payload: EventSearch, db: Session = Depends(get_db)):
    return event_service.search_events(db, payload)


# POST /events/create (등록)
@router.post("/create", response_model=EventOut, status_code=201)
def create_event(payload: EventCreate, db: Session = Depends(get_db)):
    return event_service.create_event(db, payload)


# PUT /events/{id}
@router.put("/{event_id}", response_model=EventOut)
def update_event(event_id: int, payload: EventUpdate, db: Session = Depends(get_db)):
    result = event_service.update_event(db, event_id, payload)
    if not result:
        raise HTTPException(404, "해당 이벤트를 찾을 수 없습니다.")
    return result


# DELETE /events/{id}
@router.delete("/{event_id}", status_code=204)
def delete_event(event_id: int, db: Session = Depends(get_db)):
    ok = event_service.delete_event(db, event_id)
    if not ok:
        raise HTTPException(404, "해당 이벤트를 찾을 수 없습니다.")
    return None
