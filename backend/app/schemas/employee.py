# app/schemas/employee.py
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


# -------------------------------
# 공통 스키마
# -------------------------------
class EmployeeBase(BaseModel):
    emp_no: str
    dept_id: int
    role_id: int
    dept_no: str                # ✅ 추가됨
    role_no: str                # ✅ 추가됨
    name: str
    email: str
    mobile: str
    hire_date: Optional[date] = None
    birthday: Optional[date] = None


# -------------------------------
# 생성용 (입력)
# -------------------------------
class EmployeeCreate(EmployeeBase):
    pass


# -------------------------------
# 응답용 (조회)
# -------------------------------
class Employee(EmployeeBase):
    emp_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# -------------------------------
# 수정용 (부분 업데이트)
# -------------------------------
class EmployeeUpdate(BaseModel):
    emp_no: Optional[str] = None
    dept_id: Optional[int] = None
    role_id: Optional[int] = None
    dept_no: Optional[str] = None     # ✅ 추가됨
    role_no: Optional[str] = None     # ✅ 추가됨
    name: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    hire_date: Optional[date] = None
    birthday: Optional[date] = None

    model_config = {"from_attributes": True}
