from sqlalchemy import Column, Integer, String, Text, Date, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Milestone(Base):
    __tablename__ = "milestone"

    milestone_id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("project.project_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(Date, nullable=True)
    status = Column(Enum("PLANNED", "ACHIEVED", "MISSED", name="milestone_status"), default="PLANNED")

    project = relationship("Project", backref="milestones")

    def __repr__(self):
        return f"<Milestone(id={self.milestone_id}, project_id={self.project_id}, status={self.status})>"
