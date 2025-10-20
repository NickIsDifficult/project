# app/models/__init__.py

from app.models.activity_log import ActivityLog
from app.models.attachment import Attachment
from app.models.department import Department, DepartmentPermission
from app.models.employee import Employee
from app.models.enums import (
    ActivityAction,
    MemberRole,
    MilestoneStatus,
    ProjectStatus,
    TaskPriority,
    TaskStatus,
)
from app.models.external import External
from app.models.member import Member
from app.models.notification import Notification, NotificationType
from app.models.project import (
    Milestone,
    Project,
    ProjectMember,
    Task,
    TaskAssignee,
    TaskComment,
    TaskHistory,
)
from app.models.role import Role

__all__ = [
    "Department",
    "DepartmentPermission",
    "Role",
    "Employee",
    "External",
    "Member",
    "Project",
    "ProjectMember",
    "Attachment",
    "Notification",
    "ActivityLog",
    "ProjectStatus",
    "TaskStatus",
    "NotificationType",
]
