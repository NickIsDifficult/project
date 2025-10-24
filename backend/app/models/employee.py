# app/models/employee.py
from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship
from app.database import Base


class Employee(Base):
    __tablename__ = "employee"

    emp_id = Column(Integer, primary_key=True, autoincrement=True)
    emp_no = Column(String(20), unique=True, nullable=False)
    dept_id = Column(Integer, ForeignKey("department.dept_id"), nullable=False)
    role_id = Column(Integer, ForeignKey("role.role_id"), nullable=False)
    dept_no = Column(String(20), nullable=False)
    role_no = Column(String(20), nullable=False)
    name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    mobile = Column(String(20), unique=True, nullable=False)
    hire_date = Column(Date, nullable=True)
    birthday = Column(Date, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    department = relationship("Department", back_populates="employees")
    role = relationship("Role")
    attachment = relationship("Attachment", back_populates="uploader", cascade="all, delete-orphan", lazy="selectin")
    projectmember = relationship("ProjectMember", back_populates="employee")
    tasks = relationship("Task", secondary="task_member", back_populates="employee", lazy="selectin")
    taskmember = relationship("TaskMember", back_populates="employee", lazy="selectin")
    comments = relationship("TaskComment", back_populates="employee")
    notification_received = relationship("Notification", back_populates="recipient", foreign_keys="Notification.recipient_emp_id", cascade="all, delete-orphan", lazy="selectin")
    notification_sent = relationship("Notification", back_populates="actor", foreign_keys="Notification.actor_emp_id", lazy="selectin")
    activitylog = relationship("ActivityLog", back_populates="employee", cascade="all, delete-orphan", lazy="selectin")
