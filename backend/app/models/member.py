# app/models/member.py
import enum
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, text
from app.database import Base


# ---------------------------
# ENUM 정의 (먼저 선언)
# ---------------------------
class UserType(str, enum.Enum):
    EMPLOYEE = "EMPLOYEE"
    EXTERNAL = "EXTERNAL"


class MemberStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"
    DELETED = "DELETED"


class WorkState(str, enum.Enum):
    WORKING = "WORKING"
    FIELD = "FIELD"
    AWAY = "AWAY"
    OFF = "OFF"


# ---------------------------
# MEMBER 테이블 모델 정의
# ---------------------------
class Member(Base):
    __tablename__ = "member"

    member_id = Column(Integer, primary_key=True, autoincrement=True)
    login_id = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(100), nullable=True)

    user_type = Column(Enum(UserType), nullable=False)
    status = Column(Enum(MemberStatus), server_default="ACTIVE")
    current_state = Column(Enum(WorkState), default=WorkState.WORKING, nullable=False)

    emp_id = Column(Integer, ForeignKey("employee.emp_id"), nullable=True)
    ext_id = Column(Integer, ForeignKey("external_person.ext_id"), nullable=True)

    last_login_at = Column(DateTime, nullable=True)
    failed_attempts = Column(Integer, nullable=False, server_default="0")
    locked_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(
        DateTime,
        server_default=text("CURRENT_TIMESTAMP"),
        server_onupdate=text("CURRENT_TIMESTAMP"),
    )
