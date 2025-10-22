# backend/app/services/user_service.py
from typing import Tuple

from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.models.external import External
from app.models.member import Member, UserType
from app.utils.token import hash_password

INITIAL_PASSWORD = "0000"
EXTERNAL_DEPT_ID = 10  # 외부인 고정
EXTERNAL_ROLE_ID = 1  # 외부인 고정(권한)


def _next_code(db: Session, table: str, id_col: str, no_col: str, prefix: int) -> str:
    """
    dept_id(또는 10) + 4자리 시퀀스(0001부터) 형태의 문자열 생성.
    예) 11 + 0001 => '110001'
    """
    # MySQL에서 prefix로 시작하는 no의 맥스 4자리 suffix 구하기
    sql = text(
        f"""
        SELECT MAX(CAST(SUBSTRING({no_col}, LENGTH(:pfx)+1, 4) AS UNSIGNED)) AS max_seq
        FROM {table}
        WHERE {no_col} LIKE CONCAT(:pfx, '____')
    """
    )
    pfx = str(prefix)
    max_seq = db.execute(sql, {"pfx": pfx}).scalar() or 0
    next_seq = max_seq + 1
    return f"{pfx}{next_seq:04d}"


def create_employee_with_member(
    db: Session, *, dept_id: int, role_id: int, name: str, email: str, mobile: str
) -> Tuple[Employee, Member]:
    emp_no = _next_code(db, "employee", "emp_id", "emp_no", dept_id)
    employee = Employee(
        emp_no=emp_no,
        dept_id=dept_id,
        role_id=role_id,
        name=name,
        email=email,
        mobile=mobile,
    )
    db.add(employee)
    db.flush()  # emp_id 생성

    member = Member(
        login_id=emp_no,
        password_hash=hash_password(INITIAL_PASSWORD),
        emp_id=employee.emp_id,
        user_type=UserType.EMPLOYEE,
    )
    db.add(member)
    db.flush()
    return employee, member


def create_external_with_member(
    db: Session, *, name: str, email: str, mobile: str, company: str | None
) -> Tuple[External, Member]:
    ext_no = _next_code(db, "external", "ext_id", "ext_no", EXTERNAL_DEPT_ID)
    external = External(
        ext_no=ext_no,
        dept_id=EXTERNAL_DEPT_ID,
        role_id=EXTERNAL_ROLE_ID,
        name=name,
        email=email,
        mobile=mobile,
        company=company,
    )
    db.add(external)
    db.flush()  # ext_id 생성

    member = Member(
        login_id=ext_no,
        password_hash=hash_password(INITIAL_PASSWORD),
        ext_id=external.ext_id,
        user_type=UserType.EXTERNAL,
    )
    db.add(member)
    db.flush()
    return external, member
