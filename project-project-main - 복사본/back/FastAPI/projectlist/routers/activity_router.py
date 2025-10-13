# app/routers/activity_router.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from projectlist import models, schemas
from projectlist.core.auth import get_current_user
from projectlist.core.exceptions import forbidden
from projectlist.database import get_db
from projectlist.services.activity_logger import get_project_activity, get_task_activity, is_project_member

router = APIRouter(prefix="/projects/{project_id}/activity", tags=["activity_feed"])


# -------------------------------
# ✅ 프로젝트 단위 활동 피드 조회
# -------------------------------
@router.get("/", response_model=list[schemas.activity.ActivityFeedItem])
def get_project_activity_feed(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.Member = Depends(get_current_user),
    limit: int = Query(100, le=300),
):
    """
    프로젝트 전체 활동 로그 조회 (댓글, 상태변경, 첨부 등)
    """
    if not is_project_member(db, project_id, current_user.emp_id):
        forbidden("이 프로젝트의 활동 피드를 볼 권한이 없습니다.")

    return get_project_activity(db, project_id, limit)


# -------------------------------
# ✅ 업무 단위 활동 피드 조회
# -------------------------------
@router.get("/tasks/{task_id}", response_model=list[schemas.activity.ActivityFeedItem])
def get_task_activity_feed(
    project_id: int,
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.Member = Depends(get_current_user),
    limit: int = Query(100, le=300),
):
    """
    개별 업무(Task) 단위의 활동 로그 조회
    """
    if not is_project_member(db, project_id, current_user.emp_id):
        forbidden("이 프로젝트의 활동 피드를 볼 권한이 없습니다.")

    return get_task_activity(db, project_id, task_id, limit)
