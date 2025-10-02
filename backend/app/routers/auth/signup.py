from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.database import get_db
from app.schemas.user import SignupRequest, SignupResponse
from app.schemas.department import DepartmentResponse
from app.schemas.role import RoleResponse
from app.models.department import Department
from app.models.role import Role
from app.services.user_service import (
    create_employee_with_member, create_external_with_member, INITIAL_PASSWORD
)

router = APIRouter()  # ← 반드시 최상단 전역 스코프에 있어야 함

@router.get("/lookup/departments", response_model=list[DepartmentResponse])
def list_departments(for_user: str = "EMPLOYEE", db: Session = Depends(get_db)):
    if for_user not in ("EMPLOYEE", "EXTERNAL"):
        for_user = "EMPLOYEE"
    rows = db.scalars(select(Department).order_by(Department.dept_id.asc())).all()
    if for_user == "EMPLOYEE":
        rows = [d for d in rows if d.dept_id != 10]
    return rows

@router.get("/lookup/roles", response_model=list[RoleResponse])
def list_roles(for_user: str = "EMPLOYEE", db: Session = Depends(get_db)):
    if for_user not in ("EMPLOYEE", "EXTERNAL"):
        for_user = "EMPLOYEE"
    rows = db.scalars(select(Role).order_by(Role.role_id.asc())).all()
    if for_user == "EMPLOYEE":
        rows = [r for r in rows if r.role_id != 1]
    return rows

@router.get("/debug/ping_db")
def ping_db(db: Session = Depends(get_db)):
    v = db.execute(text("SELECT 1")).scalar()
    return {"select1": v}

@router.post("/signup", response_model=SignupResponse)
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    try:
        if req.user_type == "EMPLOYEE":
            if not req.dept_id or not req.role_id:
                raise HTTPException(status_code=400, detail="부서/직책은 필수입니다.")
            employee, member = create_employee_with_member(
                db,
                dept_id=req.dept_id, role_id=req.role_id,
                name=req.name, email=req.email, mobile=req.mobile
            )
            db.commit()
            return SignupResponse(member_id=member.member_id, user_type="EMPLOYEE",
                                  login_id=member.login_id, initial_password=INITIAL_PASSWORD)

        if req.user_type == "EXTERNAL":
            external, member = create_external_with_member(
                db, name=req.name, email=req.email, mobile=req.mobile, company=req.company
            )
            db.commit()
            return SignupResponse(member_id=member.member_id, user_type="EXTERNAL",
                                  login_id=member.login_id, initial_password=INITIAL_PASSWORD)

        raise HTTPException(status_code=400, detail="알 수 없는 사용자 유형")

    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="이미 사용 중인 정보(이메일/연락처/아이디)입니다.")
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="DB 오류가 발생했습니다.")
