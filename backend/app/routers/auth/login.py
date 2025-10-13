# 경로: backend/app/routers/auth/login.py
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
    # Enum('EMPLOYEE','EXTERNAL') 또는 문자열 모두 대응
    return getattr(v, "value", v)


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    # 1) 멤버 조회 + 패스워드 검증 (사실)
    member = db.scalars(select(Member).where(Member.login_id == req.login_id)).first()
    if not member:
        raise HTTPException(status_code=401, detail="존재하지 않는 ID 입니다.")
    if not verify_password(req.password, member.password_hash):
        raise HTTPException(status_code=401, detail="비밀번호가 일치하지 않습니다.")

    # 2) 마지막 로그인 기록
    member.last_login_at = datetime.utcnow()
    db.add(member)
    db.commit()

    # 3) user_type 기준으로 프로필/권한 수집 (Employee or External)
    utype = _as_str(member.user_type)
    dept_id = None
    role_id = None
    name = None
    email = None
    mobile = None

    if utype == "EMPLOYEE":
        # 우선 FK(emp_id)로 조회, 없으면 emp_no == login_id 로 폴백
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
        if row:
            dept_id, role_id, name, email, mobile = row

        # EXTERNAL FK가 실수로 함께 세팅되어 있다면 데이터 정합성 경고/차단 (정책상 하나만 존재)
        if member.ext_id:
            # 필요 시 로깅/모니터링
            pass

    elif utype == "EXTERNAL":
        # 우선 FK(ext_id)로 조회, 없으면 ext_no == login_id 로 폴백
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
        if row:
            dept_id, role_id, name, email, mobile = row

        if member.emp_id:
            # 필요 시 로깅/모니터링
            pass

    else:
        raise HTTPException(status_code=500, detail="알 수 없는 사용자 유형입니다.")

    # 필수 권한 정보 누락 시 차단 (정책에 맞게 메시지 조정 가능)
    if dept_id is None or role_id is None:
        raise HTTPException(
            status_code=500, detail="권한 정보(부서/직책)가 누락되었습니다."
        )

    # 4) 토큰(인가 최소 정보 위주) 생성
    payload = {
        "sub": str(member.member_id),  # 표준 subject
        "member_id": member.member_id,
        "login_id": member.login_id,
        "user_type": utype,
        "dept_id": dept_id,
        "role_id": role_id,
        # exp는 create_access_token() 내부에서 설정 (사실)
    }
    token = create_access_token(payload)

    # 5) 응답 바디(프론트 상태 구성용): 중복 제거된 요약
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
    return LoginResponse(access_token=token, token_type="bearer", member=member_out)
