from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services import history_service
from app.utils.token import get_current_user

router = APIRouter(prefix="/histories", tags=["task_histories"])


# ------------------------------------------------------------
# 내부 에러 헬퍼
# ------------------------------------------------------------
def _error(msg: str, code=status.HTTP_400_BAD_REQUEST):
    raise HTTPException(status_code=code, detail=msg)


# ------------------------------------------------------------
# ✅ 태스크별 상태 변경 이력 목록
# ------------------------------------------------------------
@router.get("/task/{task_id}", response_model=List[schemas.project.TaskHistory])
def list_task_histories(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    try:
        return history_service.get_histories_by_task(db, task_id)
    except Exception as e:
        _error(str(e))


# ------------------------------------------------------------
# ✅ 프로젝트별 전체 태스크 이력 조회 (관리자용)
# ------------------------------------------------------------
@router.get("/project/{project_id}", response_model=List[schemas.project.TaskHistory])
def list_project_histories(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    try:
        return history_service.get_histories_by_project(db, project_id)
    except Exception as e:
        _error(str(e))


# ------------------------------------------------------------
# ✅ 개별 이력 상세 조회
# ------------------------------------------------------------
@router.get("/{history_id}", response_model=schemas.project.TaskHistory)
def get_history_detail(
    history_id: int,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    try:
        return history_service.get_history_by_id(db, history_id)
    except Exception as e:
        _error(str(e))
