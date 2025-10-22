# app/schemas/__init__.py
from app.schemas.project import (
    Project,
    ProjectCreate,
    ProjectUpdate,
    Task,
    TaskCreate,
    TaskUpdate,
    Milestone,
    ProjectMember,
    TaskComment,
)
from app.schemas.employee import Employee
from app.schemas.activity_log import ActivityLog, ActivityLogCreate
from app.schemas.attachment import Attachment
from app.schemas.department import Department
from app.schemas.role import Role
from app.schemas.notification import Notification

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
]
