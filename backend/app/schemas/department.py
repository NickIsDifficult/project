# backend/app/schemas/department.py
from pydantic import BaseModel

class DepartmentResponse(BaseModel):
    dept_id: int
    dept_name: str

    model_config = {"from_attributes": True}
