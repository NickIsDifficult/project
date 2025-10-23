# backend/app/routers/auth/me.py
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.user import ProfileOut, ProfilePatch, PasswordChange
from app.services.user_service import get_my_profile_aggregated, update_my_profile_xref, change_my_password
from app.utils.token import get_current_user
from app.models.member import Member
from app.models.employee import Employee
from app.models.external import External
from app.models.department import Department
from app.models.role import Role

router = APIRouter(prefix="/auth", tags=["auth"])

# backend/app/routers/auth/me.py
@router.get("/me")
def get_me(current: Member = Depends(get_current_user), db: Session = Depends(get_db)):
    utype = getattr(current.user_type, "value", current.user_type)
    base_info = {
        "member_id": current.member_id,
        "login_id": current.login_id,
        "user_type": utype,
        "dept_no": current.dept_no,
        "role_no": current.role_no,
        "failed_attempts": current.failed_attempts,
        "locked_until": current.locked_until,
        "created_at": current.created_at,
        "updated_at": current.updated_at,
    }

    if utype == "EMPLOYEE":
        row = db.execute(
            select(
                Employee.name,
                Employee.email,
                Employee.mobile,
                Employee.hire_date,
                Employee.birthday,
                Department.dept_name,
                Role.role_name,
            )
            .join(Department, Department.dept_id == Employee.dept_id)
            .join(Role, Role.role_id == Employee.role_id)
            .where(Employee.emp_id == current.emp_id)
        ).first()
        if row:
            base_info.update(dict(row._mapping))

    elif utype == "EXTERNAL":
        row = db.execute(
            select(
                External.name,
                External.email,
                External.mobile,
                External.company,
                Department.dept_name,
                Role.role_name,
            )
            .join(Department, Department.dept_id == External.dept_id)
            .join(Role, Role.role_id == External.role_id)
            .where(External.ext_id == current.ext_id)
        ).first()
        if row:
            base_info.update(dict(row._mapping))

    return {"member": base_info}


@router.patch("/me", response_model=ProfileOut)
def patch_me(
    payload: ProfilePatch,
    db: Session = Depends(get_db),
    me: Member = Depends(get_current_user),
):
    return update_my_profile_xref(
        db,
        me,
        name=payload.name,
        email=payload.email,
    )

@router.put("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def put_me_password(
    payload: PasswordChange,
    db: Session = Depends(get_db),
    me: Member = Depends(get_current_user),
):
    ok, msg = change_my_password(db, me, payload.current, payload.next)
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
