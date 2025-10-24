# app/routers/activity_router.py
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services import activity_service
from app.utils.token import get_current_user

router = APIRouter(prefix="/activities", tags=["activity_logs"])


# ------------------------------------------------------------
# 내부 헬퍼
# ------------------------------------------------------------
def _error(msg: str, code=status.HTTP_400_BAD_REQUEST):
    raise HTTPException(status_code=code, detail=msg)


# ------------------------------------------------------------
# ✅ 전체 로그 (관리자용)
# ------------------------------------------------------------
@router.get("/", response_model=List[schemas.activity_log.ActivityLog])
def list_all_logs(
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    try:
        return activity_service.get_all_logs(db)
    except Exception as e:
        _error(str(e))


# ------------------------------------------------------------
# ✅ 프로젝트 단위 로그 조회
# ------------------------------------------------------------
@router.get("/project/{project_id}", response_model=List[schemas.activity_log.ActivityLog])
def list_project_logs(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    try:
        return activity_service.get_logs_by_project(db, project_id)
    except Exception as e:
        _error(str(e))


# ------------------------------------------------------------
# ✅ 태스크 단위 로그 조회
# ------------------------------------------------------------
@router.get("/task/{task_id}", response_model=List[schemas.activity_log.ActivityLog])
def list_task_logs(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    try:
        return activity_service.get_logs_by_task(db, task_id)
    except Exception as e:
        _error(str(e))


# ------------------------------------------------------------
# ✅ 개별 로그 상세 조회
# ------------------------------------------------------------
@router.get("/{log_id}", response_model=schemas.activity_log.ActivityLog)
def get_log_detail(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    try:
        return activity_service.get_log_by_id(db, log_id)
    except Exception as e:
        _error(str(e))
