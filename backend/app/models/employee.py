# app/models/employee.py
from __future__ import annotations
from datetime import date, datetime
from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Employee(Base):
    """
    👤 직원(Employee) 모델
    - 부서/직무/프로젝트/업무 전반의 관계 허브
    - ProjectMember 및 TaskMember를 통한 N:N 참여 관계 포함
    """

    __tablename__ = "employees"

    # -----------------------------------------------------------------
    # 기본 정보
    # -----------------------------------------------------------------
    emp_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    emp_no: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)

    dept_id: Mapped[int] = mapped_column(ForeignKey("department.dept_id"), nullable=False)
    role_id: Mapped[int] = mapped_column(ForeignKey("role.role_id"), nullable=False)

    name: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(100), nullable=False)  # unique 제거
    mobile: Mapped[str] = mapped_column(String(20), nullable=False)  # unique 제거

    hire_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    birthday: Mapped[date | None] = mapped_column(Date, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # -----------------------------------------------------------------
    # 관계 설정
    # -----------------------------------------------------------------
    # ✅ 기본 관계
    department: Mapped["Department"] = relationship("Department", back_populates="employees", lazy="selectin")
    role: Mapped["Role"] = relationship("Role", lazy="selectin")

    # ✅ 프로젝트 / 업무 관계
    project_memberships: Mapped[list["ProjectMember"]] = relationship(
        "ProjectMember", back_populates="employee", cascade="all, delete-orphan", lazy="selectin"
    )

    task_memberships: Mapped[list["TaskMember"]] = relationship(
        "TaskMember", back_populates="employee", cascade="all, delete-orphan", lazy="selectin"
    )

    # ✅ 코멘트 / 첨부파일 / 로그
    comments: Mapped[list["TaskComment"]] = relationship(
        "TaskComment", back_populates="employee", cascade="all, delete-orphan", lazy="selectin"
    )

    attachments: Mapped[list["Attachment"]] = relationship(
        "Attachment", back_populates="uploader", cascade="all, delete-orphan", lazy="selectin"
    )

    activity_logs: Mapped[list["ActivityLog"]] = relationship(
        "ActivityLog", back_populates="employee", cascade="all, delete-orphan", lazy="selectin"
    )

    # -----------------------------------------------------------------
    # 표현
    # -----------------------------------------------------------------
    def __repr__(self) -> str:
        return f"<Employee {self.emp_id} {self.name}>"
