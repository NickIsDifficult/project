# backend/app/routers/admin/account.py
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import text, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.database import get_db
from app.models.member import Member
from app.models.employee import Employee
from app.models.external import External
from app.models.department import Department
from app.models.role import Role

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
router = APIRouter(prefix="/admin/account", tags=["admin-account"])

# ---------------------------
# Schemas (이 파일 안에서만 사용)
# ---------------------------
class AccountListItem(BaseModel):
    member_id: int
    user_type: str
    login_id: str
    name: str | None = None
    dept_id: int | None = None
    role_id: int | None = None
    email: str | None = None
    mobile: str | None = None
    company: str | None = None
    dept_no: str | None = None    
    role_no: str | None = None 
    dept_name: str | None = None    
    role_name: str | None = None    
    emp_id: int | None = None
    ext_id: int | None = None
    created_at: str | None = None
    updated_at: str | None = None
    last_login_at: str | None = None
    birthday: str | None = None        # 'YYYY-MM-DD'
    hire_date: str | None = None       # 'YYYY-MM-DD'
    failed_attempts: int | None = None
    locked_until: str | None = None

class AccountListResponse(BaseModel):
    items: list[AccountListItem]
    page: int
    size: int
    total: int

class UpdateAccountPayload(BaseModel):
    # 읽기 전용: member_id, created_at, last_login_at, login_id
    name: str | None = None
    email: EmailStr | None = None
    mobile: str | None = None
    dept_id: int | None = None
    role_id: int | None = None
    dept_no: str | None = None
    role_no: str | None = None
    company: str | None = None
    birthday: str | None = None 
    hire_date: str | None = None

class PasswordChangeRequest(BaseModel):
    new_password: str

