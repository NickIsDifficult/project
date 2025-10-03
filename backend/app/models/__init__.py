# app/models/__init__.py

from app.models.activity import ActivityAction, ActivityLog
from app.models.attachment import Attachment
from app.models.department import Department, DepartmentPermission, Role
from app.models.employee import Employee, ExternalPerson, Member
from app.models.enums import (
    MemberRole,
    MilestoneStatus,
    ProjectStatus,
    TaskPriority,
    TaskStatus,
)
from app.models.notification import Notification, NotificationType
from app.models.project import (
    Milestone,
    Project,
    ProjectMember,
    Task,
    TaskComment,
    TaskHistory,
)
