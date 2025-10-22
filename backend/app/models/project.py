from datetime import datetime
from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    Boolean,
    func,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.database import Base
from app.models.enums import ProjectStatus, TaskPriority, TaskStatus


# =========================
# 📁 Project
# =========================
class Project(Base):
    __tablename__ = "project"

    project_id = Column(Integer, primary_key=True, autoincrement=True)
    project_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    status = Column(Enum(ProjectStatus, native_enum=False), default=ProjectStatus.PLANNING)
    is_archived = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 🔗 관계 설정
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    members = relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="project", cascade="all, delete-orphan")
    notifications = relationship("Notification", backref="project", cascade="all, delete")
    activities = relationship("ActivityLog", backref="project", cascade="all, delete")

    def __repr__(self):
        return f"<Project(id={self.project_id}, name={self.project_name}, status={self.status})>"


# =========================
# 👥 ProjectMember (N:N Project ↔ Employee)
# =========================
class ProjectMember(Base):
    __tablename__ = "project_member"

    project_id = Column(Integer, ForeignKey("project.project_id", ondelete="CASCADE"), primary_key=True)
    emp_id = Column(Integer, ForeignKey("employee.emp_id", ondelete="CASCADE"), primary_key=True)
    role = Column(String(50), nullable=True)
    joined_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    project = relationship("Project", back_populates="members")
    employee = relationship("Employee", back_populates="project_memberships")

    def __repr__(self):
        return f"<ProjectMember(project_id={self.project_id}, emp_id={self.emp_id}, role={self.role})>"


# =========================
# ✅ Task
# =========================
class Task(Base):
    __tablename__ = "task"

    task_id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("project.project_id", ondelete="CASCADE"), nullable=False)
    parent_task_id = Column(Integer, ForeignKey("task.task_id", ondelete="CASCADE"), nullable=True)
    assignee_id = Column(Integer, ForeignKey("employee.emp_id", ondelete="SET NULL"), nullable=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(Enum(TaskPriority, native_enum=False), default=TaskPriority.MEDIUM)
    status = Column(Enum(TaskStatus, native_enum=False), default=TaskStatus.TODO)
    progress = Column(Integer, default=0)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)

    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # 🔗 관계
    project = relationship("Project", back_populates="tasks")
    assignee = relationship("Employee", back_populates="tasks")
    parent_task = relationship("Task", remote_side=[task_id], backref="subtasks")
    attachments = relationship("Attachment", back_populates="task", cascade="all, delete-orphan")
    comments = relationship("TaskComment", back_populates="task", cascade="all, delete-orphan")
    notifications = relationship("Notification", backref="task", cascade="all, delete")

    # ✅ 추가: TaskMember (다대다 연결)
    members = relationship("TaskMember", back_populates="task", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Task(id={self.task_id}, title={self.title}, status={self.status})>"


# =========================
# 💬 TaskComment
# =========================
class TaskComment(Base):
    __tablename__ = "task_comment"

    comment_id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("task.task_id", ondelete="CASCADE"), nullable=False)
    emp_id = Column(Integer, ForeignKey("employee.emp_id", ondelete="SET NULL"), nullable=True)
    content = Column(Text, nullable=False)
    parent_comment_id = Column(Integer, ForeignKey("task_comment.comment_id", ondelete="CASCADE"), nullable=True)

    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    task = relationship("Task", back_populates="comments")
    employee = relationship("Employee", back_populates="comments")
    replies = relationship("TaskComment", backref="parent_comment", remote_side=[comment_id])

    def __repr__(self):
        return f"<TaskComment(id={self.comment_id}, task_id={self.task_id}, emp_id={self.emp_id})>"


# =========================
# 👥 TaskMember (many-to-many Task ↔ Employee)
# =========================
class TaskMember(Base):
    __tablename__ = "task_member"
    __table_args__ = (
        UniqueConstraint("task_id", "emp_id", name="uq_task_member"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("task.task_id", ondelete="CASCADE"), nullable=False)
    emp_id: Mapped[int] = mapped_column(ForeignKey("employee.emp_id", ondelete="CASCADE"), nullable=False)

    task = relationship("Task", back_populates="members", lazy="selectin")
    employee = relationship("Employee", back_populates="task_memberships", lazy="selectin")

    def __repr__(self) -> str:
        return f"<TaskMember T{self.task_id} E{self.emp_id}>"



