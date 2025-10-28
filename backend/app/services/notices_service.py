# app/services/notices_service.py
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy import select, or_, func, null
from sqlalchemy.orm import Session

from app.models.notices import Notice, NoticeReference
from app.models.member import Member

# Employee/External 이 없는 프로젝트에서도 동작하도록 "옵셔널 임포트"
try:
    from app.models.employee import Employee  # 사원 테이블: (emp_id, name ...)
except Exception:
    Employee = None  # type: ignore

try:
    from app.models.external import External  # 외부 사용자 테이블: (ext_id, name ...)
except Exception:
    External = None  # type: ignore


def _row_to_public(n: Notice, username: Optional[str]) -> Dict[str, Any]:
    return {
        "id": n.id,
        "title": n.title,
        "body": n.body,
        "scope": n.scope,
        "username": username,
        "created_at": n.created_at.isoformat(),
    }


def _username_expr():
    """
    COALESCE(Employee.name, External.name, Member.login_id)
    - Employee/External 모델이 없으면 NULL로 대체하여 COALESCE에서 자동 스킵
    """
    emp_name = Employee.name if Employee is not None else null()
    ext_name = External.name if External is not None else null()
    return func.coalesce(emp_name, ext_name, Member.login_id)


def _attach_author_joins(stmt):
    """
    작성자명 계산을 위해 필요한 JOIN을 동적으로 추가.
    Employee/External 모델이 없으면 해당 조인은 생략.
    """
    stmt = stmt.join(Member, Member.member_id == Notice.author_id)

    if Employee is not None:
        stmt = stmt.join(Employee, Employee.emp_id == Member.emp_id, isouter=True)
    if External is not None:
        stmt = stmt.join(External, External.ext_id == Member.ext_id, isouter=True)

    return stmt


def list_notices(db: Session) -> List[Dict[str, Any]]:
    stmt = select(Notice, _username_expr().label("username")).order_by(Notice.created_at.desc())
    stmt = _attach_author_joins(stmt)
    rows: List[Tuple[Notice, Optional[str]]] = db.execute(stmt).all()
    return [_row_to_public(n, username=u) for (n, u) in rows]


def search_notices(db: Session, q: str) -> List[Dict[str, Any]]:
    like = f"%{q}%"
    stmt = (
        select(Notice, _username_expr().label("username"))
        .where(
            or_(
                Notice.title.ilike(like),
                Notice.body.ilike(like),
                Notice.scope.ilike(like),
                _username_expr().ilike(like),  # 작성자 이름으로도 검색
            )
        )
        .order_by(Notice.created_at.desc())
    )
    stmt = _attach_author_joins(stmt)
    rows: List[Tuple[Notice, Optional[str]]] = db.execute(stmt).all()
    return [_row_to_public(n, username=u) for (n, u) in rows]


def get_notice(db: Session, notice_id: int) -> Optional[Dict[str, Any]]:
    stmt = select(Notice, _username_expr().label("username")).where(Notice.id == notice_id)
    stmt = _attach_author_joins(stmt)
    row = db.execute(stmt).first()
    if not row:
        return None
    n, username = row
    return _row_to_public(n, username=username)


def create_notice(db: Session, *, author_id: int, title: str, body: str, scope: str) -> Dict[str, Any]:
    n = Notice(title=title.strip(), body=body, scope=(scope or "GLOBAL").upper(), author_id=author_id)
    db.add(n)
    db.commit()
    db.refresh(n)

    # 단건 username 계산
    sub = select(_username_expr()).select_from(Member)
    if Employee is not None:
        sub = sub.join(Employee, Employee.emp_id == Member.emp_id, isouter=True)
    if External is not None:
        sub = sub.join(External, External.ext_id == Member.ext_id, isouter=True)
    sub = sub.where(Member.member_id == author_id)

    username = db.execute(sub).scalar()
    return _row_to_public(n, username=username)


def update_notice(db: Session, notice_id: int, *, title: Optional[str], body: Optional[str]) -> bool:
    n = db.get(Notice, notice_id)
    if not n:
        return False

    if title is not None:
        n.title = title.strip()
    if body is not None:
        n.body = body

    db.add(n)
    db.commit()
    return True


def delete_notice(db: Session, notice_id: int) -> bool:
    n = db.get(Notice, notice_id)
    if not n:
        return False
    db.delete(n)
    db.commit()
    return True


# ---------- References ----------
def list_references(db: Session, notice_id: int) -> List[Dict[str, Any]]:
    rows = (
        db.execute(
            select(NoticeReference)
            .where(NoticeReference.notice_id == notice_id)
            .order_by(NoticeReference.id.desc())
        )
        .scalars()
        .all()
    )

    result: List[Dict[str, Any]] = []
    for r in rows:
        item = {
            "id": r.id,
            "ref_type": r.ref_type,
            "ref_id": r.ref_id,
            "ref_notice_id": r.ref_notice_id,
        }

        target_notice_id = (
            r.ref_notice_id
            if r.ref_notice_id is not None
            else (r.ref_id if r.ref_type == "notice" else None)
        )

        if target_notice_id:
            n2 = db.get(Notice, target_notice_id)
            if n2:
                item["ref_notice_id"] = target_notice_id
                item["ref_title"] = n2.title

        result.append(item)

    return result


def add_reference(
    db: Session,
    notice_id: int,
    *,
    ref_notice_id: Optional[int] = None,
    ref_type: Optional[str] = None,
    ref_id: Optional[int] = None,
) -> bool:
    # 두 포맷을 모두 수용
    if ref_notice_id is not None:
        ref = NoticeReference(
            notice_id=notice_id,
            ref_notice_id=int(ref_notice_id),
            ref_type="notice",
            ref_id=int(ref_notice_id),
        )
    else:
        if not ref_type or ref_id is None:
            return False
        ref = NoticeReference(
            notice_id=notice_id,
            ref_type=str(ref_type),
            ref_id=int(ref_id),
        )
        if ref.ref_type == "notice":
            ref.ref_notice_id = ref.ref_id

    db.add(ref)
    try:
        db.commit()
    except Exception:
        db.rollback()
        return False
    return True
