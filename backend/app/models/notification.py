import enum
from datetime import datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, Enum, ForeignKey, Index, Integer
from sqlalchemy.orm import relationship

from app.database import Base


class NotificationType(str, enum.Enum):
    """알림 유형"""

    comment = "comment"  # 댓글 등록
    mention = "mention"  # 멘션 알림
    status_change = "status_change"  # 상태 변경
    assignment = "assignment"  # 업무 배정
    due_soon = "due_soon"  # 마감 임박 (확장용)
    project_update = "project_update"  # 프로젝트 수정 알림 (확장용)


class Notification(Base):
    """알림(Notification) 테이블"""

    __tablename__ = "notification"

    notification_id = Column(Integer, primary_key=True, autoincrement=True)

    recipient_emp_id = Column(
        Integer,
        ForeignKey("employee.emp_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    actor_emp_id = Column(
        Integer,
        ForeignKey("employee.emp_id", ondelete="CASCADE"),
        nullable=False,
    )
    project_id = Column(
        Integer,
        ForeignKey("project.project_id", ondelete="CASCADE"),
        index=True,
        nullable=True,
    )
    task_id = Column(
        Integer,
        ForeignKey("task.task_id", ondelete="CASCADE"),
        index=True,
        nullable=True,
    )

    type = Column(Enum(NotificationType, native_enum=False), nullable=False)
    payload = Column(JSON, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    recipient = relationship(
        "Employee",
        foreign_keys=[recipient_emp_id],
        backref="received_notifications",
    )
    actor = relationship(
        "Employee",
        foreign_keys=[actor_emp_id],
        backref="sent_notifications",
    )

    __table_args__ = (
        Index("idx_notification_recipient", "recipient_emp_id"),
        Index("idx_notification_task", "task_id"),
        Index("idx_notification_project", "project_id"),
        Index("idx_notification_type", "type"),
    )

    def __repr__(self):
        return f"<Notification(type={self.type}, to={self.recipient_emp_id}, task={self.task_id})>"

    def to_dict(self):
        """API 응답용 변환"""
        return {
            "notification_id": self.notification_id,
            "recipient_emp_id": self.recipient_emp_id,
            "actor_emp_id": self.actor_emp_id,
            "project_id": self.project_id,
            "task_id": self.task_id,
            "type": self.type,
            "payload": self.payload,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
