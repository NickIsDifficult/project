# backend/app/models/external.py
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.database import Base


class External(Base):
    __tablename__ = "external_person"

    ext_id = Column(Integer, primary_key=True, autoincrement=True)
    ext_no = Column(String(20), unique=True, nullable=False)
    dept_id = Column(Integer, ForeignKey("department.dept_id"), nullable=False)
    role_id = Column(Integer, ForeignKey("role.role_id"), nullable=False)

    name = Column(String(50), nullable=False)
    email = Column(String(100), nullable=False)  # ← unique 제거
    mobile = Column(String(20), nullable=False)  # ← unique 제거
    company = Column(String(100), nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    department = relationship("Department")
    role = relationship("Role")
    dept_id = Column(Integer, ForeignKey("department.dept_id"))
