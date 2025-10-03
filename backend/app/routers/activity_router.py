# app/routers/activity_router.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app import models, schemas
from app.core.auth import get_current_user
from app.core.exceptions import forbidden
from app.database import get_db
from app.services import activity_feed_service

router = APIRouter(prefix="/projects/{project_id}/activity", tags=["activity_feed"])


# -------------------------------
# 프로젝트 활동 피드 조회
# -------------------------------
@router.get("/", response_model=list[schemas.activity.ActivityFeedItem])
def get_project_activity(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.Member = Depends(get_current_user),
    limit: int = Query(100, le=300),
):
    """
    프로젝트 내 활동 로그 / 댓글 / 상태 변경 기록을 최신순으로 조회.
    """
    # ✅ 접근 권한 확인
    if not activity_feed_service.is_project_member(db, project_id, current_user.emp_id):
        forbidden("이 프로젝트의 활동 피드를 볼 권한이 없습니다.")

    # ✅ 피드 가져오기
    feed = activity_feed_service.get_project_activity(db, project_id, limit)
    return feed or []  # 활동이 없을 경우 빈 배열 반환
