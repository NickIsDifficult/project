# app/models/__init__.py
from app.models.department import Department, DepartmentPermission
from app.models.external import External
from app.models.member import Member
from app.models.role import Role
from app.models.notification import Notification, NotificationType
from app.models.enums import *
from app.models.employee import Employee
from app.models.project import (
    Project,
    ProjectMember,
    Task,
    TaskMember,
    Milestone,
    TaskComment,
    TaskHistory,
)
from app.models.attachment import Attachment
from app.models.activity_log import ActivityLog

__all__ = [
    # enums
    "MemberRole",
    "ProjectStatus",
    "TaskStatus",
    "TaskPriority",
    "MilestoneStatus",
    "ActivityAction",

    # core models
    "Department",
    "DepartmentPermission",
    "External",
    "Member",
    "Role",
    "Notification",
    "NotificationType",
    "Employee",
    "Project",
    "ProjectMember",
    "Task",
    "TaskMember",
    "Milestone",
    "TaskComment",
    "TaskHistory",
    "Attachment",
    "ActivityLog",
]
