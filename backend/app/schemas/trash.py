from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class TrashBase(BaseModel):
    title: Optional[str] = None
    table_name: str
    record_id: int
    delete_reason: Optional[str] = None

    # 파일 메타(선택)
    file_path: Optional[str] = None
    content_type: Optional[str] = None
    size_bytes: Optional[int] = None

    deleted_by_emp_id: Optional[int] = None


class TrashCreate(TrashBase):
    pass


class TrashOut(TrashBase):
    id: int
    deleted_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"from_attributes": True}
