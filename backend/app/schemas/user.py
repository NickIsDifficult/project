# backend/app/schemas/user.py
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field

UserTypeLiteral = Literal["EMPLOYEE", "EXTERNAL"]

class SignupRequest(BaseModel):
    user_type: UserTypeLiteral
    name: str
    email: EmailStr
    mobile: str
    # EMPLOYEE 전용 (코드 기반)
    dept_no: Optional[str] = None
    role_no: Optional[str] = None
    # EXTERNAL 전용
    company: Optional[str] = None

class SignupResponse(BaseModel):
    member_id: int
    user_type: UserTypeLiteral
    login_id: str
    initial_password: str = "0000"

class LoginRequest(BaseModel):
    login_id: str
    password: str

class MemberOut(BaseModel):
    member_id: int
    login_id: str
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    mobile: Optional[str] = None
    user_type: UserTypeLiteral
    dept_no: Optional[str] = None
    role_no: Optional[str] = None
    dept_name: Optional[str] = None
    role_name: Optional[str] = None

    model_config = {
        "from_attributes": True,
        "use_enum_values": True,
    }

class LoginResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    member: MemberOut

class ProfileOut(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    model_config = {"from_attributes": True}

class PasswordChange(BaseModel):
    current: str = Field(min_length=1)
    next: str = Field(min_length=8)

class ProfilePatch(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[PasswordChange] = None
