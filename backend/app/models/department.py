# backend/app/models/department.py
from sqlalchemy import Column, Integer, String, DateTime, text
from app.database import Base

class Department(Base):
    __tablename__ = "department"

    dept_id = Column(Integer, primary_key=True, autoincrement=True)
    dept_name = Column(String(50), unique=True, nullable=False)
    created_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(
        DateTime,
        server_default=text("CURRENT_TIMESTAMP"),
        server_onupdate=text("CURRENT_TIMESTAMP"),
    )
