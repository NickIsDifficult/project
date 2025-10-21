from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class MemberUpdate(BaseModel):
    current_state: Optional[str] = None
    email: Optional[EmailStr] = None


class MemberResponse(BaseModel):
    member_id: int
    name: Optional[str] = None
    role_name: Optional[str] = None
    current_state: Optional[str] = None
    email: Optional[str] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
