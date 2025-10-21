# app/schemas/__init__.py
from .activity import ActivityFeedItem, ActivityLogSchema
from .auth import LoginRequest, LoginResponse, SignupRequest, SignupResponse, UserType
from .department import Department, DepartmentCreate
from .employee import Employee
from .notification import Notification as NotificationSchema
from .project import (
    Project,
    TaskTree,
    Milestone,
    ProjectMember,
)
from .role import Role


from .project import *
