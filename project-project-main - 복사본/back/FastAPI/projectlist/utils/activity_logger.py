# app/utils/activity_logger.py
from datetime import datetime

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from projectlist import models
from projectlist.models.activity_log import ActivityAction


def log_task_action(
    db: Session,
    emp_id: int,
    project_id: int | None,
    task_id: int | None,
    action: str,
    detail: str | None = None,
    auto_commit: bool = True,
):
    """
    태스크 관련 활동 로그 기록
    - action: 'commented', 'status_changed', 'task_created', 'task_deleted' 등
    - detail: 상세 설명 문자열
    - project_id, task_id: NULL 허용 (삭제된 태스크도 로그 남기기 위함)
    """

    try:
        # ✅ Enum 유효성 체크
        try:
            action_enum = ActivityAction(action)
        except ValueError:
            action_enum = ActivityAction.unknown if hasattr(ActivityAction, "unknown") else action

        # ✅ 로그 객체 생성
        log = models.ActivityLog(
            emp_id=emp_id,
            project_id=project_id,  # 삭제된 task도 로그 유지 위해 NULL 허용
            task_id=task_id,
            action=action_enum,
            detail=detail,
            created_at=datetime.utcnow(),
        )

        db.add(log)
        if auto_commit:
            db.commit()

    except SQLAlchemyError as e:
        db.rollback()
        raise RuntimeError(f"[활동 로그 생성 실패] {str(e)}")
