# backend/app/schemas/user.py
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field, field_validator

# 토큰/응답에서 사용할 유저 타입 리터럴
UserTypeLiteral = Literal["EMPLOYEE", "EXTERNAL"]


# ---------------------------
# 1) 회원가입 요청/응답
# ---------------------------
class SignupRequest(BaseModel):
    user_type: UserTypeLiteral
    name: str
    email: EmailStr
    mobile: str
    # EMPLOYEE 전용
    dept_id: Optional[int] = None
    role_id: Optional[int] = None
    # EXTERNAL 전용
    company: Optional[str] = None

    # 폼(select)에서 ""로 들어오는 숫자 필드 보정
    @field_validator("dept_id", "role_id", mode="before")
    @classmethod
    def ints_or_none(cls, v):
        if v in ("", None):
            return None
        return int(v)


class SignupResponse(BaseModel):
    member_id: int
    user_type: UserTypeLiteral
    login_id: str
    initial_password: str = "0000"


# ---------------------------
# 2) 로그인 요청/응답
# ---------------------------
class LoginRequest(BaseModel):
    login_id: str
    password: str


class MemberOut(BaseModel):
    """
    로그인 성공 시 프론트에서 상태 구성/표시에 쓰는 멤버 요약 스키마.
    - DB Member ORM에서 직렬화되므로 from_attributes=True 필요
    - user_type이 Enum인 경우도 안전하게 값으로 직렬화(use_enum_values=True)
    """
    member_id: int
    login_id: str
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    mobile: Optional[str] = None
    role_id: int
    dept_id: int
    user_type: UserTypeLiteral

    # Pydantic v2 설정
    model_config = {
        "from_attributes": True,
        "use_enum_values": True,  # Enum -> 값으로 직렬화(예: 'EMPLOYEE'/'EXTERNAL')
    }


class LoginResponse(BaseModel):
    """
    토큰 + 멤버 요약을 함께 반환.
    - 기존 필드(access_token, token_type)는 그대로 유지
    - 프론트는 res.data.member 로 사용자 정보 사용 가능
    """
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    member: MemberOut



class ProfileOut(BaseModel):
    """
    내 정보 조회 응답 스키마
    - DB 정본은 employee / external에 있으므로, 서버에서 토큰 주체로 식별 후
      해당 테이블에서 name/email을 읽어 이 스키마로 반환합니다.
    """
    member_id: int
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    user_type: UserTypeLiteral

    # Pydantic v2
    model_config = {"from_attributes": True}
   

class PasswordChange(BaseModel):
    current: str = Field(min_length=1)
    next: str = Field(min_length=8)

class ProfilePatch(BaseModel):
    """
    내 정보 부분 수정 요청 스키마
    - 부분 수정이므로 들어온 필드만 반영합니다.
    """
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[PasswordChange] = None