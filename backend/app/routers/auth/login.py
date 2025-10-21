# app/routers/auth/login.py
from datetime import datetime, timezone
from typing import Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.employee import Employee
from app.models.external import External
from app.models.member import Member
from app.schemas.user import LoginRequest, LoginResponse, MemberOut
from app.utils.token import create_access_token, verify_password  # bcrypt 검증 전용

router = APIRouter(prefix="/auth", tags=["auth"])


def _as_str(v) -> str:
    """Enum('EMPLOYEE','EXTERNAL') 또는 str 모두 대응"""
    return getattr(v, "value", v)


def _fetch_employee_block(db: Session, member: Member) -> Optional[Tuple[int, int, str, str, str]]:
    """(dept_id, role_id, name, email, mobile)"""
    row = None
    if member.emp_id:
        row = db.execute(
            select(
                Employee.dept_id,
                Employee.role_id,
                Employee.name,
                Employee.email,
                Employee.mobile,
            ).where(Employee.emp_id == member.emp_id)
        ).first()
    if not row:
        row = db.execute(
            select(
                Employee.dept_id,
                Employee.role_id,
                Employee.name,
                Employee.email,
                Employee.mobile,
            ).where(Employee.emp_no == member.login_id)
        ).first()
    return row


def _fetch_external_block(db: Session, member: Member) -> Optional[Tuple[int, int, str, str, str]]:
    """(dept_id, role_id, name, email, mobile)"""
    row = None
    if member.ext_id:
        row = db.execute(
            select(
                External.dept_id,
                External.role_id,
                External.name,
                External.email,
                External.mobile,
            ).where(External.ext_id == member.ext_id)
        ).first()
    if not row:
        row = db.execute(
            select(
                External.dept_id,
                External.role_id,
                External.name,
                External.email,
                External.mobile,
            ).where(External.ext_no == member.login_id)
        ).first()
    return row


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """
    로그인 처리 (bcrypt 전용 검증)
    - 입력: LoginRequest(login_id, password)
    - 실패: 401 (ID 미존재/비밀번호 불일치), 500 (권한 블록 누락/유형 오류)
    - 성공: JWT + 사용자 요약 정보
    """
    # 1) 회원 조회
    member = db.scalars(
        select(Member).where(Member.login_id == req.login_id)
    ).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="존재하지 않는 ID 입니다.")

    # 2) 비밀번호 검증 (bcrypt만 허용)
    if not verify_password(req.password, member.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="비밀번호가 일치하지 않습니다.")

    # 3) 권한/프로필 블록 조회
    utype = _as_str(member.user_type)
    dept_id = role_id = None
    name = email = mobile = None

    if utype == "EMPLOYEE":
        row = _fetch_employee_block(db, member)
        if row:
            dept_id, role_id, name, email, mobile = row
    elif utype == "EXTERNAL":
        row = _fetch_external_block(db, member)
        if row:
            dept_id, role_id, name, email, mobile = row
    else:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="알 수 없는 사용자 유형입니다.")

    if dept_id is None or role_id is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="권한 정보(부서/직책)가 누락되었습니다.")

    # 4) 마지막 로그인 시각(UTC) 기록
    member.last_login_at = datetime.now(tz=timezone.utc)
    db.add(member)
    db.commit()

    # 5) 토큰 생성
    payload = {
        "sub": str(member.member_id),
        "member_id": member.member_id,
        "login_id": member.login_id,
        "user_type": utype,
        "dept_id": dept_id,
        "role_id": role_id,
    }
    access_token = create_access_token(payload)

    # 6) 응답
    member_out = MemberOut(
        member_id=member.member_id,
        login_id=member.login_id,
        name=name,
        email=email,
        mobile=mobile,
        dept_id=dept_id,
        role_id=role_id,
        user_type=utype,
    )
    return LoginResponse(access_token=access_token, token_type="bearer", member=member_out)
