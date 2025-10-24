# app/models/notice.py
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base

class Notice(Base):
    __tablename__ = "notice"

    notice_id = Column(Integer, primary_key=True, index=True)
    dept_id = Column(Integer, ForeignKey("department.dept_id"), nullable=False)
    title = Column(String(100), nullable=False)
    content = Column(Text)
    reg_date = Column(DateTime, server_default=func.now())
    update_time = Column(DateTime, server_default=func.now(), onupdate=func.now())
    read_count = Column(Integer, default=0)

    # ✅ 관계
    department = relationship("Department", backref="notices")

    def __repr__(self):
        return f"<Notice(id={self.notice_id}, title={self.title})>"
