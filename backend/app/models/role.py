# app/models/role.py
from sqlalchemy import Column, DateTime, Integer, String, text
from sqlalchemy.orm import relationship

from app.database import Base


class Role(Base):
    __tablename__ = "role"

    role_id = Column(Integer, primary_key=True, autoincrement=True)
    role_name = Column(String(50), unique=True, nullable=False)
    created_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(
        DateTime,
        server_default=text("CURRENT_TIMESTAMP"),
        server_onupdate=text("CURRENT_TIMESTAMP"),
    )

    # ✅ 추가 (부서별 권한 관계)
    permissions = relationship("DepartmentPermission", back_populates="role")
