# backend/app/models/member.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, text
from app.database import Base
import enum

class UserType(str, enum.Enum):
    EMPLOYEE = "EMPLOYEE"
    EXTERNAL = "EXTERNAL"

class Member(Base):
    __tablename__ = "member"
    member_id = Column(Integer, primary_key=True, autoincrement=True)
    login_id = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    emp_id = Column(Integer, ForeignKey("employee.emp_id"), nullable=True)
    ext_id = Column(Integer, ForeignKey("external.ext_id"), nullable=True)
    user_type = Column(Enum(UserType), nullable=False)
    last_login_at = Column(DateTime, nullable=True)
    failed_attempts = Column(Integer, nullable=False, server_default="0")
    locked_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"), server_onupdate=text("CURRENT_TIMESTAMP"))