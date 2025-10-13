from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from projectlist.database import Base


# ----------------------------------------
# 부서 (Department)
# ----------------------------------------
class Department(Base):
    __tablename__ = "department"

    dept_id = Column(Integer, primary_key=True, index=True)
    dept_name = Column(String(50), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    employees = relationship("Employee", back_populates="department")
    externals = relationship("ExternalPerson", back_populates="department")
    permissions = relationship("DepartmentPermission", back_populates="department")


# ----------------------------------------
# 직급 / 권한 (Role)
# ----------------------------------------
class Role(Base):
    __tablename__ = "role"

    role_id = Column(Integer, primary_key=True, index=True)
    role_name = Column(String(50), unique=True, nullable=False)
    role_level = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employees = relationship("Employee", back_populates="role")
    permissions = relationship("DepartmentPermission", back_populates="role")


# ----------------------------------------
# 부서별 권한 (DepartmentPermission)
# ----------------------------------------
class DepartmentPermission(Base):
    __tablename__ = "department_permission"

    dept_id = Column(Integer, ForeignKey("department.dept_id"), primary_key=True)
    role_id = Column(Integer, ForeignKey("role.role_id"), primary_key=True)
    permission = Column(String(20), primary_key=True)  # ENUM('READ','WRITE','APPROVE')

    department = relationship("Department", back_populates="permissions")
    role = relationship("Role", back_populates="permissions")
