# app/services/event_service.py
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import HTTPException
from sqlalchemy import inspect, select, update as sa_update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import models  # Project 모델 접근
from app.models.event import Event
from app.schemas.event import EventCreate, EventSearch, EventUpdate

_FMT = "%Y-%m-%d %H:%M"  # 프런트 기본 포맷 ("YYYY-MM-DD HH:mm")

# ================================================================
# 유틸
# ================================================================


def _to_dt(v: Any, field: str) -> datetime:
    """datetime | str(ISO 또는 'YYYY-MM-DD HH:mm') -> naive datetime(UTC 기준)"""
    if v is None:
        raise HTTPException(status_code=422, detail=f"'{field}'가 비어 있습니다.")
    if isinstance(v, datetime):
        return v.astimezone(timezone.utc).replace(tzinfo=None) if v.tzinfo else v

    if isinstance(v, str):
        s = v.strip()
        # ISO 먼저
        try:
            if s.endswith("Z"):
                s = s[:-1] + "+00:00"
            dt = datetime.fromisoformat(s)
            if dt.tzinfo is not None:
                dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
            return dt
        except Exception:
            pass
        # "YYYY-MM-DD HH:mm"
        try:
            return datetime.strptime(s, _FMT)
        except Exception:
            pass

    raise HTTPException(
        status_code=422,
        detail=f"'{field}' 형식이 올바르지 않습니다. ISO 또는 '{_FMT}' 사용",
    )


def _assert_range(start_dt: datetime, end_dt: datetime) -> None:
    if end_dt < start_dt:
        raise HTTPException(status_code=400, detail="end_date가 start_date보다 빠릅니다.")


def _model_dump(model: Any, *, exclude_unset: bool = False) -> Dict[str, Any]:
    """Pydantic v1/v2 호환"""
    if hasattr(model, "model_dump"):
        return model.model_dump(exclude_unset=exclude_unset)  # v2
    if hasattr(model, "dict"):
        return model.dict(exclude_unset=exclude_unset)  # v1
    return dict(model)


def _format_for_column(model_cls, col_name: str, dt: datetime):
    """DateTime 컬럼은 datetime, String 컬럼은 'YYYY-MM-DD HH:mm' 문자열로 변환"""
    try:
        col = model_cls.__table__.columns[col_name]
        py = col.type.python_type
        if py is datetime:
            return dt
        if py is str:
            return dt.strftime(_FMT)
    except Exception:
        pass
    return dt


def _pick_datetime_cols() -> Dict[str, str]:
    """시작/종료 컬럼명 동적 결정: start_date/end_date -> start_dt/end_dt -> start/end"""
    mapper = inspect(Event)
    cols = {c.key for c in mapper.mapper.column_attrs}
    start_col = (
        "start_date" if "start_date" in cols else ("start_dt" if "start_dt" in cols else "start")
    )
    end_col = "end_date" if "end_date" in cols else ("end_dt" if "end_dt" in cols else "end")
    return {"start": start_col, "end": end_col}


def _normalize_description(desc: Any):
    """빈 문자열을 None으로 치환 (NOT NULL 방지)"""
    if desc is None:
        return None
    if isinstance(desc, str) and desc.strip() == "":
        return None
    return desc


def _integrity_message(e: IntegrityError) -> str:
    msg = str(getattr(e, "orig", e)).lower()
    if "foreign key" in msg or "a foreign key constraint fails" in msg:
        return "유효하지 않은 project_id 입니다. 프로젝트가 존재하는지 확인하세요."
    if "cannot be null" in msg or "null value in column" in msg:
        return "필수 컬럼에 null이 들어왔습니다. title/start_date/end_date 등을 확인하세요."
    if "data too long" in msg or "value too long" in msg:
        return "문자열 길이 제약을 초과했습니다. title/description 길이를 줄이세요."
    return "이벤트 제약조건 위반"


# ---------------------- Project PK 안전 탐지 ----------------------


def _pid_attr() -> str:
    """Project PK 컬럼명 반환"""
    return "project_id" if hasattr(models.Project, "project_id") else "id"


def _pid_col():
    """Project PK 컬럼 객체 반환"""
    return getattr(models.Project, _pid_attr())


def _get_any_project_id(db: Session) -> Optional[int]:
    """하나라도 있는 프로젝트 id 반환 (없으면 None)"""
    pid = _pid_col()
    return db.execute(select(pid).order_by(pid.asc()).limit(1)).scalar_one_or_none()


