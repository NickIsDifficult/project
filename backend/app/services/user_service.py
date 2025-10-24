# backend/app/services/user_service.py
from typing import Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, text
from app.models.employee import Employee
from app.models.external import External
from app.models.department import Department
from app.models.role import Role
from app.models.member import Member, UserType
from app.utils.token import hash_password, verify_password

from fastapi import HTTPException, status

INITIAL_PASSWORD = "0000"
EXTERNAL_DEPT_NO = "10"  # 외부인 고정 코드
EXTERNAL_ROLE_NO = "1"   # 외부인 고정 권한 코드

def _next_code(db: Session, table: str, no_col: str, prefix: str) -> str:
    """
    dept_no(또는 '10') + 4자리 시퀀스(0001부터) 형태로 번호 생성.
    """
    sql = text(f"""
        SELECT MAX(CAST(SUBSTRING({no_col}, LENGTH(:pfx)+1, 4) AS UNSIGNED)) AS max_seq
        FROM {table}
        WHERE {no_col} LIKE CONCAT(:pfx, '____')
    """)
    pfx = str(prefix)
    max_seq = db.execute(sql, {"pfx": pfx}).scalar() or 0
    next_seq = max_seq + 1
    return f"{pfx}{next_seq:04d}"

def _resolve_ids_by_codes(db: Session, *, dept_no: str, role_no: str) -> tuple[int, int]:
    dept = db.scalar(select(Department).where(Department.dept_no == dept_no))
    if not dept:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="유효하지 않은 부서 코드(dept_no)입니다.")
    role = db.scalar(select(Role).where(Role.role_no == role_no))
    if not role:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="유효하지 않은 직책 코드(role_no)입니다.")
    return dept.dept_id, role.role_id

def create_employee_with_member(
    db: Session, *, dept_no: str, role_no: str, name: str, email: str, mobile: str
) -> Tuple[Employee, Member]:
    dept_id, role_id = _resolve_ids_by_codes(db, dept_no=dept_no, role_no=role_no)
    emp_no = _next_code(db, "employee", "emp_no", dept_no)
    employee = Employee(
        emp_no=emp_no,
        dept_id=dept_id, role_id=role_id,
        dept_no=dept_no, role_no=role_no,
        name=name, email=email, mobile=mobile,
    )
    db.add(employee)
    db.flush()  # emp_id 생성

    member = Member(
        login_id=emp_no,
        password_hash=hash_password(INITIAL_PASSWORD),
        emp_id=employee.emp_id,
        user_type=UserType.EMPLOYEE,
        dept_no=dept_no,
        role_no=role_no,
    )
    db.add(member)
    db.flush()
    return employee, member

def create_external_with_member(
    db: Session, *, name: str, email: str, mobile: str, company: str | None
) -> Tuple[External, Member]:
    ext_no = _next_code(db, "external", "ext_no", EXTERNAL_DEPT_NO)
    dept_id, role_id = _resolve_ids_by_codes(db, dept_no=EXTERNAL_DEPT_NO, role_no=EXTERNAL_ROLE_NO)
    external = External(
        ext_no=ext_no,
        dept_id=dept_id, role_id=role_id,
        dept_no=EXTERNAL_DEPT_NO, role_no=EXTERNAL_ROLE_NO,
        name=name, email=email, mobile=mobile, company=company,
    )
    db.add(external)
    db.flush()  # ext_id 생성

    member = Member(
        login_id=ext_no,
        password_hash=hash_password(INITIAL_PASSWORD),
        ext_id=external.ext_id,
        user_type=UserType.EXTERNAL,
        dept_no=EXTERNAL_DEPT_NO,
        role_no=EXTERNAL_ROLE_NO,
    )
    db.add(member)
    db.flush()
    return external, member


def _utype_to_str(ut) -> str:
    return ut.value if hasattr(ut, "value") else str(ut)

def get_my_profile_aggregated(db: Session, me: Member) -> dict:
    """
    현재 로그인 사용자(me)의 이름/이메일을 user_type에 따라
    employee 또는 external에서 읽어옵니다.
    """
    utype = _utype_to_str(me.user_type)

    if utype == "EMPLOYEE":
        if not me.emp_id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="EMPLOYEE인데 emp_id가 없습니다.")
        emp = db.get(Employee, me.emp_id)
        if not emp:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="해당 사원(emp_id)을 찾을 수 없습니다.")
        return {
            "member_id": me.member_id,
            "name": getattr(emp, "name", None),
            "email": getattr(emp, "email", None),
            "user_type": utype,
        }

    if utype == "EXTERNAL":
        if not me.ext_id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="EXTERNAL인데 ext_id가 없습니다.")
        ext = db.get(External, me.ext_id)
        if not ext:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="해당 외부인(ext_id)을 찾을 수 없습니다.")
        return {
            "member_id": me.member_id,
            "name": getattr(ext, "name", None),
            "email": getattr(ext, "email", None),
            "user_type": utype,
        }

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"지원하지 않는 user_type: {utype}")

def update_my_profile_xref(db: Session, me: Member, *, name=None, email=None) -> dict:
    """
    현재 로그인 사용자(me)의 이름/이메일을 user_type에 따라
    employee 또는 external에 '부분 수정'합니다.
    - 식별자(member_id/emp_id/ext_id)는 바디로 받지 않고 '토큰 주체(me)'만 사용
    """
    utype = _utype_to_str(me.user_type)

    if utype == "EMPLOYEE":
        if not me.emp_id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="EMPLOYEE인데 emp_id가 없습니다.")
        emp = db.get(Employee, me.emp_id)
        if not emp:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="해당 사원(emp_id)을 찾을 수 없습니다.")
        changed = False
        if name is not None and hasattr(emp, "name"):
            emp.name = name
            changed = True
        if email is not None and hasattr(emp, "email"):
            emp.email = email
            changed = True
        if changed:
            db.add(emp)
            db.commit()
        return get_my_profile_aggregated(db, me)

    if utype == "EXTERNAL":
        if not me.ext_id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="EXTERNAL인데 ext_id가 없습니다.")
        ext = db.get(External, me.ext_id)
        if not ext:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="해당 외부인(ext_id)을 찾을 수 없습니다.")
        changed = False
        if name is not None and hasattr(ext, "name"):
            ext.name = name
            changed = True
        if email is not None and hasattr(ext, "email"):
            ext.email = email
            changed = True
        if changed:
            db.add(ext)
            db.commit()
        return get_my_profile_aggregated(db, me)

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"지원하지 않는 user_type: {utype}")

def change_my_password(db: Session, me: Member, current: str, new: str) -> Tuple[bool, str]:
    """
    member.password_hash만 갱신한다.
    - 현재 비밀번호 불일치: False, 메시지
    - 새 비밀번호가 기존과 동일: False, 메시지
    - 성공: True, "OK"
    """
    # 현재 비밀번호 검증
    if not verify_password(current, me.password_hash or ""):
        return False, "현재 비밀번호가 일치하지 않습니다."

    # 새 비밀번호가 기존과 동일한지 방어
    if verify_password(new, me.password_hash or ""):
        return False, "새 비밀번호는 현재 비밀번호와 달라야 합니다."

    # 해시 저장
    me.password_hash = hash_password(new)
    db.add(me)
    db.commit()
    return True, "OK"
