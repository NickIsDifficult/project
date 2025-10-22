# app/models/employee.py
from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Employee(Base):
    """
    👤 직원(Employee) 모델
    - 부서 / 직무 / 프로젝트 / 업무 관계의 중심
    """

    __tablename__ = "employee"

    # -----------------------------------------------------------------
    # 기본 정보
    # -----------------------------------------------------------------
    emp_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    emp_no: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)

    dept_id: Mapped[int] = mapped_column(
        ForeignKey("department.dept_id"), nullable=False
    )
    role_id: Mapped[int] = mapped_column(ForeignKey("role.role_id"), nullable=False)

    name: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(100), nullable=False)
    mobile: Mapped[str] = mapped_column(String(20), nullable=False)

    hire_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    birthday: Mapped[date | None] = mapped_column(Date, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # -----------------------------------------------------------------
    # 관계 설정 (모델명과 동일한 단순 명칭 사용)
    # -----------------------------------------------------------------
    department = relationship("Department", back_populates="employee", lazy="selectin")
    role = relationship("Role", lazy="selectin")

    projectmember = relationship(
        "ProjectMember",
        back_populates="employee",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    taskmember = relationship(
        "TaskMember",
        back_populates="employee",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    taskcomment = relationship(
        "TaskComment",
        back_populates="employee",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    attachment = relationship(
        "Attachment",
        back_populates="employee",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    activitylog = relationship(
        "ActivityLog",
        back_populates="employee",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    notification_received = relationship(
        "Notification",
        back_populates="recipient",
        foreign_keys="[Notification.recipient_emp_id]",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    notification_sent = relationship(
        "Notification",
        back_populates="actor",
        foreign_keys="[Notification.actor_emp_id]",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


# -----------------------------------------------------------------
# 표현
# -----------------------------------------------------------------
def __repr__(self) -> str:
    return f"<Employee {self.emp_id} {self.name}>"
