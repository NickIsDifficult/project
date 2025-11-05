# app/schemas/project.py
from __future__ import annotations

from datetime import date, datetime
from typing import Annotated, List, Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_serializer
from pydantic.alias_generators import to_camel

from app.models.enums import (
    MemberRole,
    MilestoneStatus,
    ProjectStatus,
    TaskPriority,
    TaskStatus,
)
from app.schemas.attachment import Attachment
from app.schemas.employee import Employee


# =========================
# 🔧 Base serializers
# =========================
def _serialize_date(v: Optional[date], _info):
    return v.strftime("%Y-%m-%d") if v else None


def _serialize_datetime(v: Optional[datetime], _info):
    return v.strftime("%Y-%m-%d %H:%M:%S") if v else None


# =========================
# 👥 ProjectMember
# =========================
class ProjectMemberBase(BaseModel):
    emp_id: int
    role: MemberRole = MemberRole.MEMBER


class ProjectMember(ProjectMemberBase):
    project_id: int
    employee: Optional[Employee] = None
    model_config = ConfigDict(from_attributes=True)


# =========================
# 💬 TaskComment
# =========================
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


# =========================
# 👤 TaskMember
# =========================
class TaskMember(BaseModel):
    emp_id: int
    assigned_at: Optional[datetime] = None
    employee: Optional[Employee] = None

    _ser_dt = field_serializer("assigned_at", when_used="always")(_serialize_datetime)
    model_config = ConfigDict(from_attributes=True)


# =========================
# 🧩 Task (Base)
# =========================
class TaskBase(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.PLANNED
    priority: TaskPriority = TaskPriority.MEDIUM
    start_date: Optional[date] = None
    model_config = ConfigDict(from_attributes=True)
    # ✅ due_date <-> end_date 양방향 허용 (입력은 둘 다 OK, 출력은 due_date로 직렬화)
    end_date: Optional[date] = None
    due_date: Optional[date] = Field(
        default=None,
        validation_alias=AliasChoices("due_date", "end_date"),
        serialization_alias="due_date",
    )
    estimate_hours: float = 0.0
    progress: Annotated[int, Field(ge=0, le=100)] = 0

    _ser_date = field_serializer("start_date", "due_date", when_used="always")(
        _serialize_date
    )



class TaskCreate(TaskBase):
    project_id: Optional[int] = None
    parent_task_id: Optional[int] = None
    subtask: Optional[List["TaskCreate"]] = Field(default_factory=list)


class TaskUpdate(BaseModel):
    """🧩 업무 수정용 입력 모델"""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = Field(
        default=None,
        validation_alias=AliasChoices("due_date", "end_date"),
        serialization_alias="due_date",
    )
    estimate_hours: Optional[float] = None
    progress: Optional[int] = None
    assignee_ids: Optional[List[int]] = Field(default=None)
    parent_task_id: Optional[int] = None  # ✅ 하위 업무 수정 허용

    # ✅ ORM <-> Pydantic 간 변환 허용
    model_config = ConfigDict(from_attributes=True)

    # ✅ 날짜 직렬화 (기존 TaskBase와 동일)
    _ser_date = field_serializer("start_date", "due_date", when_used="always")(
        _serialize_date
    )

class Task(TaskBase):
    task_id: int
    project_id: int
    assignee_ids: Optional[List[int]] = Field(default_factory=list)
    taskmember: List[TaskMember] = Field(default_factory=list)
    taskcomment: List[TaskComment] = Field(default_factory=list)
    subtask: List["Task"] = Field(default_factory=list)
    attachments: List[Attachment] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True)

    @property
    def assignees(self) -> List[dict]:
        return [
            {
                "emp_id": m.emp_id,
                "name": getattr(m.employee, "name", None),
                "email": getattr(m.employee, "email", None),
                "position": getattr(m.employee, "position", None),
            }
            for m in (self.taskmember or [])
        ]
    @property
    def assignee_ids(self) -> List[int]:
        return [m.emp_id for m in (self.taskmember or [])]

class TaskStatusUpdate(BaseModel):
    status: TaskStatus
    model_config = ConfigDict(from_attributes=True)


# =========================
# 🎯 Milestone
# =========================
class MilestoneBase(BaseModel):
    name: Optional[str] = None
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


