# app/schemas/attachment.py
from datetime import datetime

from pydantic import BaseModel


# -------------------------------
# 📄 기본 스키마 (Base)
# -------------------------------
class AttachmentBase(BaseModel):
    file_name: str
    file_path: str
    file_size: int | None = None
    file_type: str | None = None


# -------------------------------
# ✏️ 생성(Create)
# -------------------------------
class AttachmentCreate(AttachmentBase):
    project_id: int | None = None
    task_id: int | None = None


# -------------------------------
# 🧾 응답(Response)
# -------------------------------
class Attachment(AttachmentBase):
    attachment_id: int
    project_id: int | None = None
    task_id: int | None = None
    uploaded_by: int | None = None
    uploaded_at: datetime
    is_deleted: bool | None = False

    class Config:
        from_attributes = True  # ✅ SQLAlchemy 모델 자동 변환 지원
