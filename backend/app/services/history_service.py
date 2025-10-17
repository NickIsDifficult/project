# app/services/history_service.py
from datetime import datetime

from sqlalchemy.orm import Session

from app import models
from app.core.exceptions import not_found
from app.models.project import TaskStatus


def create_task_history(
    db: Session,
    task_id: int,
    old_status: TaskStatus,
    new_status: TaskStatus,
    changed_by: int,
):
    """태스크 상태 변경 시 자동 이력 기록"""
    history = models.TaskHistory(
        task_id=task_id,
        old_status=old_status,
        new_status=new_status,
        changed_by=changed_by,
        changed_at=datetime.utcnow(),
    )
    db.add(history)
    db.commit()
    return history


def get_task_history(db: Session, task_id: int, limit: int = 50):
    """태스크별 이력 조회"""
    return (
        db.query(models.TaskHistory)
        .filter(models.TaskHistory.task_id == task_id)
        .order_by(models.TaskHistory.changed_at.desc())
        .limit(limit)
        .all()
    )


def get_project_history(db: Session, project_id: int, limit: int = 100):
    """프로젝트 전체 이력 조회"""
    task_ids = (
        db.query(models.Task.task_id)
        .filter(models.Task.project_id == project_id)
        .subquery()
    )
    return (
        db.query(models.TaskHistory)
        .filter(models.TaskHistory.task_id.in_(task_ids))
        .order_by(models.TaskHistory.changed_at.desc())
        .limit(limit)
        .all()
    )
