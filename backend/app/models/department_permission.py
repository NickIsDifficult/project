from sqlalchemy import Column, Integer, Enum, ForeignKey
from app.database import Base

class DepartmentPermission(Base):
    __tablename__ = "department_permission"

    dept_id = Column(Integer, ForeignKey("department.dept_id", ondelete="CASCADE"), primary_key=True)
    role_id = Column(Integer, ForeignKey("role.role_id", ondelete="CASCADE"), primary_key=True)
    permission = Column(Enum("READ", "WRITE", "APPROVE", name="permission_enum"), primary_key=True)
