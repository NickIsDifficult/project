# app/routers/department_router.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.core.auth import get_current_user
from app.core.exceptions import bad_request, conflict, not_found
from app.database import get_db

router = APIRouter(prefix="/departments", tags=["departments"])


# -------------------------------
# 부서 목록 조회
# -------------------------------
@router.get("/", response_model=list[schemas.department.Department])
def read_departments(db: Session = Depends(get_db)):
    departments = db.query(models.Department).all()
    if not departments:
        not_found("등록된 부서가 없습니다.")
    return departments


# -------------------------------
# 부서 상세 조회
# -------------------------------
@router.get("/{dept_id}", response_model=schemas.department.Department)
def read_department(dept_id: int, db: Session = Depends(get_db)):
    department = (
        db.query(models.Department).filter(models.Department.dept_id == dept_id).first()
    )
    if not department:
        not_found(f"부서 ID {dept_id}를 찾을 수 없습니다.")
    return department


# -------------------------------
# 부서 등록 (관리자 전용)
# -------------------------------
@router.post("/", response_model=schemas.department.Department)
def create_department(
    request: schemas.department.DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    # 예시: 관리자 전용 접근 제한
    if current_user.user_type != "EMPLOYEE":
        bad_request("직원만 접근할 수 있습니다.")

    existing = (
        db.query(models.Department)
        .filter(models.Department.dept_name == request.dept_name)
        .first()
    )
    if existing:
        conflict("이미 존재하는 부서명입니다.")

    new_dept = models.Department(**request.model_dump())
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)
    return new_dept


# -------------------------------
# 부서 수정
# -------------------------------
@router.put("/{dept_id}", response_model=schemas.department.Department)
def update_department(
    dept_id: int,
    request: schemas.department.DepartmentBase,
    db: Session = Depends(get_db),
):
    department = (
        db.query(models.Department).filter(models.Department.dept_id == dept_id).first()
    )
    if not department:
        not_found("수정할 부서를 찾을 수 없습니다.")

    department.dept_name = request.dept_name
    db.commit()
    db.refresh(department)
    return department


# -------------------------------
# 부서 삭제
# -------------------------------
@router.delete("/{dept_id}")
def delete_department(dept_id: int, db: Session = Depends(get_db)):
    department = (
        db.query(models.Department).filter(models.Department.dept_id == dept_id).first()
    )
    if not department:
        not_found(f"부서 ID {dept_id}를 찾을 수 없습니다.")

    db.delete(department)
    db.commit()
    return {"success": True, "message": f"부서 {dept_id} 삭제 완료"}


# -------------------------------
# 권한(Role) 목록 조회
# -------------------------------
@router.get("/roles", response_model=list[schemas.department.Role])
def read_roles(db: Session = Depends(get_db)):
    roles = db.query(models.Role).all()
    if not roles:
        not_found("등록된 권한이 없습니다.")
    return roles


# -------------------------------
# 부서별 권한 조회
# -------------------------------
@router.get(
    "/{dept_id}/permissions",
    response_model=list[schemas.department.DepartmentPermission],
)
def read_department_permissions(dept_id: int, db: Session = Depends(get_db)):
    perms = (
        db.query(models.DepartmentPermission)
        .filter(models.DepartmentPermission.dept_id == dept_id)
        .all()
    )
    if not perms:
        not_found(f"부서 {dept_id}의 권한 설정을 찾을 수 없습니다.")
    return perms
