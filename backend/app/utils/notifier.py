# app/utils/notifier.py
import json
from typing import Iterable, List, Optional

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.notification import Notification, NotificationType


def create_notifications(
    db: Session,
    *,
    recipients: Iterable[int],
    actor_emp_id: int,
    project_id: Optional[int] = None,
    task_id: Optional[int] = None,
    ntype: NotificationType = NotificationType.comment,
    payload: Optional[dict] = None,
    auto_commit: bool = True,
) -> List[Notification]:
    """
    알림(Notification) 생성 유틸.
    - recipients: 알림을 받을 emp_id 목록
    - actor_emp_id: 행동을 한 직원(emp_id)
    - payload: JSON 저장 (댓글 내용, 상태변경 상세 등)
    """

    notifications: list[Notification] = []

    # JSON 직렬화 안전 처리
    if payload and not isinstance(payload, str):
        try:
            payload = json.dumps(payload, ensure_ascii=False)
        except Exception:
            payload = None

    for rid in set(recipients):
        if rid == actor_emp_id:
            continue  # 자기 자신에게는 알림 생략

        notifications.append(
            Notification(
                recipient_emp_id=rid,
                actor_emp_id=actor_emp_id,
                project_id=project_id,
                task_id=task_id,
                type=ntype,
                payload=payload,
            )
        )

    if not notifications:
        return []

    try:
        db.add_all(notifications)
        if auto_commit:
            db.commit()
        return notifications

    except SQLAlchemyError as e:
        db.rollback()
        raise RuntimeError(f"[알림 생성 실패] DB 오류: {str(e)}")
