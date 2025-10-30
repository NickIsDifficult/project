# app/models/__init__.py
from app.models.activity_log import ActivityLog
from app.models.attachment import Attachment
from app.models.department import Department, DepartmentPermission
from app.models.employee import Employee
from app.models.enums import *
from app.models.external import External
from app.models.member import Member

# ✅ 새로 추가된 공지/참조 모델
from app.models.notices import Notice, NoticeReference
from app.models.notification import Notification, NotificationType
from app.models.project import (
    Milestone,
    Project,
    ProjectMember,
    Task,
    TaskComment,
    TaskHistory,
    TaskMember,
)
from app.models.role import Role
from app.models.status import Status
from app.models.event import Event  # ✅ 이벤트(캘린더) 모델 추가

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
    "Status",
    # ✅ event
    "Event",
    # ✅ notices
    "Notice",
    "NoticeReference",
]
