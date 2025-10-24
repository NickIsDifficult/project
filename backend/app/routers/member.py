# app/routers/member.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.member import Member, WorkState
from app.models.employee import Employee
from app.models.role import Role
from app.schemas.member import MemberUpdate, MemberResponse
from app.utils.token import get_current_user

router = APIRouter(prefix="/api/member", tags=["Member"])


# ✅ 회원 정보 수정 (이메일 / 상태)
@router.put("/update-info/{member_id}", response_model=MemberResponse)
def update_personal_info(member_id: int, payload: MemberUpdate, db: Session = Depends(get_db)):
    member = db.query(Member).filter(Member.member_id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    data = payload.dict(exclude_unset=True)
    if "current_state" in data:
        try:
            member.current_state = WorkState(data["current_state"])
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid work state value")

    if "email" in data:
        member.email = data["email"]

    db.commit()
    db.refresh(member)

    # ✅ employee / role 조인
    employee = db.query(Employee).filter(Employee.emp_id == member.emp_id).first()
    role_name = None
    if employee:
        role = db.query(Role).filter(Role.role_id == employee.role_id).first()
        role_name = role.role_name if role else None

    return {
        "member_id": member.member_id,
        "name": employee.name if employee else None,
        "role_name": role_name,
        "email": member.email,
        "current_state": member.current_state.value if member.current_state else None,
        "updated_at": member.updated_at,
    }


# ✅ JWT 인증 기반 현재 유저 정보 조회
@router.get("/me", response_model=MemberResponse)
def get_my_info(current_user: Member = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    JWT 토큰을 기반으로 현재 로그인한 회원 정보 반환
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="인증된 사용자가 아닙니다.")

    member = db.query(Member).filter(Member.member_id == current_user.member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    # ✅ employee / role 조인
    employee = db.query(Employee).filter(Employee.emp_id == member.emp_id).first()
    role_name = None
    if employee:
        role = db.query(Role).filter(Role.role_id == employee.role_id).first()
        role_name = role.role_name if role else None

    return {
        "member_id": member.member_id,
        "name": employee.name if employee else None,
        "role_name": role_name,
        "email": member.email,
        "current_state": member.current_state.value if member.current_state else None,
        "updated_at": member.updated_at,
    }


@router.put("/update-status/{member_id}", response_model=MemberResponse)
def update_status(member_id: int, payload: dict, db: Session = Depends(get_db)):
    member = db.query(Member).filter(Member.member_id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    # ✅ Enum 변환 처리
    new_state = payload.get("current_state")
    if new_state is None:
        raise HTTPException(status_code=400, detail="Missing current_state")

    member.current_state = WorkState(new_state)
    db.commit()
    db.refresh(member)

    # ✅ employee / role 조인
    employee = db.query(Employee).filter(Employee.emp_id == member.emp_id).first()
    role_name = None
    if employee:
        role = db.query(Role).filter(Role.role_id == employee.role_id).first()
        role_name = role.role_name if role else None

    return {
        "member_id": member.member_id,
        "name": employee.name if employee else None,
        "role_name": role_name,
        "email": member.email,
        "current_state": member.current_state.value,
        "updated_at": member.updated_at,
    }
@router.put("/reset-state/{member_id}")
def reset_member_state(member_id: int, db: Session = Depends(get_db)):
    """로그인 시 강제로 업무중(working) 상태로 초기화"""
    member = db.query(Member).filter(Member.member_id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    member.current_state = "WORKING"
    db.commit()
    db.refresh(member)
    return {"message": "상태 초기화 완료", "current_state": member.current_state}
