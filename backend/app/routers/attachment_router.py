# app/routers/attachment_router.py
from typing import List
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services import attachment_service
from app.utils.token import get_current_user

router = APIRouter(prefix="/attachments", tags=["attachments"])


# ---------------------------------------------------------------------
# 공통 에러 핸들러
# ---------------------------------------------------------------------
def _error(msg: str, code=status.HTTP_400_BAD_REQUEST):
    raise HTTPException(status_code=code, detail=msg)


# ---------------------------------------------------------------------
# ✅ 첨부파일 목록 (프로젝트/태스크)
# ---------------------------------------------------------------------
@router.get("/project/{project_id}", response_model=List[schemas.attachment.Attachment])
def list_project_attachments(project_id: int, db: Session = Depends(get_db)):
    try:
        return attachment_service.get_attachments_by_project(db, project_id)
    except Exception as e:
        _error(str(e))


@router.get("/task/{task_id}", response_model=List[schemas.attachment.Attachment])
def list_task_attachments(task_id: int, db: Session = Depends(get_db)):
    try:
        return attachment_service.get_attachments_by_task(db, task_id)
    except Exception as e:
        _error(str(e))


# ---------------------------------------------------------------------
# ✅ 첨부파일 업로드
# ---------------------------------------------------------------------
@router.post("/", response_model=schemas.attachment.Attachment)
def upload_attachment(
    project_id: int | None = None,
    task_id: int | None = None,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    try:
        return attachment_service.upload_attachment(db, project_id, task_id, file, current_user)
    except Exception as e:
        _error(str(e))


# ---------------------------------------------------------------------
# ✅ 첨부파일 삭제
# ---------------------------------------------------------------------
@router.delete("/{attachment_id}")
def delete_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    try:
        return attachment_service.delete_attachment(db, attachment_id, current_user)
    except Exception as e:
        _error(str(e))
