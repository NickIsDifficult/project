# app/services/activity_service.py
from __future__ import annotations
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app import models, schemas
from app.core.exceptions import bad_request, not_found


# ============================================================
# ✅ 활동 로그 생성
# ============================================================
def create_activity_log(
    db: Session,
    emp_id: int,
    action: models.enums.ActivityAction,
    project_id: Optional[int] = None,
    task_id: Optional[int] = None,
    detail: Optional[str] = None,
):
    """새로운 활동 로그 생성"""
    try:
        log = models.ActivityLog(
            emp_id=emp_id,
            project_id=project_id,
            task_id=task_id,
            action=action,
            detail=detail,
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log
    except Exception as e:
        db.rollback()
        bad_request(f"활동 로그 생성 실패: {str(e)}")


# ============================================================
# ✅ 개별 로그 조회
# ============================================================
def get_log_by_id(db: Session, log_id: int) -> models.ActivityLog:
    log = db.query(models.ActivityLog).filter(models.ActivityLog.log_id == log_id).first()
    if not log:
        not_found(f"로그 {log_id}를 찾을 수 없습니다.")
    return log


# ============================================================
# ✅ 특정 프로젝트의 활동 로그
# ============================================================
def get_logs_by_project(db: Session, project_id: int) -> List[models.ActivityLog]:
    logs = (
        db.query(models.ActivityLog)
        .options(joinedload(models.ActivityLog.employee))
        .filter(models.ActivityLog.project_id == project_id)
        .order_by(models.ActivityLog.created_at.desc())
        .all()
    )
    return logs


# ============================================================
# ✅ 특정 태스크의 활동 로그
# ============================================================
def get_logs_by_task(db: Session, task_id: int) -> List[models.ActivityLog]:
    logs = (
        db.query(models.ActivityLog)
        .options(joinedload(models.ActivityLog.employee))
        .filter(models.ActivityLog.task_id == task_id)
        .order_by(models.ActivityLog.created_at.desc())
        .all()
    )
    return logs


# ============================================================
# ✅ 전체 로그 (관리자 전용)
# ============================================================
def get_all_logs(db: Session) -> List[models.ActivityLog]:
    return (
        db.query(models.ActivityLog)
        .options(joinedload(models.ActivityLog.employee))
        .order_by(models.ActivityLog.created_at.desc())
        .all()
    )
