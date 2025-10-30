# backend/app/routers/admin/dept_role.py
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, text, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict, StringConstraints

from app.database import get_db
from app.models.department import Department
from app.models.role import Role

router = APIRouter(prefix="/admin", tags=["admin"])

# ===== Pydantic v2 타입 제약(2자리 숫자) =====
TwoDigit = Annotated[str, StringConstraints(pattern=r"^\d{2}$", min_length=2, max_length=2)]

# ===== Schemas =====
class DepartmentCreate(BaseModel):
    dept_name: str
    dept_no: TwoDigit

class DepartmentUpdate(BaseModel):
    dept_name: str | None = None
    dept_no: TwoDigit | None = None

class DepartmentOut(BaseModel):
    dept_id: int
    dept_no: str
    dept_name: str
    created_at: datetime | None = None
    updated_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)

class RoleCreate(BaseModel):
    role_name: str
    role_no: str

class RoleUpdate(BaseModel):
    role_name: str | None = None
    role_no: str | None = None

class RoleOut(BaseModel):
    role_id: int
    role_no: str
    role_name: str
    created_at: datetime | None = None
    updated_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)

# ===== Departments =====
@router.get("/departments", response_model=list[DepartmentOut])
def list_departments(q: str = Query("", description="이름/코드 검색"), db: Session = Depends(get_db)):
    stmt = select(Department).order_by(Department.dept_no.asc())
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(Department.dept_name.like(like), Department.dept_no.like(like)))
    return db.scalars(stmt).all()

@router.post("/departments", response_model=DepartmentOut, status_code=status.HTTP_201_CREATED)
def create_department(payload: DepartmentCreate, db: Session = Depends(get_db)):
    row = Department(dept_name=payload.dept_name.strip(), dept_no=payload.dept_no.strip())
    db.add(row)
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=409, detail="이미 존재하는 부서 코드 또는 부서명입니다.") from e
    db.refresh(row)
    return row

@router.patch("/departments/{dept_id}", response_model=DepartmentOut)
def update_department(dept_id: int, payload: DepartmentUpdate, db: Session = Depends(get_db)):
    row = db.get(Department, dept_id)
    if not row:
        raise HTTPException(status_code=404, detail="부서를 찾을 수 없습니다.")

    old_no = row.dept_no
    if payload.dept_name is not None:
        row.dept_name = payload.dept_name.strip()
    if payload.dept_no is not None:
        row.dept_no = payload.dept_no.strip()

    try:
        db.flush()
        if payload.dept_no is not None and old_no != row.dept_no:
            db.execute(text("UPDATE employee SET dept_no=:new_no WHERE dept_id=:dept_id"),
                       {"new_no": row.dept_no, "dept_id": dept_id})
            db.execute(text("UPDATE external SET dept_no=:new_no WHERE dept_id=:dept_id"),
                       {"new_no": row.dept_no, "dept_id": dept_id})
            db.execute(text("""
                UPDATE member m
                JOIN employee e ON m.emp_id = e.emp_id
                SET m.dept_no = :new_no
                WHERE e.dept_id = :dept_id
            """), {"new_no": row.dept_no, "dept_id": dept_id})
            db.execute(text("""
                UPDATE member m
                JOIN external x ON m.ext_id = x.ext_id
                SET m.dept_no = :new_no
                WHERE x.dept_id = :dept_id
            """), {"new_no": row.dept_no, "dept_id": dept_id})
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=409, detail="이미 존재하는 부서 코드 또는 부서명입니다.") from e

    db.refresh(row)
    return row

@router.delete("/departments/{dept_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(dept_id: int, db: Session = Depends(get_db)):
    row = db.get(Department, dept_id)
    if not row:
        raise HTTPException(status_code=404, detail="부서를 찾을 수 없습니다.")
    db.delete(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="연관 데이터가 있어 삭제할 수 없습니다.")
    return None

# ===== Roles =====
@router.get("/roles", response_model=list[RoleOut])
def list_roles(q: str = Query("", description="이름/코드 검색"), db: Session = Depends(get_db)):
    stmt = select(Role).order_by(Role.role_no.asc())
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(Role.role_name.like(like), Role.role_no.like(like)))
    return db.scalars(stmt).all()

@router.post("/roles", response_model=RoleOut, status_code=status.HTTP_201_CREATED)
def create_role(payload: RoleCreate, db: Session = Depends(get_db)):
    row = Role(role_name=payload.role_name.strip(), role_no=payload.role_no.strip())
    db.add(row)
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=409, detail="이미 존재하는 직급 코드 또는 직급명입니다.") from e
    db.refresh(row)
    return row

@router.patch("/roles/{role_id}", response_model=RoleOut)
def update_role(role_id: int, payload: RoleUpdate, db: Session = Depends(get_db)):
    row = db.get(Role, role_id)
    if not row:
        raise HTTPException(status_code=404, detail="직급을 찾을 수 없습니다.")

    old_no = row.role_no
    if payload.role_name is not None:
        row.role_name = payload.role_name.strip()
    if payload.role_no is not None:
        row.role_no = payload.role_no.strip()

    try:
        db.flush()
        if payload.role_no is not None and old_no != row.role_no:
            db.execute(text("UPDATE employee SET role_no=:new_no WHERE role_id=:role_id"),
                       {"new_no": row.role_no, "role_id": role_id})
            db.execute(text("UPDATE external SET role_no=:new_no WHERE role_id=:role_id"),
                       {"new_no": row.role_no, "role_id": role_id})
            db.execute(text("""
                UPDATE member m
                JOIN employee e ON m.emp_id = e.emp_id
                SET m.role_no = :new_no
                WHERE e.role_id = :role_id
            """), {"new_no": row.role_no, "role_id": role_id})
            db.execute(text("""
                UPDATE member m
                JOIN external x ON m.ext_id = x.ext_id
                SET m.role_no = :new_no
                WHERE x.role_id = :role_id
            """), {"new_no": row.role_no, "role_id": role_id})
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=409, detail="이미 존재하는 직급 코드 또는 직급명입니다.") from e

    db.refresh(row)
    return row

@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(role_id: int, db: Session = Depends(get_db)):
    row = db.get(Role, role_id)
    if not row:
        raise HTTPException(status_code=404, detail="직급을 찾을 수 없습니다.")
    db.delete(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="연관 데이터가 있어 삭제할 수 없습니다.")
    return None
