from sqlalchemy import (
    DECIMAL,
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import (
    MemberRole,
    MilestoneStatus,
    ProjectStatus,
    TaskPriority,
    TaskStatus,
)


# ---------------------------------
# 프로젝트
# ---------------------------------
class Project(Base):
    __tablename__ = "project"

    project_id = Column(Integer, primary_key=True, index=True)
    project_name = Column(String(200), nullable=False)
    description = Column(Text)
    start_date = Column(Date)
    end_date = Column(Date)
    status = Column(
        Enum(ProjectStatus, native_enum=False), default=ProjectStatus.PLANNED
    )
    owner_emp_id = Column(
        Integer, ForeignKey("employee.emp_id", ondelete="SET NULL"), nullable=True
    )

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # ✅ 관계
    owner = relationship(
        "Employee", backref="owned_projects", foreign_keys=[owner_emp_id]
    )
    members = relationship(
        "ProjectMember", back_populates="project", cascade="all, delete-orphan"
    )
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    milestones = relationship(
        "Milestone", back_populates="project", cascade="all, delete-orphan"
    )
    comments = relationship(
        "TaskComment", back_populates="project", cascade="all, delete-orphan"
    )
    attachments = relationship(
        "Attachment", back_populates="project", cascade="all, delete-orphan"
    )


# ---------------------------------
# 프로젝트 멤버
# ---------------------------------
class ProjectMember(Base):
    __tablename__ = "project_member"

    project_id = Column(
        Integer, ForeignKey("project.project_id", ondelete="CASCADE"), primary_key=True
    )
    emp_id = Column(
        Integer, ForeignKey("employee.emp_id", ondelete="CASCADE"), primary_key=True
    )
    role = Column(Enum(MemberRole, native_enum=False), default=MemberRole.MEMBER)

    project = relationship("Project", back_populates="members")
    employee = relationship(
        "Employee", back_populates="project_memberships", overlaps="projects, members"
    )


# ---------------------------------
# 업무(Task)
# ---------------------------------
class Task(Base):
    __tablename__ = "task"

    task_id = Column(Integer, primary_key=True, index=True)
    project_id = Column(
        Integer, ForeignKey("project.project_id", ondelete="CASCADE"), nullable=False
    )
    title = Column(String(300), nullable=False)
    description = Column(Text)
    priority = Column(
        Enum(TaskPriority, native_enum=False), default=TaskPriority.MEDIUM
    )
    status = Column(Enum(TaskStatus, native_enum=False), default=TaskStatus.TODO)
    parent_task_id = Column(
        Integer, ForeignKey("task.task_id", ondelete="CASCADE"), nullable=True
    )
    start_date = Column(Date)
    due_date = Column(Date)
    estimate_hours = Column(DECIMAL(6, 2), default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    progress = Column(Integer, default=0)

    # ✅ 관계
    project = relationship("Project", back_populates="tasks")

    # 🔗 다중 담당자 관계
    task_assignees = relationship(
        "TaskAssignee",
        back_populates="task",
        cascade="all, delete-orphan",
    )

    # 읽기 편의용 (Employee 리스트)
    assignees = relationship(
        "Employee",
        secondary="task_assignee",
        viewonly=True,
    )

    comments = relationship(
        "TaskComment", back_populates="task", cascade="all, delete-orphan"
    )
    histories = relationship(
        "TaskHistory", back_populates="task", cascade="all, delete-orphan"
    )
    parent = relationship("Task", remote_side=[task_id], back_populates="subtasks")
    subtasks = relationship(
        "Task", back_populates="parent", cascade="all, delete-orphan"
    )
    attachments = relationship(
        "Attachment", back_populates="task", cascade="all, delete-orphan"
    )


# ---------------------------------
# 업무 담당자 연결 테이블
# ---------------------------------
class TaskAssignee(Base):
    __tablename__ = "task_assignee"

    task_id = Column(
        Integer, ForeignKey("task.task_id", ondelete="CASCADE"), primary_key=True
    )
    emp_id = Column(
        Integer, ForeignKey("employee.emp_id", ondelete="CASCADE"), primary_key=True
    )
    assigned_at = Column(DateTime, server_default=func.now())

    # 관계
    task = relationship("Task", back_populates="task_assignees")
    employee = relationship("Employee", back_populates="employee_tasks")


# ---------------------------------
# 댓글
# ---------------------------------
class TaskComment(Base):
    __tablename__ = "task_comment"

    comment_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(
        Integer, ForeignKey("project.project_id", ondelete="CASCADE"), nullable=False
    )
    task_id = Column(
        Integer, ForeignKey("task.task_id", ondelete="CASCADE"), nullable=False
    )
    emp_id = Column(
        Integer, ForeignKey("employee.emp_id", ondelete="CASCADE"), nullable=False
    )

    content = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    project = relationship("Project", back_populates="comments")
    task = relationship("Task", back_populates="comments")
    employee = relationship("Employee", back_populates="comments")

    def __repr__(self):
        return f"<TaskComment(comment_id={self.comment_id}, task_id={self.task_id}, emp_id={self.emp_id})>"


# ---------------------------------
# 마일스톤
# ---------------------------------
class Milestone(Base):
    __tablename__ = "milestone"

    milestone_id = Column(Integer, primary_key=True, index=True)
    project_id = Column(
        Integer, ForeignKey("project.project_id", ondelete="CASCADE"), nullable=False
    )
    name = Column(String(200), nullable=False)
    description = Column(Text)
    due_date = Column(Date)
    status = Column(
        Enum(MilestoneStatus, native_enum=False), default=MilestoneStatus.PLANNED
    )

    project = relationship("Project", back_populates="milestones")


# ---------------------------------
# 태스크 이력
# ---------------------------------
class TaskHistory(Base):
    __tablename__ = "task_history"

    history_id = Column(Integer, primary_key=True, index=True)
    task_id = Column(
        Integer, ForeignKey("task.task_id", ondelete="CASCADE"), nullable=False
    )
    old_status = Column(Enum(TaskStatus, native_enum=False))
    new_status = Column(Enum(TaskStatus, native_enum=False))
    changed_by = Column(Integer, ForeignKey("employee.emp_id", ondelete="SET NULL"))
    changed_at = Column(DateTime, server_default=func.now())

    task = relationship("Task", back_populates="histories")
