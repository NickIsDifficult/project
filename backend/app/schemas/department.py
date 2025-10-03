# app/schemas/department.py
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# -------------------------------
# 기본 스키마
# -------------------------------
class DepartmentBase(BaseModel):
    dept_name: str


# -------------------------------
# 생성용 (입력)
# -------------------------------
class DepartmentCreate(DepartmentBase):
    pass


# -------------------------------
# 응답용 (조회)
# -------------------------------
class Department(DepartmentBase):
    dept_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # ✅ Pydantic v2: orm_mode 대체


# -------------------------------
# 룰룰
# -------------------------------
class Role(BaseModel):
    role_id: int
    role_name: str
    role_level: int

    class Config:
        from_attributes = True


class DepartmentPermission(BaseModel):
    dept_id: int
    role_id: int
    permission: str

    class Config:
        from_attributes = True
