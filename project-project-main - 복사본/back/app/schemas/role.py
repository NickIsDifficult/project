# backend/app/schemas/role.py
from pydantic import BaseModel


class Role(BaseModel):
    role_id: int
    role_name: str
    role_level: int

    class Config:
        from_attributes = True


class RoleResponse(BaseModel):
    role_id: int
    role_name: str

    model_config = {"from_attributes": True}
