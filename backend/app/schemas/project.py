# app/schemas/project.py
from datetime import date, datetime
from typing import Annotated, List, Optional
from pydantic import BaseModel, Field, field_serializer, field_validator, ConfigDict

from app.models.enums import (
    MemberRole,
    MilestoneStatus,
    ProjectStatus,
    TaskPriority,
    TaskStatus,
)

# ============================================================
# 🧩 Task Comment
# ============================================================
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

    model_config = ConfigDict(from_attributes=True)

# ============================================================
# 🧩 Task
# ============================================================
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.PLANNED
    priority: TaskPriority = TaskPriority.MEDIUM
    assignee_emp_id: Optional[int] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    estimate_hours: float = 0.0
    progress: Annotated[int, Field(ge=0, le=100)] = 0


class TaskCreate(TaskBase):
    project_id: int
    parent_task_id: Optional[int] = None

    @field_validator("priority", mode="before")
    def normalize_priority(cls, v):
        if isinstance(v, str):
            return v.upper()
        return v

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


class Task(TaskBase):
    task_id: int
    project_id: int
    assignee_name: Optional[str] = None

    @classmethod
    def from_orm(cls, obj):
        data = super().model_validate(obj)
        data.assignee_name = getattr(obj, "assignee_name_prop", None)
        return data

    model_config = ConfigDict(from_attributes=True)


class TaskTree(BaseModel):
    task_id: int
    project_id: int
    title: str
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    assignee_emp_id: Optional[int] = None
    assignee_name: Optional[str] = None
    progress: Optional[int] = 0
    subtasks: List["TaskTree"] = []

    model_config = ConfigDict(from_attributes=True)

# ============================================================
# 🧩 Milestone
# ============================================================
class MilestoneBase(BaseModel):
    name: str
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: MilestoneStatus = MilestoneStatus.PLANNED


class MilestoneCreate(MilestoneBase):
    project_id: int


class Milestone(MilestoneBase):
    milestone_id: int
    project_id: int

    model_config = ConfigDict(from_attributes=True)

# ============================================================
# 🧩 Project Member
# ============================================================
class ProjectMemberBase(BaseModel):
    emp_id: int
    role: MemberRole = MemberRole.MEMBER


class ProjectMember(ProjectMemberBase):
    project_id: int

    model_config = ConfigDict(from_attributes=True)

# ============================================================
# 🧩 Project
# ============================================================
class ProjectBase(BaseModel):
    project_name: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: ProjectStatus = ProjectStatus.PLANNED
    owner_emp_id: Optional[int] = None

    @field_serializer("start_date", "end_date", when_used="always")
    def serialize_date(self, v: Optional[date], _info):
        return v.strftime("%Y-%m-%d") if v else None

    model_config = ConfigDict(from_attributes=True)


# ✅ 생성용
class ProjectCreate(ProjectBase):
    pass


# ✅ 수정용
class ProjectUpdate(BaseModel):
    project_name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    priority: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True,
        extra="ignore"  # ✅ tasks 같은 불필요한 필드 무시
    )


# ✅ 응답용
class Project(ProjectBase):
    project_id: int
    members: List[ProjectMember] = Field(default_factory=list)
    tasks: List[Task] = Field(default_factory=list)
    milestones: List[Milestone] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
