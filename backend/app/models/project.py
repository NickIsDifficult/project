# app/models/project.py
from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import (
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import (
    MemberRole,
    MilestoneStatus,
    ProjectStatus,
    TaskPriority,
    TaskStatus,
)


# ============================================================
# 📁 Project
# ============================================================
class Project(Base):
    __tablename__ = "project"

    project_id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    project_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[ProjectStatus] = mapped_column(
        Enum(ProjectStatus), default=ProjectStatus.PLANNED, nullable=False
    )

    owner_emp_id: Mapped[int | None] = mapped_column(
        ForeignKey("employee.emp_id", ondelete="SET NULL")
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # ✅ Relations
    employee = relationship(
        "Employee", backref="project", foreign_keys=[owner_emp_id], lazy="selectin"
    )
    projectmember = relationship(
        "ProjectMember",
        back_populates="project",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    task = relationship(
        "Task", back_populates="project", cascade="all, delete-orphan", lazy="selectin"
    )
    milestone = relationship(
        "Milestone",
        back_populates="project",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    taskcomment = relationship(
        "TaskComment",
        back_populates="project",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    attachment = relationship(
        "Attachment",
        back_populates="project",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    activitylog = relationship(
        "ActivityLog",
        back_populates="project",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    notification = relationship(
        "Notification",
        back_populates="project",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self):
        return f"<Project {self.project_id} {self.project_name}>"


# ============================================================
# 👥 ProjectMember
# ============================================================
class ProjectMember(Base):
    __tablename__ = "project_member"
    __table_args__ = (
        UniqueConstraint("project_id", "emp_id", name="uq_project_member"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("project.project_id", ondelete="CASCADE")
    )
    emp_id: Mapped[int] = mapped_column(
        ForeignKey("employee.emp_id", ondelete="CASCADE")
    )
    role: Mapped[MemberRole] = mapped_column(
        Enum(MemberRole), default=MemberRole.MEMBER, nullable=False
    )

    project = relationship("Project", back_populates="projectmember", lazy="selectin")
    employee = relationship("Employee", back_populates="projectmember", lazy="selectin")

    def __repr__(self):
        return f"<ProjectMember P{self.project_id} E{self.emp_id} {self.role}>"


# ============================================================
# 🧩 Task
# ============================================================
class Task(Base):
    __tablename__ = "task"

    task_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("project.project_id", ondelete="CASCADE")
    )
    parent_task_id: Mapped[int | None] = mapped_column(
        ForeignKey("task.task_id", ondelete="CASCADE"), nullable=True
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[TaskStatus] = mapped_column(
        Enum(TaskStatus), default=TaskStatus.PLANNED, nullable=False
    )
    priority: Mapped[TaskPriority] = mapped_column(
        Enum(TaskPriority), default=TaskPriority.MEDIUM, nullable=False
    )
    start_date: Mapped[date | None] = mapped_column(Date)
    due_date: Mapped[date | None] = mapped_column(Date)
    estimate_hours: Mapped[float] = mapped_column(Float, default=0.0)
    progress: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime, onupdate=datetime.utcnow
    )

    # ✅ Relations
    project = relationship("Project", back_populates="task", lazy="selectin")
    parenttask = relationship(
        "Task", remote_side="Task.task_id", back_populates="subtask", lazy="selectin"
    )
    subtask = relationship(
        "Task",
        back_populates="parenttask",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    taskmember = relationship(
        "TaskMember",
        back_populates="task",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    taskcomment = relationship(
        "TaskComment",
        back_populates="task",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    taskhistory = relationship(
        "TaskHistory",
        back_populates="task",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    attachment = relationship(
        "Attachment",
        back_populates="task",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    activitylog = relationship(
        "ActivityLog",
        back_populates="task",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    notification = relationship(
        "Notification",
        back_populates="task",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    @hybrid_property
    def assignee_ids(self):
        return [m.emp_id for m in self.TaskMember] if self.TaskMember else []

    def __repr__(self):
        return f"<Task {self.task_id} P{self.project_id} {self.title}>"


# ============================================================
# 🔗 TaskMember (N:N: Task ↔ Employee)
# ============================================================
class TaskMember(Base):
    __tablename__ = "task_member"
    __table_args__ = (UniqueConstraint("task_id", "emp_id", name="uq_task_member"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("task.task_id", ondelete="CASCADE"))
    emp_id: Mapped[int] = mapped_column(
        ForeignKey("employee.emp_id", ondelete="CASCADE")
    )
    assigned_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    task = relationship("Task", back_populates="taskmember", lazy="selectin")
    employee = relationship("Employee", back_populates="taskmember", lazy="selectin")

    def __repr__(self):
        return f"<TaskMember T{self.task_id} E{self.emp_id}>"


# ============================================================
# 🧱 Milestone
# ============================================================
class Milestone(Base):
    __tablename__ = "milestone"

    milestone_id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    project_id: Mapped[int] = mapped_column(
        ForeignKey("project.project_id", ondelete="CASCADE")
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    due_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[MilestoneStatus] = mapped_column(
        Enum(MilestoneStatus), default=MilestoneStatus.PLANNED
    )

    project = relationship("Project", back_populates="milestone", lazy="selectin")

    def __repr__(self):
        return f"<Milestone {self.milestone_id} P{self.project_id} {self.name}>"


# ============================================================
# 💬 TaskComment
# ============================================================
class TaskComment(Base):
    __tablename__ = "task_comment"

    comment_id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    project_id: Mapped[int] = mapped_column(
        ForeignKey("project.project_id", ondelete="CASCADE")
    )
    task_id: Mapped[int] = mapped_column(ForeignKey("task.task_id", ondelete="CASCADE"))
    emp_id: Mapped[int] = mapped_column(
        ForeignKey("employee.emp_id", ondelete="CASCADE")
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    project = relationship("Project", back_populates="taskcomment", lazy="selectin")
    task = relationship("Task", back_populates="taskcomment", lazy="selectin")
    employee = relationship("Employee", lazy="selectin")

    def __repr__(self):
        return f"<TaskComment {self.comment_id} T{self.task_id} E{self.emp_id}>"


# ============================================================
# 🕓 TaskHistory
# ============================================================
class TaskHistory(Base):
    __tablename__ = "task_history"

    history_id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    task_id: Mapped[int] = mapped_column(ForeignKey("task.task_id", ondelete="CASCADE"))
    old_status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus))
    new_status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus))
    changed_by: Mapped[int | None] = mapped_column(
        ForeignKey("employee.emp_id", ondelete="SET NULL")
    )
    changed_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    task = relationship("Task", back_populates="taskhistory", lazy="selectin")

    def __repr__(self):
        return f"<TaskHistory H{self.history_id} T{self.task_id}>"
