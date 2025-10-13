import enum
from datetime import datetime

from sqlalchemy import Column, Date, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from projectlist.database import Base


class UserType(str, enum.Enum):
    EMPLOYEE = "EMPLOYEE"
    EXTERNAL = "EXTERNAL"


class Employee(Base):
    __tablename__ = "employee"

    emp_id = Column(Integer, primary_key=True, index=True)
    emp_no = Column(String(20), unique=True, nullable=False)
    dept_id = Column(Integer, ForeignKey("department.dept_id", ondelete="CASCADE"))
    role_id = Column(Integer, ForeignKey("role.role_id", ondelete="CASCADE"))
    name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    mobile = Column(String(20), unique=True, nullable=False)
    hire_date = Column(Date)
    birthday = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # ✅ 관계
    department = relationship("Department", back_populates="employees")
    role = relationship("Role", back_populates="employees")
    member_account = relationship("Member", back_populates="employee", uselist=False)
    project_memberships = relationship("ProjectMember", back_populates="employee")
    tasks = relationship("Task", back_populates="assignee")
    comments = relationship(
        "TaskComment", back_populates="employee", cascade="all, delete-orphan"
    )

    # ✅ 문자열 기반의 forward reference — 여기서 Attachment를 직접 import하지 않음
    attachments = relationship(
        "Attachment", back_populates="uploader", cascade="all, delete-orphan"
    )


class ExternalPerson(Base):
    __tablename__ = "external_person"

    ext_id = Column(Integer, primary_key=True, index=True)
    ext_no = Column(String(20), unique=True, nullable=False)
    dept_id = Column(Integer, ForeignKey("department.dept_id"), nullable=False)
    role_id = Column(Integer, ForeignKey("role.role_id"), nullable=False)
    name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    mobile = Column(String(20), unique=True, nullable=False)
    company = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    department = relationship("Department", back_populates="externals")
    role = relationship("Role")


class Member(Base):
    __tablename__ = "member"

    member_id = Column(Integer, primary_key=True, index=True)
    login_id = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    emp_id = Column(Integer, ForeignKey("employee.emp_id"))
    ext_id = Column(Integer, ForeignKey("external_person.ext_id"))
    user_type = Column(Enum(UserType), nullable=False)
    last_login_at = Column(DateTime)
    failed_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", back_populates="member_account")
    external = relationship("ExternalPerson")
