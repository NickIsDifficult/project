from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Index, Integer, Text
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import ActivityAction  # ✅ enums.py에서 가져오기


class ActivityLog(Base):
    """프로젝트 / 태스크 관련 활동 로그"""

    __tablename__ = "activity_log"

    log_id = Column(Integer, primary_key=True, autoincrement=True)

    emp_id = Column(
        Integer,
        ForeignKey("employee.emp_id", ondelete="CASCADE"),
        nullable=False,
    )
    project_id = Column(
        Integer,
        ForeignKey("project.project_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    task_id = Column(
        Integer,
        ForeignKey("task.task_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )


    # ✅ enums.py의 ActivityAction 사용
    action = Column(Enum(ActivityAction, native_enum=False), nullable=False)
    detail = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


    project = relationship("Project", back_populates="activity_logs")
    task = relationship("Task", back_populates="activity_logs")

    __table_args__ = (
        Index("idx_activity_emp", "emp_id"),
        Index("idx_activity_project", "project_id"),
        Index("idx_activity_task", "task_id"),
    )

    def __repr__(self):
        return (
            f"<ActivityLog(action={self.action}, emp_id={self.emp_id}, " f"task_id={self.task_id})>"
        )

    def to_dict(self):
        return {
            "log_id": self.log_id,
            "emp_id": self.emp_id,
            "project_id": self.project_id,
            "task_id": self.task_id,
            "action": self.action.value if hasattr(self.action, "value") else self.action,
            "detail": self.detail,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
