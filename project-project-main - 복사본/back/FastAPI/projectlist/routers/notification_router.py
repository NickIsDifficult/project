# app/routers/notification_router.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from projectlist import models, schemas
from projectlist.core.auth import get_current_user
from projectlist.core.exceptions import bad_request, not_found
from projectlist.database import get_db

router = APIRouter(prefix="/notifications", tags=["notifications"])


# -------------------------------
# 내 알림 목록 조회
# -------------------------------
@router.get("/", response_model=schemas.notification.NotificationList)
def get_notifications(
    db: Session = Depends(get_db),
    current_user: models.Member = Depends(get_current_user),
    is_read: bool | None = Query(None),
    ntype: str | None = Query(None),
    limit: int = Query(50, le=200),
):
    """
    로그인한 사용자의 알림을 조회.
    - is_read: 읽음 여부 필터
    - ntype: 알림 유형 필터
    - limit: 최대 표시 개수
    """
    q = db.query(models.Notification).filter(
        models.Notification.recipient_emp_id == current_user.emp_id
    )

    if is_read is not None:
        q = q.filter(models.Notification.is_read == is_read)
    if ntype:
        q = q.filter(models.Notification.type == ntype)

    notifications = q.order_by(models.Notification.created_at.desc()).limit(limit).all()

    total = q.count()
    unread_count = (
        db.query(models.Notification)
        .filter(
            models.Notification.recipient_emp_id == current_user.emp_id,
            models.Notification.is_read == False,
        )
        .count()
    )

    return schemas.notification.NotificationList(
        total=total, unread_count=unread_count, items=notifications
    )


# -------------------------------
# 특정 알림 읽음 처리
# -------------------------------
@router.put("/{notification_id}/read")
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.Member = Depends(get_current_user),
):
    notif = (
        db.query(models.Notification)
        .filter(
            models.Notification.notification_id == notification_id,
            models.Notification.recipient_emp_id == current_user.emp_id,
        )
        .first()
    )
    if not notif:
        not_found(f"알림 ID {notification_id}를 찾을 수 없습니다.")

    notif.is_read = True
    db.commit()

    return {"success": True, "message": f"알림 {notification_id} 읽음 처리 완료"}


# -------------------------------
# 모든 알림 일괄 읽음 처리
# -------------------------------
@router.put("/read/all")
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: models.Member = Depends(get_current_user),
):
    updated_count = (
        db.query(models.Notification)
        .filter(
            models.Notification.recipient_emp_id == current_user.emp_id,
            models.Notification.is_read == False,
        )
        .update({"is_read": True})
    )
    db.commit()
    return {"success": True, "updated": updated_count}


# -------------------------------
# 안 읽은 알림 개수 조회
# -------------------------------
@router.get("/unread/count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: models.Member = Depends(get_current_user),
):
    count = (
        db.query(models.Notification)
        .filter(
            models.Notification.recipient_emp_id == current_user.emp_id,
            models.Notification.is_read == False,
        )
        .count()
    )
    return {"unread_count": count}


# -------------------------------
# 특정 알림 삭제
# -------------------------------
@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.Member = Depends(get_current_user),
):
    notif = (
        db.query(models.Notification)
        .filter(
            models.Notification.notification_id == notification_id,
            models.Notification.recipient_emp_id == current_user.emp_id,
        )
        .first()
    )
    if not notif:
        not_found("삭제할 알림을 찾을 수 없습니다.")

    db.delete(notif)
    db.commit()
    return {"success": True, "message": f"알림 {notification_id} 삭제 완료"}
