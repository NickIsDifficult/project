# app/models/event.py
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("project.project_id", ondelete="CASCADE"), nullable=False)

    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)

    # 🔹 관계 설정 (프로젝트 1:N 이벤트)
    project = relationship("Project", back_populates="events")

    def __repr__(self):
        return f"<Event(id={self.id}, title={self.title}, start={self.start_date})>"
