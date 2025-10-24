# app/schemas/attachment.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_serializer


# ======================================================
# 📎 Attachment Base
# ======================================================
class AttachmentBase(BaseModel):
    file_name: str
    file_path: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    is_deleted: bool = False


# ======================================================
# 📎 Attachment Create
# ======================================================
class AttachmentCreate(BaseModel):
    project_id: Optional[int] = None
    task_id: Optional[int] = None
    file_name: str
    file_path: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None


# ======================================================
# 📎 Attachment Read
# ======================================================
class Attachment(AttachmentBase):
    attachment_id: int
    project_id: Optional[int] = None
    task_id: Optional[int] = None
    uploaded_by: Optional[int] = None
    uploaded_at: datetime

    @field_serializer("uploaded_at", when_used="always")
    def serialize_datetime(self, v: datetime, _info):
        return v.strftime("%Y-%m-%d %H:%M:%S")

    model_config = ConfigDict(from_attributes=True)
