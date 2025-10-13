# app/services/activity_logger.py
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from projectlist import models


# -------------------------------
# ✅ 공통 유틸: 활동 로그 기록 함수
# -------------------------------
def log_activity(
    db: Session,
    emp_id: int,
    project_id: int | None,
    task_id: int | None,
    action: models.ActivityAction,
    detail: str | None = None,
):
    """
    모든 주요 이벤트에서 호출할 수 있는 활동 로그 기록 함수.
    예: 댓글 작성, 상태 변경, 업무 생성, 첨부파일 업로드 등
    """
    log = models.ActivityLog(
        emp_id=emp_id,
        project_id=project_id,
        task_id=task_id,
        action=action,
        detail=detail,
        created_at=datetime.utcnow(),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


# -------------------------------
# ✅ 프로젝트 단위 활동 피드 조회
# -------------------------------
def get_project_activity(db: Session, project_id: int, limit: int = 100):
    logs = (
        db.query(models.ActivityLog)
        .join(models.Employee, models.Employee.emp_id == models.ActivityLog.emp_id)
        .filter(models.ActivityLog.project_id == project_id)
        .order_by(models.ActivityLog.created_at.desc())
        .limit(limit)
        .all()
    )

    result = []
    for log in logs:
        result.append(
            {
                "log_id": log.log_id,
                "action": log.action,
                "detail": log.detail,
                "created_at": log.created_at,
                "task_id": log.task_id,
                "emp_id": log.emp_id,
                "emp_name": (
                    getattr(log, "employee", None).name
                    if getattr(log, "employee", None)
                    else "시스템"
                ),
            }
        )
    return result


# -------------------------------
# ✅ 업무 단위 활동 피드 조회
# -------------------------------
def get_task_activity(db: Session, project_id: int, task_id: int, limit: int = 100):
    logs = (
        db.query(models.ActivityLog)
        .join(models.Employee, models.Employee.emp_id == models.ActivityLog.emp_id)
        .filter(models.ActivityLog.project_id == project_id)
        .filter(models.ActivityLog.task_id == task_id)
        .order_by(models.ActivityLog.created_at.desc())
        .limit(limit)
        .all()
    )

    result = []
    for log in logs:
        result.append(
            {
                "log_id": log.log_id,
                "action": log.action,
                "detail": log.detail,
                "created_at": log.created_at,
                "task_id": log.task_id,
                "emp_id": log.emp_id,
                "emp_name": (
                    getattr(log, "employee", None).name
                    if getattr(log, "employee", None)
                    else "시스템"
                ),
            }
        )
    return result


# -------------------------------
# ✅ 권한 확인 유틸
# -------------------------------
def is_project_member(db: Session, project_id: int, emp_id: int) -> bool:
    exists = (
        db.query(models.ProjectMember)
        .filter(
            models.ProjectMember.project_id == project_id,
            models.ProjectMember.emp_id == emp_id,
        )
        .first()
    )
    return bool(exists)
