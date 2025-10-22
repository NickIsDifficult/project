from __future__ import annotations
from sqlalchemy.orm import Session
from typing import List, Optional
from app import models, schemas
from app.core.exceptions import bad_request, not_found


# ============================================================
# ✅ 태스크 상태 변경 이력 생성
# ============================================================
def create_task_history(
    db: Session,
    task_id: int,
    old_status: models.enums.TaskStatus,
    new_status: models.enums.TaskStatus,
    changed_by: Optional[int],
):
    """태스크 상태 변경 이력 기록"""
    try:
        history = models.TaskHistory(
            task_id=task_id,
            old_status=old_status,
            new_status=new_status,
            changed_by=changed_by,
        )
        db.add(history)
        db.commit()
        db.refresh(history)
        return history
    except Exception as e:
        db.rollback()
        bad_request(f"태스크 이력 생성 실패: {str(e)}")


# ============================================================
# ✅ 특정 태스크의 상태 이력 조회
# ============================================================
def get_histories_by_task(db: Session, task_id: int) -> List[models.TaskHistory]:
    """태스크별 상태 변경 이력 목록"""
    histories = (
        db.query(models.TaskHistory)
        .filter(models.TaskHistory.task_id == task_id)
        .order_by(models.TaskHistory.changed_at.desc())
        .all()
    )
    return histories


# ============================================================
# ✅ 개별 이력 상세 조회
# ============================================================
def get_history_by_id(db: Session, history_id: int) -> models.TaskHistory:
    """단일 이력 상세 조회"""
    history = (
        db.query(models.TaskHistory)
        .filter(models.TaskHistory.history_id == history_id)
        .first()
    )
    if not history:
        not_found("해당 이력 기록을 찾을 수 없습니다.")
    return history


# ============================================================
# ✅ 특정 프로젝트 내 모든 태스크 이력 조회 (옵션)
# ============================================================
def get_histories_by_project(db: Session, project_id: int) -> List[models.TaskHistory]:
    """프로젝트 내 전체 태스크 이력 (관리자용)"""
    histories = (
        db.query(models.TaskHistory)
        .join(models.Task)
        .filter(models.Task.project_id == project_id)
        .order_by(models.TaskHistory.changed_at.desc())
        .all()
    )
    return histories
