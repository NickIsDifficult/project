from enum import Enum
from typing import Optional

from pydantic import BaseModel


class UserType(str, Enum):
    EMPLOYEE = "EMPLOYEE"
    EXTERNAL = "EXTERNAL"


class LoginRequest(BaseModel):
    login_id: str
    password: str


class SignupRequest(BaseModel):
    login_id: str
    password: str
    user_type: UserType


class LoginResponse(BaseModel):
    success: bool
    message: str
    token: Optional[str] = None

class SignupResponse(BaseModel):
    success: bool
    message: str
    
