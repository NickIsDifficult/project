# backend/app/routers/auth/login.py
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.employee import Employee
from app.models.external import External
from app.models.member import Member
from app.schemas.user import LoginRequest, LoginResponse, MemberOut
from app.utils.token import create_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _as_str(v):
    """Enum 또는 문자열 모두 대응"""
    return getattr(v, "value", v)


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    # ------------------------------
    # 1) ID/PW 검증
    # ------------------------------
    member = db.scalar(select(Member).where(Member.login_id == req.login_id))
    if not member:
        raise HTTPException(status_code=401, detail="존재하지 않는 ID 입니다.")
    if not verify_password(req.password, member.password_hash):
        raise HTTPException(status_code=401, detail="비밀번호가 일치하지 않습니다.")

    # ------------------------------
    # 2) 로그인 시각 기록
    # ------------------------------
    member.last_login_at = datetime.utcnow()
    db.add(member)
    db.commit()

    # ------------------------------
    # 3) 유저 타입별 기본정보 수집
    # ------------------------------
    utype = _as_str(member.user_type)
    name = email = mobile = None
    dept_id = role_id = None
    dept_no = role_no = None

    if utype == "EMPLOYEE":
        query = select(
            Employee.dept_id,
            Employee.role_id,
            Employee.dept_no,
            Employee.role_no,
            Employee.name,
            Employee.email,
            Employee.mobile,
        )
        if member.emp_id:
            query = query.where(Employee.emp_id == member.emp_id)
        else:
            query = query.where(Employee.emp_no == member.login_id)

        row = db.execute(query).first()
        if not row:
            raise HTTPException(status_code=404, detail="직원 정보를 찾을 수 없습니다.")
        dept_id, role_id, dept_no, role_no, name, email, mobile = row

    elif utype == "EXTERNAL":
        query = select(
            External.dept_id,
            External.role_id,
            External.dept_no,
            External.role_no,
            External.name,
            External.email,
            External.mobile,
        )
        if member.ext_id:
            query = query.where(External.ext_id == member.ext_id)
        else:
            query = query.where(External.ext_no == member.login_id)

        row = db.execute(query).first()
        if not row:
            raise HTTPException(status_code=404, detail="외부인 정보를 찾을 수 없습니다.")
        dept_id, role_id, dept_no, role_no, name, email, mobile = row

    else:
        raise HTTPException(status_code=500, detail="알 수 없는 사용자 유형입니다.")

    # ------------------------------
    # 4) 권한 정보 검증
    # ------------------------------
    if not dept_id or not role_id:
        raise HTTPException(status_code=500, detail="부서/직책 정보가 누락되었습니다.")

    # ------------------------------
    # 5) 토큰 생성
    # ------------------------------
    payload = {
        "sub": str(member.member_id),
        "member_id": member.member_id,
        "login_id": member.login_id,
        "user_type": utype,
        "dept_id": dept_id,
        "role_id": role_id,
        "dept_no": dept_no,
        "role_no": role_no,
    }
    token = create_access_token(payload)

    # ------------------------------
    # 6) 응답
    # ------------------------------
    member_out = MemberOut(
        member_id=member.member_id,
        login_id=member.login_id,
        name=name,
        email=email,
        mobile=mobile,
        user_type=utype,
        dept_no=dept_no,
        role_no=role_no,
    )

    return LoginResponse(access_token=token, token_type="bearer", member=member_out)
