# app/models/project.py
from __future__ import annotations

from datetime import date, datetime
from sqlalchemy import (
    Column, Integer, String, Text, Date, DateTime, Enum, ForeignKey, Float, UniqueConstraint
)
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.database import Base
from app.models.enums import MemberRole, ProjectStatus, TaskStatus, TaskPriority, MilestoneStatus


# =========================
# Employee
# =========================
class Employee(Base):
    __tablename__ = "employees"

    emp_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    # reverse
    project_memberships = relationship("ProjectMember", back_populates="employee", lazy="selectin")
    task_memberships = relationship("TaskMember", back_populates="employee", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Employee {self.emp_id} {self.name}>"


# =========================
# Project
# =========================
class Project(Base):
    __tablename__ = "projects"

    project_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # ⚠️ DB에 'title'이 없고 'project_name'만 있는 구조를 표준화
    project_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[ProjectStatus | None] = mapped_column(Enum(ProjectStatus), default=ProjectStatus.PLANNED, nullable=True)

    owner_emp_id: Mapped[int | None] = mapped_column(ForeignKey("employees.emp_id"), nullable=True)

    # relations
    owner = relationship("Employee", lazy="selectin")
    members = relationship(
        "ProjectMember",
        back_populates="project",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    tasks = relationship(
        "Task",
        back_populates="project",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    milestones = relationship(
        "Milestone",
        back_populates="project",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Project {self.project_id} {self.project_name}>"


# =========================
# ProjectMember
# =========================
class ProjectMember(Base):
    __tablename__ = "project_members"
    __table_args__ = (
        UniqueConstraint("project_id", "emp_id", name="uq_project_member"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False)
    emp_id: Mapped[int] = mapped_column(ForeignKey("employees.emp_id", ondelete="CASCADE"), nullable=False)
    role: Mapped[MemberRole] = mapped_column(Enum(MemberRole), default=MemberRole.MEMBER, nullable=False)

    project = relationship("Project", back_populates="members", lazy="selectin")
    employee = relationship("Employee", back_populates="project_memberships", lazy="selectin")

    def __repr__(self) -> str:
        return f"<ProjectMember P{self.project_id} E{self.emp_id} {self.role}>"


# =========================
# Task
# =========================
class Task(Base):
    __tablename__ = "tasks"

    task_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False)

    # self reference
    parent_task_id: Mapped[int | None] = mapped_column(ForeignKey("tasks.task_id", ondelete="CASCADE"), nullable=True)

    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), default=TaskStatus.TODO, nullable=False)
    priority: Mapped[TaskPriority] = mapped_column(Enum(TaskPriority), default=TaskPriority.MEDIUM, nullable=False)

    assignee_emp_id: Mapped[int | None] = mapped_column(ForeignKey("employees.emp_id"), nullable=True)

    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    estimate_hours: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # relations
    project = relationship("Project", back_populates="tasks", lazy="selectin")

    parent_task = relationship(
        "Task",
        remote_side="Task.task_id",
        back_populates="subtasks",
        lazy="selectin",
    )
    subtasks = relationship(
        "Task",
        back_populates="parent_task",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    # ✅ 핵심: 각 태스크에 직접 연결된 담당자만 가져오도록 관계 명확화
    members = relationship(
        "TaskMember",
        back_populates="task",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    assignee = relationship("Employee", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Task {self.task_id} P{self.project_id} {self.title}>"


# =========================
# TaskMember (many-to-many Task ↔ Employee)
# =========================
class TaskMember(Base):
    __tablename__ = "task_members"
    __table_args__ = (
        UniqueConstraint("task_id", "emp_id", name="uq_task_member"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.task_id", ondelete="CASCADE"), nullable=False)
    emp_id: Mapped[int] = mapped_column(ForeignKey("employees.emp_id", ondelete="CASCADE"), nullable=False)

    task = relationship("Task", back_populates="members", lazy="selectin")
    employee = relationship("Employee", back_populates="task_memberships", lazy="selectin")

    def __repr__(self) -> str:
        return f"<TaskMember T{self.task_id} E{self.emp_id}>"


# =========================
# Milestone
# =========================
class Milestone(Base):
    __tablename__ = "milestones"

    milestone_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[MilestoneStatus] = mapped_column(Enum(MilestoneStatus), default=MilestoneStatus.PLANNED, nullable=False)

    project = relationship("Project", back_populates="milestones", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Milestone {self.milestone_id} P{self.project_id} {self.name}>"
