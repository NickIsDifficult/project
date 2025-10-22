from datetime import date, datetime
from typing import Annotated, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_serializer

from app.models.enums import (
    MemberRole,
    MilestoneStatus,
    ProjectStatus,
    TaskPriority,
    TaskStatus,
)
from app.schemas.employee import Employee


# ============================================================
# 🧱 Base Utilities
# ============================================================
def _serialize_date(v: Optional[date], _info):
    return v.strftime("%Y-%m-%d") if v else None


def _serialize_datetime(v: Optional[datetime], _info):
    return v.strftime("%Y-%m-%d %H:%M:%S") if v else None


# ============================================================
# 🧩 ProjectMember
# ============================================================
class ProjectMemberBase(BaseModel):
    emp_id: int
    role: MemberRole = MemberRole.MEMBER


class ProjectMember(ProjectMemberBase):
    project_id: int
    employee: Optional[Employee] = None
    model_config = ConfigDict(from_attributes=True)


# ============================================================
# 🧩 TaskComment
# ============================================================
class TaskCommentBase(BaseModel):
    content: str


class TaskCommentCreate(TaskCommentBase):
    pass


class TaskComment(TaskCommentBase):
    comment_id: int
    project_id: int
    task_id: int
    emp_id: Optional[int] = None
    author_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    _ser_dt = field_serializer("created_at", "updated_at", when_used="always")(
        _serialize_datetime
    )
    model_config = ConfigDict(from_attributes=True)


# ============================================================
# 🧩 TaskMember
# ============================================================
class TaskMember(BaseModel):
    emp_id: int
    assigned_at: Optional[datetime] = None
    employee: Optional[Employee] = None

    _ser_dt = field_serializer("assigned_at", when_used="always")(_serialize_datetime)
    model_config = ConfigDict(from_attributes=True)


# ============================================================
# 🧩 Task
# ============================================================
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.PLANNED
    priority: TaskPriority = TaskPriority.MEDIUM
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    estimate_hours: float = 0.0
    progress: Annotated[int, Field(ge=0, le=100)] = 0

    _ser_date = field_serializer("start_date", "due_date", when_used="always")(
        _serialize_date
    )


class TaskCreate(TaskBase):
    project_id: int
    parent_task_id: Optional[int] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    estimate_hours: Optional[float] = None
    progress: Optional[int] = None

    _ser_date = field_serializer("start_date", "due_date", when_used="always")(
        _serialize_date
    )


class Task(TaskBase):
    task_id: int
    project_id: int
    assignee_ids: Optional[List[int]] = []
    taskmember: List[TaskMember] = Field(default_factory=list)  # ✅ 관계명 일치
    taskcomment: List[TaskComment] = Field(default_factory=list)  # ✅ 관계명 일치
    subtask: List["Task"] = Field(default_factory=list)  # ✅ 관계명 일치

    model_config = ConfigDict(from_attributes=True)


class TaskStatusUpdate(BaseModel):
    status: TaskStatus
    model_config = ConfigDict(from_attributes=True)


# ============================================================
# 🧩 Milestone
# ============================================================
class MilestoneBase(BaseModel):
    name: str
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: MilestoneStatus = MilestoneStatus.PLANNED

    _ser_date = field_serializer("due_date", when_used="always")(_serialize_date)


class MilestoneCreate(MilestoneBase):
    project_id: int


class Milestone(MilestoneBase):
    milestone_id: int
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

    _ser_date = field_serializer("start_date", "end_date", when_used="always")(
        _serialize_date
    )
    model_config = ConfigDict(from_attributes=True)


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    project_name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[ProjectStatus] = None
    owner_emp_id: Optional[int] = None

    _ser_date = field_serializer("start_date", "end_date", when_used="always")(
        _serialize_date
    )
    model_config = ConfigDict(from_attributes=True, extra="ignore")


class Project(ProjectBase):
    project_id: int
    projectmember: List[ProjectMember] = Field(default_factory=list)  # ✅ 관계명 일치
    task: List[Task] = Field(default_factory=list)  # ✅ 관계명 일치
    milestone: List[Milestone] = Field(default_factory=list)  # ✅ 관계명 일치
    taskcomment: List[TaskComment] = Field(default_factory=list)  # ✅ 관계명 일치
    owner_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    _ser_dt = field_serializer("created_at", "updated_at", when_used="always")(
        _serialize_datetime
    )
    model_config = ConfigDict(from_attributes=True)


# ============================================================
# 🕓 TaskHistory
# ============================================================
class TaskHistory(BaseModel):
    history_id: int
    task_id: int
    old_status: TaskStatus
    new_status: TaskStatus
    changed_by: Optional[int] = None
    changed_at: datetime

    _ser_dt = field_serializer("changed_at", when_used="always")(_serialize_datetime)
    model_config = ConfigDict(from_attributes=True)


# ============================================================
# 🌳 TaskTree (트리형 구조 전용)
# ============================================================
class TaskTree(BaseModel):
    task_id: int
    project_id: int
    title: str
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    progress: Optional[int] = 0
    assignees: List[dict] = []  # [{ "emp_id": int, "name": str }]
    subtasks: List["TaskTree"] = []

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# 🧩 ProjectFullCreate (프로젝트 + 태스크 + 멤버 동시 생성)
# ============================================================
class ProjectFullCreate(ProjectCreate):

    members: Optional[List[ProjectMemberBase]] = None
    tasks: Optional[List[TaskCreate]] = None


# forward refs
Task.model_rebuild()
TaskTree.model_rebuild()
