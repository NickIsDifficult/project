# app/schemas/activity_log.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_serializer

from app.models.enums import ActivityAction


# ============================================================
# 🌱 Base
# ============================================================
class ActivityLogBase(BaseModel):
    action: ActivityAction
    detail: Optional[str] = None


# ============================================================
# ✅ 생성용
# ============================================================
class ActivityLogCreate(ActivityLogBase):
    project_id: Optional[int] = None
    task_id: Optional[int] = None
    emp_id: Optional[int] = None


# ============================================================
# ✅ 응답용
# ============================================================
class ActivityLog(ActivityLogBase):
    log_id: int
    emp_id: int
    project_id: Optional[int] = None
    task_id: Optional[int] = None
    created_at: datetime

    @field_serializer("created_at", when_used="always")
    def serialize_datetime(self, v: datetime, _info):
        return v.strftime("%Y-%m-%d %H:%M:%S") if v else None

    model_config = ConfigDict(from_attributes=True)
