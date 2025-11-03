# app/routers/employee_router.py
from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models
from app.core.exceptions import bad_request, conflict, not_found
from app.database import get_db

# ✅ 명시적 import (Pylance 오류 방지)
from app.schemas.employee import Employee, EmployeeCreate, EmployeeUpdate
from app.utils.token import get_current_user

router = APIRouter(prefix="/employees", tags=["employees"])


# -------------------------------
# 현재 로그인한 직원 정보 조회
# -------------------------------
@router.get("/me", response_model=Employee)
def read_current_employee(
    db: Session = Depends(get_db),
    current_user: models.Member = Depends(get_current_user),
):
    if current_user.user_type != "EMPLOYEE":
        raise HTTPException(status_code=403, detail="직원만 접근 가능합니다.")

    employee = (
        db.query(models.Employee).filter(models.Employee.emp_id == current_user.emp_id).first()
    )

    if not employee:
        raise HTTPException(status_code=404, detail="직원 정보를 찾을 수 없습니다.")

    return employee


# -------------------------------
# 내 정보 수정 (이름/이메일/상태 등)
# -------------------------------
@router.put("/update-info/me", response_model=Employee)
def update_my_info(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """
    프론트 AppShell.handleSave()와 연결된 엔드포인트.
    기대 필드: name, email, current_state, (선택) password={current, next}
    """
    emp = db.query(models.Employee).filter(models.Employee.emp_id == current_user.emp_id).first()
    if not emp:
        not_found("직원 정보를 찾을 수 없습니다.")

    # 입력값 검증
    name = payload.get("name")
    email = payload.get("email")
    current_state = payload.get("current_state")

    if name is not None:
        if not isinstance(name, str) or not name.strip():
            bad_request("이름 형식이 올바르지 않습니다.")
        emp.name = name.strip()  # type: ignore[attr-defined]

    if email is not None:
        if not isinstance(email, str) or "@" not in email:
            bad_request("이메일 형식이 올바르지 않습니다.")
        emp.email = email.strip()  # type: ignore[attr-defined]

    if current_state is not None:
        emp.current_state = str(current_state).upper()  # type: ignore[attr-defined]

    # (선택) 비밀번호 변경 로직 — 나중에 필요 시 확장 가능
    # pwd = payload.get("password")
    # if pwd and isinstance(pwd, dict):
    #     current_pwd = pwd.get("current")
    #     next_pwd = pwd.get("next")
    #     ... (비밀번호 검증 및 해시 적용 로직)

    db.commit()
    db.refresh(emp)
    return emp


# -------------------------------
# 내 상태만 별도로 변경
# -------------------------------
@router.put("/update-status/me", response_model=Employee)
def update_my_status(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """
    기대 필드: current_state (WORKING | FIELD | AWAY | OFF)
    """
    new_state = payload.get("current_state")
    if not new_state:
        bad_request("current_state 값이 필요합니다.")

    new_state_upper = str(new_state).upper()
    if new_state_upper not in ("WORKING", "FIELD", "AWAY", "OFF"):
        bad_request("유효하지 않은 상태 값입니다. (WORKING, FIELD, AWAY, OFF 중 선택)")

    emp = db.query(models.Employee).filter(models.Employee.emp_id == current_user.emp_id).first()
    if not emp:
        not_found("직원 정보를 찾을 수 없습니다.")

    emp.current_state = new_state_upper  # type: ignore[attr-defined]
    db.commit()
    db.refresh(emp)
    return emp


# -------------------------------
# 전체 직원 목록 조회
# -------------------------------
@router.get("/", response_model=list[Employee])
def read_employees(db: Session = Depends(get_db)):
    employees = db.query(models.Employee).all()
    if not employees:
        not_found("등록된 직원이 없습니다.")
    return employees


# -------------------------------
# 특정 직원 조회
# -------------------------------
@router.get("/{emp_id}", response_model=Employee)
def read_employee(emp_id: int, db: Session = Depends(get_db)):
    employee = db.query(models.Employee).filter(models.Employee.emp_id == emp_id).first()
    if not employee:
        not_found(f"직원 ID {emp_id}를 찾을 수 없습니다.")
    return employee


# -------------------------------
# 직원 등록 (관리자 전용)
# -------------------------------
@router.post("/", response_model=Employee)
def create_employee(
    request: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """
    직원 계정 신규 등록 (관리자 전용)
    """
    # 권한 검증 (필요에 맞게 수정)
    if current_user.role_id != 99 and current_user.dept_id != 99:  # type: ignore[general-type-issues]
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="관리자만 등록할 수 있습니다."
        )

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
# 직원 정보 수정 (관리자용)
# -------------------------------
@router.put("/{emp_id}", response_model=Employee)
def update_employee(
    emp_id: int,
    request: EmployeeUpdate,
    db: Session = Depends(get_db),
):
    employee = db.query(models.Employee).filter(models.Employee.emp_id == emp_id).first()
    if not employee:
        not_found("직원 정보를 찾을 수 없습니다.")

    for key, value in request.model_dump(exclude_unset=True).items():
        setattr(employee, key, value)

    db.commit()
    db.refresh(employee)
    return employee


# -------------------------------
# 직원 삭제 (관리자 전용)
# -------------------------------
@router.delete("/{emp_id}")
def delete_employee(
    emp_id: int,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """
    직원 삭제 (관리자만 가능)
    """
    if current_user.role_id != 99 and current_user.dept_id != 99:  # type: ignore[general-type-issues]
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="관리자만 삭제할 수 있습니다."
        )

    employee = db.query(models.Employee).filter(models.Employee.emp_id == emp_id).first()
    if not employee:
        not_found(f"ID {emp_id} 직원이 존재하지 않습니다.")

    db.delete(employee)
    db.commit()
    return {"success": True, "message": f"직원 {emp_id} 삭제 완료"}
