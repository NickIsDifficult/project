# app/routers/employee_router.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.core.auth import get_current_user
from app.core.exceptions import bad_request, conflict, not_found
from app.database import get_db

router = APIRouter(prefix="/employees", tags=["employees"])


# -------------------------------
# 전체 직원 목록 조회
# -------------------------------
@router.get("/", response_model=list[schemas.employee.Employee])
def read_employees(db: Session = Depends(get_db)):
    employees = db.query(models.Employee).all()
    if not employees:
        not_found("등록된 직원이 없습니다.")
    return employees


# -------------------------------
# 특정 직원 조회
# -------------------------------
@router.get("/{emp_id}", response_model=schemas.employee.Employee)
def read_employee(emp_id: int, db: Session = Depends(get_db)):
    employee = (
        db.query(models.Employee).filter(models.Employee.emp_id == emp_id).first()
    )
    if not employee:
        not_found(f"직원 ID {emp_id}를 찾을 수 없습니다.")
    return employee


# -------------------------------
# 직원 등록 (관리자 전용)
# -------------------------------
@router.post("/", response_model=schemas.employee.Employee)
def create_employee(
    request: schemas.employee.EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    # 예시: 관리자 권한 확인
    if current_user.user_type != "EMPLOYEE":
        bad_request("직원만 접근할 수 있습니다.")

    existing_email = (
        db.query(models.Employee).filter(models.Employee.email == request.email).first()
    )
    if existing_email:
        conflict("이미 존재하는 이메일입니다.")

    new_emp = models.Employee(**request.model_dump())
    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)
    return new_emp


# -------------------------------
# 직원 정보 수정
# -------------------------------
@router.put("/{emp_id}", response_model=schemas.employee.Employee)
def update_employee(
    emp_id: int, request: schemas.employee.EmployeeUpdate, db: Session = Depends(get_db)
):
    employee = (
        db.query(models.Employee).filter(models.Employee.emp_id == emp_id).first()
    )
    if not employee:
        not_found("직원 정보를 찾을 수 없습니다.")

    for key, value in request.model_dump(exclude_unset=True).items():
        setattr(employee, key, value)

    db.commit()
    db.refresh(employee)
    return employee


# -------------------------------
# 직원 삭제
# -------------------------------
@router.delete("/{emp_id}")
def delete_employee(emp_id: int, db: Session = Depends(get_db)):
    employee = (
        db.query(models.Employee).filter(models.Employee.emp_id == emp_id).first()
    )
    if not employee:
        not_found(f"ID {emp_id} 직원이 존재하지 않습니다.")
    db.delete(employee)
    db.commit()
    return {"success": True, "message": f"직원 {emp_id} 삭제 완료"}