def _ensure_default_project(db: Session) -> int:
    """프로젝트가 하나도 없으면 기본 프로젝트 생성 후 id 반환"""
    proj = models.Project()
    if hasattr(proj, "name"):
        setattr(proj, "name", "Default Project")
    if hasattr(proj, "title"):
        setattr(proj, "title", "Default Project")
    if hasattr(proj, "description"):
        setattr(proj, "description", "Seeded on demand (event create)")
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return getattr(proj, _pid_attr())


def _resolve_project_id(db: Session, req_pid: int) -> int:
    """요청 pid가 유효하지 않으면 임의의 pid로 대체, 아무것도 없으면 즉시 생성"""
    pid = _pid_col()
    exists = db.scalar(select(pid).where(pid == req_pid))
    if exists:
        return req_pid
    any_pid = _get_any_project_id(db)
    if any_pid is not None:
        return any_pid
    return _ensure_default_project(db)


# ================================================================
# CRUD
# ================================================================


# 조회
def get_events(db: Session, project_id: int) -> List[Event]:
    cols = _pick_datetime_cols()
    start_col = getattr(Event, cols["start"])
    return db.query(Event).filter(Event.project_id == project_id).order_by(start_col.asc()).all()


def search_events(db: Session, payload: EventSearch) -> List[Event]:
    cols = _pick_datetime_cols()
    start_col = getattr(Event, cols["start"])
    end_col = getattr(Event, cols["end"])

    q = db.query(Event).filter(Event.project_id == payload.project_id)
    if payload.start_date:
        q = q.filter(end_col >= _to_dt(payload.start_date, "start_date"))
    if payload.end_date:
        q = q.filter(start_col <= _to_dt(payload.end_date, "end_date"))
    if payload.keyword:
        q = q.filter(Event.title.ilike(f"%{payload.keyword}%"))
    return q.order_by(start_col.asc()).all()


# 생성
def create_event(db: Session, payload: EventCreate) -> Event:
    # 요청 pid가 유효하지 않으면 자동 대체(없으면 즉시 생성)
    final_pid = _resolve_project_id(db, payload.project_id)

    start_dt = _to_dt(payload.start_date, "start_date")
    end_dt = _to_dt(payload.end_date, "end_date")
    _assert_range(start_dt, end_dt)

    cols = _pick_datetime_cols()
    ev = Event(
        project_id=final_pid,
        title=payload.title,
        description=_normalize_description(payload.description),
        **{
            cols["start"]: start_dt,
            cols["end"]: end_dt,
        },
    )
    db.add(ev)
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=_integrity_message(e)) from e

    db.refresh(ev)
    return ev


# 수정
def update_event(db: Session, event_id: int, payload: EventUpdate) -> Optional[Event]:
    ev = db.query(Event).filter(Event.id == event_id).first()
    if not ev:
        raise HTTPException(404, "해당 이벤트를 찾을 수 없습니다.")

    data: Dict[str, Any] = _model_dump(payload, exclude_unset=True)

    cols = _pick_datetime_cols()
    start_attr = cols["start"]
    end_attr = cols["end"]

    start_raw = data.get("start_date", getattr(ev, start_attr))
    end_raw = data.get("end_date", getattr(ev, end_attr))

    start_dt = _to_dt(start_raw, "start_date")
    end_dt = _to_dt(end_raw, "end_date")
    _assert_range(start_dt, end_dt)

    values: Dict[str, Any] = {
        start_attr: _format_for_column(Event, start_attr, start_dt),
        end_attr: _format_for_column(Event, end_attr, end_dt),
    }
    if "title" in data:
        values["title"] = data["title"]
    if "description" in data:
        values["description"] = _normalize_description(data["description"])

    # 타입/속성 불일치 회피를 위해 UPDATE 쿼리 사용
    db.execute(sa_update(Event).where(Event.id == event_id).values(**values))

    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="이벤트 수정 제약조건 위반") from e

    db.refresh(ev)
    return ev


# 삭제
def delete_event(db: Session, event_id: int) -> bool:
    ev = db.query(Event).filter(Event.id == event_id).first()
    if not ev:
        raise HTTPException(404, "해당 이벤트를 찾을 수 없습니다.")
    db.delete(ev)
    db.commit()
    return True
