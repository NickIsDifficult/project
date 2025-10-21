from typing import Optional, List, Any, Dict, Mapping, Union
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter(prefix="/events", tags=["events"])

# ---------- Schemas ----------
class EventBase(BaseModel):
    project_id: int
    title: str
    description: str = ""
    # 프론트 포맷 그대로 ("YYYY-MM-DD HH:mm")
    start_date: str
    end_date: str

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class EventOut(BaseModel):
    id: int
    project_id: int
    title: str
    description: str
    start_date: str
    end_date: str

class EventSearch(BaseModel):
    project_id: int
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    keyword: Optional[str] = None

# ---------- Helper ----------
def row_to_dict(row: Union[Mapping[str, Any], Any]) -> Dict[str, Any]:
    try:
        if hasattr(row, "_mapping"):
            return dict(getattr(row, "_mapping"))
        elif isinstance(row, Mapping):
            return dict(row)
        else:
            return dict(row)
    except Exception as e:
        return {"_raw": str(row), "_error": str(e)}

# ---------- Routes ----------

# GET /events?project_id=...
@router.get("", response_model=List[EventOut])
def list_events(project_id: int = Query(...), db: Session = Depends(get_db)):
    rows = db.execute(
        text("""
            SELECT id, project_id, title, description, start_date, end_date
            FROM events
            WHERE project_id = :pid
            ORDER BY start_date ASC
        """),
        {"pid": project_id},
    ).fetchall()
    return [row_to_dict(r) for r in rows]

# POST /events  ← 달력 범위/키워드 조회(프론트가 POST로 목록을 요청하는 케이스)
@router.post("", response_model=List[EventOut])
def list_events_post(payload: EventSearch, db: Session = Depends(get_db)):
    sql = """
        SELECT id, project_id, title, description, start_date, end_date
        FROM events
        WHERE project_id = :pid
    """
    params: Dict[str, Any] = {"pid": payload.project_id}
    if payload.start_date:
        sql += " AND end_date >= :start_date"
        params["start_date"] = payload.start_date
    if payload.end_date:
        sql += " AND start_date <= :end_date"
        params["end_date"] = payload.end_date
    if payload.keyword:
        sql += " AND title LIKE :kw"
        params["kw"] = f"%{payload.keyword}%"
    sql += " ORDER BY start_date ASC"
    rows = db.execute(text(sql), params).fetchall()
    return [row_to_dict(r) for r in rows]

# 트레일링 슬래시 호환 (/events/)
@router.get("/", response_model=List[EventOut])
def list_events_slash(project_id: int = Query(...), db: Session = Depends(get_db)):
    return list_events(project_id, db)

@router.post("/", response_model=List[EventOut])
def list_events_post_slash(payload: EventSearch, db: Session = Depends(get_db)):
    return list_events_post(payload, db)

# 생성: POST /events/create  (목록 POST와 경로 충돌 방지)
@router.post("/create", response_model=EventOut, status_code=201)
def create_event(payload: EventCreate, db: Session = Depends(get_db)):
    db.execute(
        text("""
            INSERT INTO events (project_id, title, description, start_date, end_date)
            VALUES (:project_id, :title, :description, :start_date, :end_date)
        """),
        payload.model_dump(),
    )
    new_id = db.execute(text("SELECT LAST_INSERT_ID()")).scalar_one()
    db.commit()

    row = db.execute(
        text("""
            SELECT id, project_id, title, description, start_date, end_date
            FROM events WHERE id = :id
        """),
        {"id": new_id},
    ).mappings().first()
    return row_to_dict(row) if row else {"id": new_id, **payload.model_dump()}

# 수정
@router.put("/{event_id}", response_model=EventOut)
def update_event(event_id: int, payload: EventUpdate, db: Session = Depends(get_db)):
    exists = db.execute(text("SELECT 1 FROM events WHERE id = :id"), {"id": event_id}).first()
    if not exists:
        raise HTTPException(404, "해당 이벤트를 찾을 수 없습니다.")
    updates, params = [], {"id": event_id}
    for f in ["title","description","start_date","end_date"]:
        v = getattr(payload, f)
        if v is not None:
            updates.append(f"{f} = :{f}")
            params[f] = v
    if updates:
        db.execute(text(f"UPDATE events SET {', '.join(updates)} WHERE id = :id"), params)
        db.commit()
    row = db.execute(
        text("""
            SELECT id, project_id, title, description, start_date, end_date
            FROM events WHERE id = :id
        """),
        {"id": event_id},
    ).mappings().first()
    if not row:
        raise HTTPException(404, "해당 이벤트를 찾을 수 없습니다.")
    return row_to_dict(row)

# 삭제
@router.delete("/{event_id}", status_code=204)
def delete_event(event_id: int, db: Session = Depends(get_db)):
    exists = db.execute(text("SELECT 1 FROM events WHERE id = :id"), {"id": event_id}).first()
    if not exists:
        raise HTTPException(404, "해당 이벤트를 찾을 수 없습니다.")
    db.execute(text("DELETE FROM events WHERE id = :id"), {"id": event_id})
    db.commit()
    return None
