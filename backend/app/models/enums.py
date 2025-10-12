from enum import Enum


# ------------------------------------------
# 📁 프로젝트 상태
# ------------------------------------------
class ProjectStatus(str, Enum):
    PLANNED = "PLANNED"
    IN_PROGRESS = "IN_PROGRESS"
    ON_HOLD = "ON_HOLD"
    COMPLETED = "COMPLETED"


# ------------------------------------------
# 👥 멤버 역할
# ------------------------------------------
class MemberRole(str, Enum):
    OWNER = "OWNER"
    MANAGER = "MANAGER"
    MEMBER = "MEMBER"
    VIEWER = "VIEWER"


# ------------------------------------------
# 🗂️ 업무(Task) 상태
# ------------------------------------------
class TaskStatus(str, Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    REVIEW = "REVIEW"
    DONE = "DONE"


# ------------------------------------------
# ⚡ 업무 우선순위
# ------------------------------------------
class TaskPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


# ------------------------------------------
# 🎯 마일스톤 상태
# ------------------------------------------
class MilestoneStatus(str, Enum):
    PLANNED = "PLANNED"
    ACHIEVED = "ACHIEVED"
    MISSED = "MISSED"


# ------------------------------------------
# 🧾 활동 로그 타입 (ActivityAction)
# ------------------------------------------
class ActivityAction(str, Enum):
    """
    프로젝트 / 태스크 / 댓글 / 첨부파일 관련 모든 활동 로그 Enum
    """

    # 💬 댓글 관련
    commented = "commented"  # 새 댓글 작성
    comment_edited = "comment_edited"  # 댓글 수정
    comment_deleted = "comment_deleted"  # 댓글 삭제
    mentioned = "mentioned"  # @멘션 발생

    # 📋 업무(Task) 관련
    task_created = "task_created"  # 새 업무 생성
    task_updated = "task_updated"  # 업무 수정
    task_deleted = "task_deleted"  # 업무 삭제
    status_changed = "status_changed"  # 상태 변경
    assignee_changed = "assignee_changed"  # 담당자 변경
    due_date_changed = "due_date_changed"  # 마감일 변경
    progress_changed = "progress_changed"  # 진행률 변경

    # 📎 첨부파일 관련
    attachment_added = "attachment_added"  # 첨부 추가
    attachment_removed = "attachment_removed"  # 첨부 삭제

    # 📦 프로젝트 관련
    project_created = "project_created"  # 프로젝트 생성
    project_deleted = "project_deleted"  # 프로젝트 삭제

    # ⚙️ 예외 / 기본값
    unknown = "unknown"  # 알 수 없는 동작 (예외용)
