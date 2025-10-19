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
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# -------------------------------
# 수정용 (부분 업데이트)
# -------------------------------
class EmployeeUpdate(BaseModel):
    emp_no: Optional[str] = None
    dept_id: Optional[int] = None
    role_id: Optional[int] = None
    name: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    hire_date: Optional[date] = None
    birthday: Optional[date] = None
