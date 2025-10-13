# app/schemas/notification.py
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, field_serializer

from projectlist.models.notification import NotificationType


# ----------------------------------------
# Notification 기본 구조
# ----------------------------------------
class NotificationBase(BaseModel):
    recipient_emp_id: int
    actor_emp_id: int
    project_id: Optional[int] = None
    task_id: Optional[int] = None
    type: NotificationType
    payload: Optional[Any] = None
    is_read: bool = False


# ----------------------------------------
# Notification 생성용
# ----------------------------------------
class NotificationCreate(NotificationBase):
    pass


# ----------------------------------------
# Notification 조회용 (응답)
# ----------------------------------------
class Notification(NotificationBase):
    notification_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    # ✅ Enum → str 변환
    @field_serializer("type", when_used="always")
    def serialize_enum(self, v: NotificationType, _info):
        return v.value if isinstance(v, NotificationType) else v

    # ✅ datetime 직렬화
    @field_serializer("created_at", "updated_at", when_used="always")
    def serialize_datetime(self, v: Optional[datetime], _info):
        return v.strftime("%Y-%m-%d %H:%M:%S") if v else None

    model_config = {"from_attributes": True}


# ----------------------------------------
# Notification 리스트용
# ----------------------------------------
class NotificationList(BaseModel):
    total: int
    unread_count: int
    items: list[Notification]
