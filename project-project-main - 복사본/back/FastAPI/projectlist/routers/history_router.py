# app/routers/history_router.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from projectlist import models, schemas
from projectlist.core.auth import get_current_user
from projectlist.core.exceptions import forbidden, not_found
from projectlist.database import get_db
from projectlist.services import history_service

router = APIRouter(prefix="/tasks/{task_id}/history", tags=["task_history"])


# -------------------------------
# 태스크 이력 조회
# -------------------------------
@router.get("/", response_model=list[schemas.activity.ActivityLogSchema])
def get_task_history(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
    limit: int = Query(50, le=200),
):
    """
    특정 태스크의 상태 변경 / 담당자 변경 / 코멘트 등의 이력을 조회.
    limit 기본 50, 최대 200개.
    """
    # 접근 권한 검사
    if not history_service.is_project_member(db, task_id, current_user.emp_id):
        forbidden("해당 프로젝트의 멤버만 이력에 접근할 수 있습니다.")

    histories = history_service.get_task_history(db, task_id, limit)
    if not histories:
        not_found("이력 정보가 없습니다.")
    return histories


# -------------------------------
# 전체 프로젝트 이력 조회
# -------------------------------
@router.get(
    "/project/{project_id}", response_model=list[schemas.activity.ActivityLogSchema]
)
def get_project_history(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
    limit: int = Query(100, le=300),
):
    """
    프로젝트 전체의 태스크 관련 변경 이력을 조회.
    """
    if not history_service.is_project_member_by_project(
        db, project_id, current_user.emp_id
    ):
        forbidden("해당 프로젝트의 멤버만 접근할 수 있습니다.")

    histories = history_service.get_project_history(db, project_id, limit)
    if not histories:
        not_found("해당 프로젝트의 이력 기록이 없습니다.")
    return histories
