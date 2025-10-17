# app/models/attachment.py
from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import relationship

from app.database import Base


class Attachment(Base):
    __tablename__ = "attachment"

    attachment_id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(
        Integer, ForeignKey("project.project_id", ondelete="CASCADE"), nullable=True
    )
    task_id = Column(
        Integer, ForeignKey("task.task_id", ondelete="CASCADE"), nullable=True
    )
    uploaded_by = Column(
        Integer, ForeignKey("employee.emp_id", ondelete="SET NULL"), nullable=True
    )

    file_name = Column(String(255), nullable=False)
    file_path = Column(String(1024), nullable=False)
    file_size = Column(BigInteger)
    file_type = Column(String(100))
    is_deleted = Column(Boolean, default=False)

    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    # 🔗 관계 설정
    project = relationship("Project", back_populates="attachments")
    task = relationship("Task", back_populates="attachments")
    uploader = relationship("Employee", back_populates="attachments")  # ✅ 이름 일치

    def __repr__(self):
        return f"<Attachment(id={self.attachment_id}, file={self.file_name})>"
