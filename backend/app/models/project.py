# app/models/project.py
from __future__ import annotations
from datetime import date, datetime
from sqlalchemy import (
    String, Text, Date, DateTime, Enum, ForeignKey,
    Integer, Float, UniqueConstraint, func
)
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import (
    MemberRole, MilestoneStatus, ProjectStatus,
    TaskPriority, TaskStatus
)

# ============================================================
# 📁 Project
# ============================================================
class Project(Base):
    __tablename__ = "projects"

    project_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[ProjectStatus] = mapped_column(Enum(ProjectStatus), default=ProjectStatus.PLANNED, nullable=False)

    owner_emp_id: Mapped[int | None] = mapped_column(ForeignKey("employees.emp_id", ondelete="SET NULL"))

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # ✅ Relations
    owner = relationship("Employee", backref="owned_projects", foreign_keys=[owner_emp_id], lazy="selectin")
    members = relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan", lazy="selectin")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan", lazy="selectin")
    milestones = relationship("Milestone", back_populates="project", cascade="all, delete-orphan", lazy="selectin")

    # Additional (from legacy model)
    comments = relationship("TaskComment", back_populates="project", cascade="all, delete-orphan", lazy="selectin")
    attachments = relationship("Attachment", back_populates="project", cascade="all, delete-orphan", lazy="selectin")
    activity_logs = relationship("ActivityLog", back_populates="project", cascade="all, delete-orphan", lazy="selectin")
    notifications = relationship("Notification", back_populates="project", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self):
        return f"<Project {self.project_id} {self.project_name}>"


# ============================================================
# 👥 ProjectMember
# ============================================================
class ProjectMember(Base):
    __tablename__ = "project_members"
    __table_args__ = (UniqueConstraint("project_id", "emp_id", name="uq_project_member"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.project_id", ondelete="CASCADE"))
    emp_id: Mapped[int] = mapped_column(ForeignKey("employees.emp_id", ondelete="CASCADE"))
    role: Mapped[MemberRole] = mapped_column(Enum(MemberRole), default=MemberRole.MEMBER, nullable=False)

    project = relationship("Project", back_populates="members", lazy="selectin")
    employee = relationship("Employee", back_populates="project_memberships", lazy="selectin")

    def __repr__(self):
        return f"<ProjectMember P{self.project_id} E{self.emp_id} {self.role}>"


# ============================================================
# 🧩 Task
# ============================================================
class Task(Base):
    __tablename__ = "tasks"

    task_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.project_id", ondelete="CASCADE"))
    parent_task_id: Mapped[int | None] = mapped_column(ForeignKey("tasks.task_id", ondelete="CASCADE"), nullable=True)

    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), default=TaskStatus.PLANNED, nullable=False)
    priority: Mapped[TaskPriority] = mapped_column(Enum(TaskPriority), default=TaskPriority.MEDIUM, nullable=False)
    start_date: Mapped[date | None] = mapped_column(Date)
    due_date: Mapped[date | None] = mapped_column(Date)
    estimate_hours: Mapped[float] = mapped_column(Float, default=0.0)
    progress: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, onupdate=datetime.utcnow)

    # ✅ Relations
    project = relationship("Project", back_populates="tasks", lazy="selectin")
    parent_task = relationship("Task", remote_side="Task.task_id", back_populates="subtasks", lazy="selectin")
    subtasks = relationship("Task", back_populates="parent_task", cascade="all, delete-orphan", lazy="selectin")
    members = relationship("TaskMember", back_populates="task", cascade="all, delete-orphan", lazy="selectin")
    comments = relationship("TaskComment", back_populates="task", cascade="all, delete-orphan", lazy="selectin")
    histories = relationship("TaskHistory", back_populates="task", cascade="all, delete-orphan", lazy="selectin")
    attachments = relationship("Attachment", back_populates="task", cascade="all, delete-orphan", lazy="selectin")
    activity_logs = relationship("ActivityLog", back_populates="task", cascade="all, delete-orphan", lazy="selectin")
    notifications = relationship("Notification", back_populates="task", cascade="all, delete-orphan", lazy="selectin")

    @hybrid_property
    def assignee_ids(self):
        return [m.emp_id for m in self.members] if self.members else []

    def __repr__(self):
        return f"<Task {self.task_id} P{self.project_id} {self.title}>"


# ============================================================
# 🔗 TaskMember (N:N: Task ↔ Employee)
# ============================================================
class TaskMember(Base):
    __tablename__ = "task_members"
    __table_args__ = (UniqueConstraint("task_id", "emp_id", name="uq_task_member"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.task_id", ondelete="CASCADE"))
    emp_id: Mapped[int] = mapped_column(ForeignKey("employees.emp_id", ondelete="CASCADE"))
    assigned_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    task = relationship("Task", back_populates="members", lazy="selectin")
    employee = relationship("Employee", back_populates="task_memberships", lazy="selectin")

    def __repr__(self):
        return f"<TaskMember T{self.task_id} E{self.emp_id}>"


# ============================================================
# 🧱 Milestone
# ============================================================
class Milestone(Base):
    __tablename__ = "milestones"

    milestone_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.project_id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    due_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[MilestoneStatus] = mapped_column(Enum(MilestoneStatus), default=MilestoneStatus.PLANNED)

    project = relationship("Project", back_populates="milestones", lazy="selectin")

    def __repr__(self):
        return f"<Milestone {self.milestone_id} P{self.project_id} {self.name}>"


# ============================================================
# 💬 TaskComment
# ============================================================
class TaskComment(Base):
    __tablename__ = "task_comments"

    comment_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.project_id", ondelete="CASCADE"))
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.task_id", ondelete="CASCADE"))
    emp_id: Mapped[int] = mapped_column(ForeignKey("employees.emp_id", ondelete="CASCADE"))
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    project = relationship("Project", back_populates="comments", lazy="selectin")
    task = relationship("Task", back_populates="comments", lazy="selectin")
    employee = relationship("Employee", lazy="selectin")

    def __repr__(self):
        return f"<TaskComment {self.comment_id} T{self.task_id} E{self.emp_id}>"


# ============================================================
# 🕓 TaskHistory
# ============================================================
class TaskHistory(Base):
    __tablename__ = "task_histories"

    history_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.task_id", ondelete="CASCADE"))
    old_status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus))
    new_status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus))
    changed_by: Mapped[int | None] = mapped_column(ForeignKey("employees.emp_id", ondelete="SET NULL"))
    changed_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    task = relationship("Task", back_populates="histories", lazy="selectin")

    def __repr__(self):
        return f"<TaskHistory H{self.history_id} T{self.task_id}>"
