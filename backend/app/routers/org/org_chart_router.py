# backend/app/routers/org/org_chart_router.py
from typing import Optional, List, Dict, Any
# from decimal import Decimal, InvalidOperation   # ⛔ 사용 안함: 소수/문자 정렬 제거

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.department import Department
from app.models.employee import Employee
from app.models.role import Role

router = APIRouter(prefix="/org-chart", tags=["org-chart"])

# ▼▼▼ [변경] 숫자 변환만 허용 (정수)
def _to_int(val: Optional[str]) -> Optional[int]:
    try:
        return int(str(val).strip())
    except (TypeError, ValueError):
        return None

def _is_admin_role(role_no: Optional[str]) -> bool:
    """role_no >= 90 → 조직도에서 제외"""
    return _to_int(role_no) >= 90

def _role_sort_key(role_no: Optional[str]):
    """
    정렬: 숫자만 사용, 값이 클수록 상위 → 내림차순 정렬에 사용.
    숫자로 변환 불가(None)는 가장 아래 취급.
    """
    n = _to_int(role_no)
    # 숫자 그룹 먼저(0), 숫자 아님은 뒤(1). 내림차순(reverse=True)로 정렬할 것.
    return (0, n) if n is not None else (1, -10**9)
# ▲▲▲ [변경 끝]

@router.get("", summary="부서별 조직도 집계")
def get_org_chart(
    dept_no: Optional[str] = Query(default=None, description="부서 번호(우선 사용)"),
    dept_id: Optional[int] = Query(default=None, description="부서 ID(대안)"),
    db: Session = Depends(get_db),
):
    if not dept_no and not dept_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="dept_no 또는 dept_id가 필요합니다.")

    # 부서 식별
    dept: Optional[Department] = None
    if dept_no:
        dept = db.query(Department).filter(Department.dept_no == dept_no).first()
    elif dept_id:
        dept = db.query(Department).filter(Department.dept_id == dept_id).first()

    if not dept:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="부서를 찾을 수 없습니다.")

    emps: List[Employee] = (
        db.query(Employee)
        .filter(Employee.dept_id == dept.dept_id)
        .all()
    )

    # ▼▼▼ [변경] 관리자(99) 직원 제외
    emps = [e for e in emps if not _is_admin_role(e.role_no)]
    # ▲▲▲

    if not emps:
        return {
            "department": {
                "dept_id": dept.dept_id,
                "dept_no": dept.dept_no,
                "dept_name": dept.dept_name,
            },
            "roles": [],
            "employees": [],
        }

    role_ids = {e.role_id for e in emps if e.role_id is not None}
    roles: List[Role] = []
    role_map: Dict[int, Role] = {}
    if role_ids:
        roles = db.query(Role).filter(Role.role_id.in_(role_ids)).all()
        role_map = {r.role_id: r for r in roles}

    # ▼▼▼ [변경] 관리자(99) 역할 제외
    roles = [r for r in roles if not _is_admin_role(r.role_no)]
    # ▲▲▲

    # 숫자 내림차순: 큰 값이 위
    sorted_roles = sorted(roles, key=lambda r: _role_sort_key(r.role_no), reverse=True)

    employees_payload: List[Dict[str, Any]] = []
    for e in emps:
        r = role_map.get(e.role_id)
        employees_payload.append({
            "emp_id": e.emp_id,
            "name": e.name,
            "email": e.email,
            "dept_id": e.dept_id,
            "dept_no": e.dept_no,
            "role_id": e.role_id,
            "role_no": e.role_no,
            "role_name": getattr(r, "role_name", None),
            "responsibility_text": (e.responsibility_text or ""),
            "current_state": e.current_state
        })

    return {
        "department": {
            "dept_id": dept.dept_id,
            "dept_no": dept.dept_no,
            "dept_name": dept.dept_name,
        },
        "roles": [
            {"role_id": r.role_id, "role_no": r.role_no, "role_name": r.role_name}
            for r in sorted_roles
        ],
        "employees": employees_payload,
    }
