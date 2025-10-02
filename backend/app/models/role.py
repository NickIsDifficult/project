# backend/app/models/role.py
from sqlalchemy import Column, Integer, String, DateTime, text
from app.database import Base

class Role(Base):
    __tablename__ = "role"
    role_id = Column(Integer, primary_key=True, autoincrement=True)
    role_name = Column(String(50), unique=True, nullable=False)
    created_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"), server_onupdate=text("CURRENT_TIMESTAMP"))
