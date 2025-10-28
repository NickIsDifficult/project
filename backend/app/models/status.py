# app/models/status.py
from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from app.database import Base


class Status(Base):
    __tablename__ = "status"

    id = Column(Integer, primary_key=True, autoincrement=True)
    type = Column(String(50), nullable=False)
    start_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=False)
    username = Column(String(100), nullable=True)