# =========================
# 📁 Project (Base)
# =========================
class ProjectBase(BaseModel):
    # ✅ project_name <-> title 양방향 허용 (입력은 둘 다 OK, 출력은 project_name으로 직렬화)
    project_name: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("project_name", "title"),
        serialization_alias="project_name",
    )
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[ProjectStatus] = None
    owner_emp_id: Optional[int] = None

    task: Optional[List[Task]] = Field(default_factory=list)
    attachments: Optional[List[Attachment]] = Field(default_factory=list)

    # 읽기용 메타
    assignees: List[str] = Field(default_factory=list)
    assignee_ids: List[int] = Field(default_factory=list)

    _ser_date = field_serializer("start_date", "end_date", when_used="always")(
        _serialize_date
    )
    model_config = ConfigDict(from_attributes=True, extra="allow")


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    # ✅ 업데이트도 동일하게 허용
    project_name: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("project_name", "title"),
        serialization_alias="project_name",
    )
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[ProjectStatus] = None
    owner_emp_id: Optional[int] = None
    assignee_ids: Optional[List[int]] = None

    task: Optional[List[Task]] = Field(default_factory=list)
    attachments: Optional[List[Attachment]] = Field(default_factory=list)

    _ser_date = field_serializer("start_date", "end_date", when_used="always")(
        _serialize_date
    )
    model_config = ConfigDict(from_attributes=True, extra="allow")


class Project(ProjectBase):
    project_id: int
    projectmember: List[ProjectMember] = Field(default_factory=list)
    task: List[Task] = Field(default_factory=list)
    milestone: List[Milestone] = Field(default_factory=list)
    taskcomment: List[TaskComment] = Field(default_factory=list)

    owner_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    attachments: List[Attachment] = Field(default_factory=list)

    # ✅ 호환용 필드 (응답에서 필요시 제공)
    assignee_ids: List[int] = Field(default_factory=list)

    _ser_dt = field_serializer("created_at", "updated_at", when_used="always")(
        _serialize_datetime
    )
    model_config = ConfigDict(from_attributes=True)


# =========================
# 🕓 TaskHistory
# =========================
class TaskHistory(BaseModel):
    history_id: int
    task_id: int
    old_status: TaskStatus
    new_status: TaskStatus
    changed_by: Optional[int] = None
    changed_at: datetime

    _ser_dt = field_serializer("changed_at", when_used="always")(_serialize_datetime)
    model_config = ConfigDict(from_attributes=True)


# =========================
# 🌳 TaskTree
# =========================
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
    assignees: List[dict] = Field(default_factory=list)
    subtasks: List["TaskTree"] = Field(default_factory=list)

    _ser_date = field_serializer("start_date", "due_date", when_used="always")(
        _serialize_date
    )
    model_config = ConfigDict(from_attributes=True)


# =========================
# 🧩 ProjectFullCreate (단순형)
# =========================
class ProjectFullCreate(ProjectCreate):
    members: Optional[List[ProjectMemberBase]] = None
    tasks: Optional[List[TaskCreate]] = None


# =========================
# 🧩 TaskCreateRecursive
# =========================
class TaskCreateRecursive(BaseModel):
    title: str
    description: Optional[str] = ""
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.PLANNED
    progress: int = 0
    assignee_ids: List[int] = Field(default_factory=list)
    subtask: List["TaskCreateRecursive"] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


TaskCreateRecursive.model_rebuild()


# =========================
# 🧩 ProjectFullCreateRequest
# =========================
class ProjectFullCreateRequest(BaseModel):
    # 생성 전용은 원래 필드를 유지
    project_name: str
    description: Optional[str] = ""
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: ProjectStatus = ProjectStatus.PLANNED
    main_assignees: List[int] = Field(default_factory=list)
    tasks: List[TaskCreateRecursive] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


# =========================
# 📒 ActivityLog
# =========================
class ActivityLog(BaseModel):
    log_id: int
    project_id: int
    task_id: Optional[int] = None
    emp_id: Optional[int] = None
    action: str
    detail: Optional[str] = None
    created_at: datetime

    _ser_dt = field_serializer("created_at", when_used="always")(_serialize_datetime)
    model_config = ConfigDict(from_attributes=True)


# =========================
# 🔁 Forward Refs
# =========================
Task.model_rebuild()
TaskTree.model_rebuild()
TaskCreateRecursive.model_rebuild()
