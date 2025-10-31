# app/schemas/__init__.py
from app.schemas.activity_log import ActivityLog, ActivityLogCreate
from app.schemas.attachment import Attachment
from app.schemas.department import Department
from app.schemas.employee import Employee
from app.schemas.notification import Notification
from app.schemas.project import (
    Milestone,
    Project,
    ProjectCreate,
    ProjectMember,
    ProjectUpdate,
    Task,
    TaskComment,
    TaskCreate,
    TaskUpdate,
)
from app.schemas.role import Role
from app.schemas.trash import TrashCreate, TrashOut

__all__ = [
    "Project",
    "ProjectCreate",
    "ProjectUpdate",
    "Task",
    "TaskCreate",
    "TaskUpdate",
    "Milestone",
    "ProjectMember",
    "TaskComment",
    "Employee",
    "ActivityLog",
    "ActivityLogCreate",
    "Attachment",
    "Department",
    "Role",
    "Notification",
    "TrashCreate",
    "TrashOut",
]
