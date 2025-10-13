# app/routers/auth_router.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from projectlist.core.auth import (
    create_access_token,
    get_current_user,
    get_password_hash,
    verify_password,
)
from projectlist.core.exceptions import bad_request, conflict, not_found, unauthorized
from projectlist.database import get_db
from projectlist.models.employee import Member, UserType
from projectlist.schemas.auth import LoginRequest, LoginResponse, SignupRequest, SignupResponse

router = APIRouter(prefix="/auth", tags=["auth"])


# -------------------------------
# 로그인
# -------------------------------
@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(Member).filter(Member.login_id == request.login_id).first()
    if not user:
        not_found("존재하지 않는 계정입니다.")

    if not verify_password(request.password, user.password_hash):
        unauthorized("비밀번호가 일치하지 않습니다.")

    access_token = create_access_token(
        data={"sub": user.login_id, "user_type": user.user_type}
    )

    return {
        "success": True,
        "message": f"{user.login_id}님 로그인 성공!",
        "token": access_token,
    }


# -------------------------------
# 회원가입
# -------------------------------
@router.post("/signup", response_model=SignupResponse)
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    existing_user = db.query(Member).filter(Member.login_id == request.login_id).first()
    if existing_user:
        conflict("이미 존재하는 ID입니다.")

    hashed_pw = get_password_hash(request.password)
    new_user = Member(
        login_id=request.login_id,
        password_hash=hashed_pw,
        user_type=request.user_type,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "success": True,
        "message": f"{new_user.login_id} 회원가입 완료!",
        "user_id": new_user.member_id,
    }


# -------------------------------
# 내 정보 확인
# -------------------------------
@router.get("/me", response_model=LoginResponse)
def get_me(current_user: Member = Depends(get_current_user)):
    return {
        "success": True,
        "message": "현재 로그인한 사용자 정보입니다.",
        "login_id": current_user.login_id,
        "user_type": current_user.user_type,
    }
