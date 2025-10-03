from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_serializer
from app.models.activity import ActivityAction


class ActivityLogSchema(BaseModel):
    log_id: int
    emp_id: int
    project_id: Optional[int]
    task_id: Optional[int]
    action: ActivityAction  # ✅ Enum 타입 반영
    detail: Optional[str] = None
    created_at: datetime

    @field_serializer("created_at", when_used="always")
    def serialize_datetime(self, v: datetime, _info):
        return v.strftime("%Y-%m-%d %H:%M:%S")

    model_config = {"from_attributes": True}


class ActivityFeedItem(BaseModel):
    created_at: datetime
    emp_id: int
    task_id: Optional[int] = None
    type: str
    detail: Optional[str] = None

    @field_serializer("created_at", when_used="always")
    def serialize_datetime(self, v: datetime, _info):
        return v.strftime("%Y-%m-%d %H:%M:%S")

    model_config = {"from_attributes": True}