# ---------------------------
# 1) 목록
# ---------------------------
@router.get("", response_model=AccountListResponse)
def list_accounts(
    q: str = Query("", description="이름/이메일/로그인ID/사번(사외번호)/dept_no/role_no 검색"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    q = (q or "").strip()
    like = f"%{q}%" if q else None

    # NOTE: MySQL UNION ALL + LIMIT/OFFSET
    emp_sql = """
      SELECT
        m.member_id, m.user_type, m.login_id,
        e.name, e.email, e.mobile,
        NULL AS company,        
        d.dept_no, d.dept_name,
        r.role_no, r.role_name,
        e.emp_id AS emp_id, NULL AS ext_id
      FROM member m
      JOIN employee e ON m.emp_id = e.emp_id
      LEFT JOIN department d ON e.dept_id = d.dept_id
      LEFT JOIN role r ON e.role_id = r.role_id
      WHERE m.user_type = 'EMPLOYEE'
    """
    ext_sql = """
      SELECT
        m.member_id, m.user_type, m.login_id,
        x.name, x.email, x.mobile,
        x.company,
        d.dept_no, d.dept_name,
        r.role_no, r.role_name,
        NULL AS emp_id, x.ext_id AS ext_id
      FROM member m
      JOIN external x ON m.ext_id = x.ext_id
      LEFT JOIN department d ON x.dept_id = d.dept_id
      LEFT JOIN role r ON x.role_id = r.role_id
      WHERE m.user_type = 'EXTERNAL'
    """

    # 검색 조건
    if like:
        cond = """
          AND (
            m.login_id LIKE :like OR
            e.name LIKE :like OR e.email LIKE :like OR e.mobile LIKE :like OR
            d.dept_no LIKE :like OR r.role_no LIKE :like OR
            e.emp_no LIKE :like
          )
        """
        emp_sql += cond
        cond2 = """
          AND (
            m.login_id LIKE :like OR
            x.name LIKE :like OR x.email LIKE :like OR x.mobile LIKE :like OR
            d.dept_no LIKE :like OR r.role_no LIKE :like OR
            x.ext_no LIKE :like
          )
        """
        ext_sql += cond2

    union_sql = f"""
      ({emp_sql})
      UNION ALL
      ({ext_sql})
    """
    count_sql = f"SELECT COUNT(*) AS cnt FROM ({union_sql}) AS u"
    list_sql = f"""
      {union_sql}
      LIMIT :limit OFFSET :offset
    """

    params = {}
    if like:
        params["like"] = like
    params["limit"] = size
    params["offset"] = (page - 1) * size

    total = db.execute(text(count_sql), params).mappings().one()["cnt"]
    rows = db.execute(text(list_sql), params).mappings().all()

    items = [AccountListItem(**dict(row)) for row in rows]
    return AccountListResponse(items=items, page=page, size=size, total=total)

# ---------------------------
# 2) 상세
# ---------------------------
@router.get("/{user_type}/{member_id}", response_model=AccountListItem)
def get_account_detail(
    user_type: str, member_id: int, db: Session = Depends(get_db)
):
    user_type = user_type.upper()
    if user_type not in ("EMPLOYEE", "EXTERNAL"):
        raise HTTPException(status_code=400, detail="user_type must be EMPLOYEE or EXTERNAL")

    if user_type == "EMPLOYEE":
        sql = """
        SELECT
            m.member_id, m.user_type, m.login_id,
            e.name, e.email, e.mobile,
            NULL AS company,
            e.dept_id AS dept_id,
            d.dept_no, d.dept_name,
            e.role_id AS role_id,
            d.dept_no, r.role_no,
            e.emp_id AS emp_id, NULL AS ext_id,
            DATE_FORMAT(e.birthday, '%Y-%m-%d')               AS birthday,
            DATE_FORMAT(e.hire_date, '%Y-%m-%d')              AS hire_date,
            DATE_FORMAT(m.last_login_at, '%Y-%m-%dT%H:%i:%s') AS last_login_at,
            m.failed_attempts                                 AS failed_attempts,
            DATE_FORMAT(m.locked_until, '%Y-%m-%dT%H:%i:%s')  AS locked_until,
            DATE_FORMAT(e.created_at, '%Y-%m-%dT%H:%i:%s')    AS created_at,
            DATE_FORMAT(e.updated_at, '%Y-%m-%dT%H:%i:%s')    AS updated_at
          FROM member m
          JOIN employee e ON m.emp_id = e.emp_id
        LEFT JOIN department d ON e.dept_id = d.dept_id
        LEFT JOIN role r ON e.role_id = r.role_id
        WHERE m.member_id = :mid AND m.user_type = 'EMPLOYEE'
        """
    else:
        sql = """
        SELECT
            m.member_id, m.user_type, m.login_id,
            x.name, x.email, x.mobile,
            x.company,
            x.dept_id AS dept_id,
            d.dept_no, d.dept_name,
            x.role_id AS role_id,
            d.dept_no, r.role_no,
            NULL AS emp_id, x.ext_id AS ext_id,
            NULL AS birthday,
            NULL AS hire_date,
            DATE_FORMAT(m.last_login_at, '%Y-%m-%dT%H:%i:%s') AS last_login_at,
            m.failed_attempts                                 AS failed_attempts,
            DATE_FORMAT(m.locked_until, '%Y-%m-%dT%H:%i:%s')  AS locked_until,
            DATE_FORMAT(x.created_at, '%Y-%m-%dT%H:%i:%s')    AS created_at,
            DATE_FORMAT(x.updated_at, '%Y-%m-%dT%H:%i:%s')    AS updated_at
        FROM member m
        JOIN external x ON m.ext_id = x.ext_id
        LEFT JOIN department d ON x.dept_id = d.dept_id
        LEFT JOIN role r ON x.role_id = r.role_id
        WHERE m.member_id = :mid AND m.user_type = 'EXTERNAL'
        """
    row = db.execute(text(sql), {"mid": member_id}).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Account not found")
    return AccountListItem(**dict(row))

# ---------------------------
# 3) 수정
# ---------------------------
@router.put("/{user_type}/{member_id}", response_model=AccountListItem)
def update_account(
    user_type: str,
    member_id: int,
    payload: UpdateAccountPayload,
    db: Session = Depends(get_db),
):
    user_type = user_type.upper()
    if user_type not in ("EMPLOYEE", "EXTERNAL"):
        raise HTTPException(status_code=400, detail="user_type must be EMPLOYEE or EXTERNAL")

    # 현재 상태 로드 (ORM로 안전하게 가져옴)
    m: Member | None = db.get(Member, member_id)
    if not m or m.user_type != user_type:
        raise HTTPException(status_code=404, detail="Account not found")

    # 대상 엔티티 + 현재 dept/role
    if user_type == "EMPLOYEE":
        if m.emp_id is None:
            raise HTTPException(status_code=409, detail="Broken link: member.emp_id is NULL")
        ent: Employee | None = db.get(Employee, m.emp_id)
    else:
        if m.ext_id is None:
            raise HTTPException(status_code=409, detail="Broken link: member.ext_id is NULL")
        ent: External | None = db.get(External, m.ext_id)

    if not ent:
        raise HTTPException(status_code=404, detail="Linked entity not found")

    # 변경할 dept/role 유효성
    dept_obj = None
    role_obj = None
    if payload.dept_id is not None:
        dept_obj = db.get(Department, payload.dept_id)
        if not dept_obj:
            raise HTTPException(status_code=400, detail="Invalid dept_id")
    if payload.role_id is not None:
        role_obj = db.get(Role, payload.role_id)
        if not role_obj:
            raise HTTPException(status_code=400, detail="Invalid role_id")

    # 엔티티 필드 업데이트
    if payload.name is not None:
        ent.name = payload.name
    if payload.email is not None:
        ent.email = payload.email
    if payload.mobile is not None:
        ent.mobile = payload.mobile
    if user_type == "EXTERNAL" and payload.company is not None:
        ent.company = payload.company
    if payload.dept_id is not None:
        ent.dept_id = payload.dept_id
        if hasattr(ent, "dept_no"):   ent.dept_no   = dept_obj.dept_no
    if payload.role_id is not None:
        ent.role_id = payload.role_id
        if hasattr(ent, "role_no"):    ent.role_no   = role_obj.role_no
    if payload.birthday is not None:
        ent.birthday = payload.birthday
    if payload.hire_date is not None:
        ent.hire_date  = payload.hire_date
        

    try:
        db.flush()  # unique 제약(이메일/모바일) 위반을 빨리 포착
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email/Mobile duplicated")

    # dept_no/role_no를 member에도 반영(일관성)
    # (dept_id/role_id가 None이면 기존 그대로 유지)
    if payload.dept_id is not None:
        m.dept_no = dept_obj.dept_no if dept_obj else None
        
    if payload.role_id is not None:
        m.role_no = role_obj.role_no if role_obj else None
        

    try:
        db.commit()
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="DB commit failed")

    # 수정 후 상세 재조회해서 반환
    return get_account_detail(user_type=user_type, member_id=member_id, db=db)

@router.put("/{user_type}/{member_id}/password")
def admin_change_password(user_type: str, member_id: int, payload: PasswordChangeRequest, db: Session = Depends(get_db)):
    user_type = user_type.upper()
    if user_type not in ("EMPLOYEE", "EXTERNAL"):
        raise HTTPException(status_code=400, detail="user_type must be EMPLOYEE or EXTERNAL")

    member = db.get(Member, member_id)
    if not member or member.user_type != user_type:
        raise HTTPException(status_code=404, detail="Account not found")

    # 새 비밀번호 해싱
    hashed = pwd_context.hash(payload.new_password)
    member.password_hash = hashed

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Password update failed: {str(e)}")

    return {"message": "Password updated successfully"}