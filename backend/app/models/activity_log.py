# app/models/activity_log.py
from __future__ import annotations
from datetime import datetime
from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Text, func, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.enums import ActivityAction


class ActivityLog(Base):
    """
    🧾 프로젝트 / 태스크 관련 활동 로그
    - 프로젝트/업무 단위의 사용자 액션 기록
    - 상태 변경, 수정, 삭제 등의 이력을 추적
    """

    __tablename__ = "activity_logs"

    # -----------------------------------------------------------------
    # 기본 컬럼
    # -----------------------------------------------------------------
    log_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    emp_id: Mapped[int] = mapped_column(
        ForeignKey("employees.emp_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    project_id: Mapped[int | None] = mapped_column(
        ForeignKey("projects.project_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    task_id: Mapped[int | None] = mapped_column(
        ForeignKey("tasks.task_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # -----------------------------------------------------------------
    # 액션 및 상세 정보
    # -----------------------------------------------------------------
    action: Mapped[ActivityAction] = mapped_column(
        Enum(ActivityAction, native_enum=True),
        nullable=False,
    )

    detail: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # -----------------------------------------------------------------
    # 관계
    # -----------------------------------------------------------------
    project: Mapped["Project"] = relationship(
        "Project",
        back_populates="activity_logs",
        lazy="selectin",
    )

    task: Mapped["Task"] = relationship(
        "Task",
        back_populates="activity_logs",
        lazy="selectin",
    )

    employee: Mapped["Employee"] = relationship(
        "Employee",
        lazy="selectin",
    )

    # -----------------------------------------------------------------
    # 인덱스
    # -----------------------------------------------------------------
    __table_args__ = (
        Index("idx_activity_emp", "emp_id"),
        Index("idx_activity_project", "project_id"),
        Index("idx_activity_task", "task_id"),
    )

    # -----------------------------------------------------------------
    # 표현 / 직렬화
    # -----------------------------------------------------------------
    def __repr__(self) -> str:
        return f"<ActivityLog id={self.log_id} emp={self.emp_id} action={self.action.name}>"

    def to_dict(self) -> dict:
        return {
            "log_id": self.log_id,
            "emp_id": self.emp_id,
            "project_id": self.project_id,
            "task_id": self.task_id,
            "action": self.action.value,
            "detail": self.detail,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
