from typing import Optional, List, Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db

router = APIRouter(prefix="/status", tags=["status"])

class StatusCreate(BaseModel):
    type: str = Field(..., description="상태 유형(휴가/출장/병가/기타 등)")
    start_date: str = Field(..., description="시작일(YYYY-MM-DD HH:mm)")
    end_date: str = Field(..., description="종료일(YYYY-MM-DD HH:mm)")
    username: Optional[str] = Field(None, description="사용자 이름(선택)")  # 컬럼 없으면 제거

def row_to_dict(row) -> Dict[str, Any]:
    return dict(row._mapping) if hasattr(row, "_mapping") else dict(row)

@router.get("", response_model=List[Dict[str, Any]])
def list_status(db: Session = Depends(get_db)):
    rows = db.execute(
        text("""
            SELECT id, type, start_date, end_date, COALESCE(username, '') AS username
            FROM status
            ORDER BY start_date ASC
        """)
    ).fetchall()
    return [row_to_dict(r) for r in rows]

@router.post("", response_model=Dict[str, Any], status_code=201)
def create_status(payload: StatusCreate, db: Session = Depends(get_db)):
    db.execute(
        text("""
            INSERT INTO status (type, start_date, end_date, username)
            VALUES (:type, :start_date, :end_date, :username)
        """),
        payload.model_dump(),
    )
    new_id = db.execute(text("SELECT LAST_INSERT_ID()")).scalar_one()
    db.commit()

    row = db.execute(
        text("""
            SELECT id, type, start_date, end_date, COALESCE(username, '') AS username
            FROM status WHERE id = :id
        """),
        {"id": new_id},
    ).mappings().first()
    return dict(row) if row else {"id": new_id}

@router.delete("/{status_id}", status_code=204)
def delete_status(status_id: int, db: Session = Depends(get_db)):
    # 존재 여부 먼저 확인
    exists = db.execute(
        text("SELECT 1 FROM status WHERE id = :id"),
        {"id": status_id},
    ).first()
    if not exists:
        raise HTTPException(status_code=404, detail="해당 상태를 찾을 수 없습니다.")

    db.execute(text("DELETE FROM status WHERE id = :id"), {"id": status_id})
    db.commit()
    return None
