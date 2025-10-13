from pydantic import BaseModel
from typing import Optional
from datetime import date

# Project 모델
class ProjectCreate(BaseModel):
    project_name: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

# Task 모델
class TaskCreate(BaseModel):
    project_id: int
    title: str
    description: Optional[str] = None
    assignee_emp_id: Optional[int] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
