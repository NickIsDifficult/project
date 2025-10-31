# app/services/trash_service.py
from __future__ import annotations

import os
import re
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Tuple

from fastapi import UploadFile, HTTPException
from sqlalchemy import select, inspect
from sqlalchemy.orm import Session

from app.database import engine
from app.models.trash import Trash
from app.schemas.trash import TrashCreate

# 파일 저장 루트(원하면 .env/설정으로 이동 가능)
UPLOAD_ROOT = Path("storage") / "trash"


def _ensure_trash_table() -> None:
    insp = inspect(engine)
    if not insp.has_table(Trash.__tablename__):
        Trash.__table__.create(bind=engine, checkfirst=True)


def _sanitize_filename(name: str) -> str:
    """한글/영문/숫자/._- 만 허용, 공백 -> _"""
    base = re.sub(r"[^\w\.\-\u3131-\u318E\uAC00-\uD7A3 ]+", "", name, flags=re.UNICODE)
    base = base.strip().replace(" ", "_")
    return base or "file"


def _unique_path(dest_dir: Path, filename: str) -> Path:
    dest_dir.mkdir(parents=True, exist_ok=True)
    base = _sanitize_filename(filename)
    name, dot, ext = base.partition(".")
    candidate = dest_dir / base
    i = 1
    while candidate.exists():
        candidate = dest_dir / (f"{name}({i}){dot}{ext}" if dot else f"{name}({i})")
        i += 1
    return candidate


# -----------------------------
# Query / List
# -----------------------------
def list_trash(db: Session) -> List[Trash]:
    _ensure_trash_table()
    rows = db.execute(select(Trash).order_by(Trash.deleted_at.desc())).scalars().all()

    # 보기 안전성: file_path 문자열 정리
    for r in rows:
        fp = r.file_path
        if isinstance(fp, bytes):
            r.file_path = fp.decode("utf-8", errors="ignore")
        elif fp is not None:
            r.file_path = str(fp).strip().strip('"').strip("'")

    return rows


def get_trash_or_404(db: Session, trash_id: int) -> Trash:
    _ensure_trash_table()
    obj = db.get(Trash, trash_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Trash item not found")
    return obj


# -----------------------------
# Create (soft delete meta만 생성)
# -----------------------------
def create_soft_deleted(db: Session, payload: TrashCreate) -> Trash:
    _ensure_trash_table()
    item = Trash(
        title=payload.title,
        table_name=payload.table_name,
        record_id=payload.record_id,
        delete_reason=payload.delete_reason,
        deleted_at=datetime.utcnow(),
        file_path=payload.file_path,
        content_type=payload.content_type,
        size_bytes=payload.size_bytes,
        deleted_by_emp_id=payload.deleted_by_emp_id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


# -----------------------------
# Upload -> Trash
# -----------------------------
def upload_file_to_trash(
    db: Session,
    file: UploadFile,
    table_name: str = "files",
    delete_reason: str = "업로드로 휴지통 이동",
    deleted_by_emp_id: Optional[int] = None,
) -> Trash:
    """
    파일을 휴지통 스토리지에 저장하고 Trash 레코드 생성
    - 실제 서비스에서는 '정상 저장' 후 삭제 시에만 trash로 옮기지만,
      개발 단계에선 업로드 즉시 휴지통으로 넣어 테스트.
    """
    _ensure_trash_table()

    # 1) 저장 경로/파일명
    dest_dir = UPLOAD_ROOT / datetime.utcnow().strftime("%Y%m%d")
    target_path = _unique_path(dest_dir, file.filename or "upload.bin")

    # 2) 저장
    content = file.file.read()
    with target_path.open("wb") as f:
        f.write(content)

    # 3) 메타 생성
    size = target_path.stat().st_size if target_path.exists() else None
    item = Trash(
        title=file.filename or "제목 없음",
        table_name=table_name,
        record_id=int(datetime.utcnow().timestamp()),  # 데모용(실제는 원본 PK 사용)
        deleted_at=datetime.utcnow(),
        delete_reason=delete_reason,
        file_path=str(target_path),
        content_type=file.content_type or None,
        size_bytes=size,
        deleted_by_emp_id=deleted_by_emp_id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


# -----------------------------
# Restore / Purge
# -----------------------------
def restore_item(db: Session, trash_id: int) -> Tuple[bool, Trash]:
    """실제 복원은 도메인별 구현 필요. 여기선 Trash 레코드만 삭제(파일 보존)."""
    item = get_trash_or_404(db, trash_id)
    db.delete(item)
    db.commit()
    return True, item


def purge_item(db: Session, trash_id: int, remove_file: bool = True) -> Tuple[bool, Trash]:
    """
    완전삭제: Trash 레코드 삭제 + (옵션) 파일 삭제
    """
    item = get_trash_or_404(db, trash_id)

    if remove_file and item.file_path:
        try:
            raw = str(item.file_path).strip().strip('"').strip("'")
            p = Path(raw)
            if p.exists():
                if p.is_file():
                    try:
                        os.remove(str(p))  # 윈도우 핸들 문제 방지
                    except PermissionError:
                        import time, gc
                        gc.collect()
                        time.sleep(0.05)
                        os.remove(str(p))
                # 디렉터리/링크면 패스
        except FileNotFoundError:
            pass
        except Exception:
            # 파일 삭제 실패는 레코드 삭제와 분리
            pass

    db.delete(item)
    db.commit()
    return True, item
