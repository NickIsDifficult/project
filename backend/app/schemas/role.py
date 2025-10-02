# backend/app/schemas/role.py
from pydantic import BaseModel

class RoleResponse(BaseModel):
    role_id: int
    role_name: str

    model_config = {"from_attributes": True}
