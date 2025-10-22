from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, Enum, ForeignKey
from app.database import Base
from app.models.enums import TaskStatus

class TaskHistory(Base):
    __tablename__ = "task_history"

    history_id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("task.task_id", ondelete="CASCADE"), nullable=False)
    old_status = Column(Enum(TaskStatus, native_enum=False))
    new_status = Column(Enum(TaskStatus, native_enum=False))
    changed_by = Column(Integer, ForeignKey("employee.emp_id", ondelete="SET NULL"))
    changed_at = Column(DateTime, default=datetime.utcnow)
