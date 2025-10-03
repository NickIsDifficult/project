from enum import Enum


class ProjectStatus(str, Enum):
    PLANNED = "PLANNED"
    IN_PROGRESS = "IN_PROGRESS"
    ON_HOLD = "ON_HOLD"
    COMPLETED = "COMPLETED"


class MemberRole(str, Enum):
    OWNER = "OWNER"
    MANAGER = "MANAGER"
    MEMBER = "MEMBER"
    VIEWER = "VIEWER"


class TaskStatus(str, Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    REVIEW = "REVIEW"
    DONE = "DONE"


class TaskPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class MilestoneStatus(str, Enum):
    PLANNED = "PLANNED"
    ACHIEVED = "ACHIEVED"
    MISSED = "MISSED"


# ------------------------------------------
# ✅ 액티비티 로그 종류 (ActivityAction)
# ------------------------------------------
class ActivityAction(str, Enum):
    # 🗒️ 댓글 관련
    commented = "commented"
    comment_edited = "comment_edited"
    comment_deleted = "comment_deleted"

    # 📋 업무 관련
    task_created = "task_created"
    task_updated = "task_updated"
    task_deleted = "task_deleted"
    status_changed = "status_changed"

    # ⚙️ 예외 처리용
    unknown = "unknown"
