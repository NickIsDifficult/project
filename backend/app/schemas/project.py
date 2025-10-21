# app/schemas/project.py
from datetime import date, datetime
from typing import Annotated, List, Optional
from pydantic import BaseModel, Field, field_serializer, field_validator

from app.models.enums import (
    MemberRole,
    MilestoneStatus,
    ProjectStatus,
    TaskPriority,
    TaskStatus,
)

# =====================================
# ✅ Employee (간단 정보)
# =====================================
class EmployeeSimple(BaseModel):
    emp_id: int
    name: Optional[str] = None   # ✅ 선택적 필드
    model_config = {"from_attributes": True}


# =====================================
# ✅ Project Base
# =====================================
class ProjectBase(BaseModel):
    title: Optional[str] = None  # ✅ 필수 → 선택적 변경
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[ProjectStatus] = ProjectStatus.PLANNED

    @field_serializer("start_date", "end_date", when_used="always")
    def serialize_date(self, v: Optional[date], _info):
        return v.strftime("%Y-%m-%d") if v else None


# =====================================
# ✅ Task 관련
# =====================================
class TaskBase(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = TaskStatus.TODO
    priority: Optional[TaskPriority] = TaskPriority.MEDIUM
    assignee_emp_id: Optional[int] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    estimate_hours: Optional[float] = 0.0
    progress: Optional[Annotated[int, Field(ge=0, le=100)]] = 0


class TaskCreate(TaskBase):
    project_id: int
    parent_task_id: Optional[int] = None

    @field_validator("priority", mode="before")
    def normalize_priority(cls, v):
        return v.upper() if isinstance(v, str) else v

    @field_validator("status", mode="before")
    def normalize_status(cls, v):
        return v.upper() if isinstance(v, str) else v


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assignee_emp_id: Optional[int] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    estimate_hours: Optional[float] = None
    progress: Optional[Annotated[int, Field(ge=0, le=100)]] = None

    @field_validator("start_date", "due_date", mode="before")
    def empty_str_to_none(cls, v):
        return None if v in ("", None, "") else v


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class TaskSimple(TaskBase):
    task_id: int
    project_id: int
    assignee_name: Optional[str] = None
    model_config = {"from_attributes": True}


class TaskTree(BaseModel):
    task_id: int
    project_id: int
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    assignees: List[EmployeeSimple] = []
    progress: Optional[int] = 0
    subtasks: List["TaskTree"] = []

    class Config:
        from_attributes = True


TaskTree.model_rebuild()


# =====================================
# ✅ Task Comment
# =====================================
class TaskCommentBase(BaseModel):
    content: str
    parent_comment_id: Optional[int] = None


class TaskCommentCreate(TaskCommentBase):
    pass


class TaskComment(TaskCommentBase):
    comment_id: int
    project_id: Optional[int] = None
    task_id: int
    emp_id: Optional[int] = None
    author_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    @field_serializer("created_at", "updated_at", when_used="always")
    def serialize_datetime(self, v: Optional[datetime], _info):
        return v.strftime("%Y-%m-%d %H:%M:%S") if v else None

    model_config = {"from_attributes": True}


# =====================================
# ✅ Project Member
# =====================================
class ProjectMemberBase(BaseModel):
    emp_id: int
    role: Optional[MemberRole] = MemberRole.MEMBER


class ProjectMember(ProjectMemberBase):
    project_id: Optional[int] = None   # ✅ 필수 → 선택적
    name: Optional[str] = None         # ✅ 이름 누락 방지
    model_config = {"from_attributes": True}


# =====================================
# ✅ Milestone
# =====================================
class MilestoneBase(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: MilestoneStatus = MilestoneStatus.PLANNED


class MilestoneCreate(MilestoneBase):
    project_id: int


class Milestone(MilestoneBase):
    milestone_id: int
    project_id: int
    model_config = {"from_attributes": True}


# =====================================
# ✅ Project (단일 / 계층형)
# =====================================
class Project(ProjectBase):
    project_id: int
    owner_emp_id: Optional[int] = None
    members: List[ProjectMember] = []  # ✅ ProjectMember 구조로 통일
    tasks: List[TaskTree] = []
    milestones: List[Milestone] = []
    model_config = {"from_attributes": True}


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[ProjectStatus] = None
    owner_emp_id: Optional[int] = None

    @field_validator("start_date", "end_date", mode="before")
    def empty_str_to_none(cls, v):
        return None if v in ("", None, "") else v

    model_config = {"from_attributes": True}
