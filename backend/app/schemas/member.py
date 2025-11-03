from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class MemberUpdate(BaseModel):
    current_state: Optional[str] = None
    email: Optional[EmailStr] = None

class MemberResponse(BaseModel):
    member_id: int
    current_state: Optional[str] = None
    email: Optional[str] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
