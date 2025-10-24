# app/schemas/department.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# -------------------------------
# 기본 스키마
# -------------------------------
class DepartmentBase(BaseModel):
    dept_no: str
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

    model_config = {"from_attributes": True}


class DepartmentResponse(Department):
    model_config = {"from_attributes": True}


# -------------------------------
# 권한 스키마
# -------------------------------
class DepartmentPermission(BaseModel):
    dept_id: int
    role_id: int
    permission: str

    model_config = {"from_attributes": True}
