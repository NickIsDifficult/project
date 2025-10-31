# app/services/notices_service.py
from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import func, null, or_, select
from sqlalchemy.orm import Session

from app.models.member import Member
from app.models.notices import Notice, NoticeReference

# Employee / External 모델은 프로젝트에 따라 없을 수도 있음 → 안전한 옵셔널 import
try:
    from app.models.employee import Employee  # type: ignore
except Exception:
    Employee = None  # type: ignore

try:
    from app.models.external import External  # type: ignore
except Exception:
    External = None  # type: ignore


# ======================================================
# 🔹 내부 유틸
# ======================================================


def _username_expr():
    """
    작성자명 동적 계산식:
    COALESCE(Employee.name, External.name, Member.login_id)
    """
    emp_name = Employee.name if Employee is not None else null()
    ext_name = External.name if External is not None else null()
    return func.coalesce(emp_name, ext_name, Member.login_id)


def _attach_author_joins(stmt):
    """작성자명 계산을 위한 JOIN 자동 추가"""
    stmt = stmt.join(Member, Member.member_id == Notice.author_id)
    if Employee is not None:
        stmt = stmt.join(Employee, Employee.emp_id == Member.emp_id, isouter=True)
    if External is not None:
        stmt = stmt.join(External, External.ext_id == Member.ext_id, isouter=True)
    return stmt


def _row_to_public(n: Notice, username: Optional[str]) -> Dict[str, Any]:
    """단일 공지 row를 프론트엔드에서 사용하는 구조로 변환"""
    return {
        "id": n.id,
        "title": n.title,
        "body": n.body,
        "scope": n.scope,
        "username": username,
        "created_at": n.created_at.isoformat(),
    }


# ======================================================
# ✅ 공지 CRUD
# ======================================================


def list_notices(db: Session) -> List[Dict[str, Any]]:
    """전체 공지 목록"""
    stmt = select(Notice, _username_expr().label("username")).order_by(Notice.created_at.desc())
    stmt = _attach_author_joins(stmt)
    rows = db.execute(stmt).all()
    return [_row_to_public(n, username=u) for n, u in rows]


def search_notices(db: Session, q: str) -> List[Dict[str, Any]]:
    """공지 검색 (제목, 내용, 작성자, 범위 포함)"""
    like = f"%{q}%"
    stmt = (
        select(Notice, _username_expr().label("username"))
        .where(
            or_(
                Notice.title.ilike(like),
                Notice.body.ilike(like),
                Notice.scope.ilike(like),
                _username_expr().ilike(like),
            )
        )
        .order_by(Notice.created_at.desc())
    )
    stmt = _attach_author_joins(stmt)
    rows = db.execute(stmt).all()
    return [_row_to_public(n, username=u) for n, u in rows]


def get_notice(db: Session, notice_id: int) -> Optional[Dict[str, Any]]:
    """단일 공지 상세 (작성자명 포함)"""
    stmt = select(Notice, _username_expr().label("username")).where(Notice.id == notice_id)
    stmt = _attach_author_joins(stmt)
    row = db.execute(stmt).first()
    if not row:
        return None
    n, username = row
    return _row_to_public(n, username=username)


def get_notice_raw(db: Session, notice_id: int) -> Optional[Notice]:
    """권한 체크용 원본 ORM 객체"""
    return db.get(Notice, notice_id)


def create_notice(
    db: Session, *, author_id: int, title: str, body: str, scope: str
) -> Dict[str, Any]:
    """공지 등록"""
    notice = Notice(
        title=title.strip(),
        body=body.strip(),
        scope=(scope or "GLOBAL").upper(),
        author_id=author_id,
    )
    db.add(notice)
    db.commit()
    db.refresh(notice)

    # 작성자명 계산
    sub = select(_username_expr()).select_from(Member)
    if Employee is not None:
        sub = sub.join(Employee, Employee.emp_id == Member.emp_id, isouter=True)
    if External is not None:
        sub = sub.join(External, External.ext_id == Member.ext_id, isouter=True)
    sub = sub.where(Member.member_id == author_id)

    username = db.execute(sub).scalar()
    return _row_to_public(notice, username=username)


def update_notice(
    db: Session, notice_id: int, *, title: Optional[str], body: Optional[str]
) -> bool:
    """공지 수정"""
    n = db.get(Notice, notice_id)
    if not n:
        return False

    if title is not None:
        n.title = title.strip()
    if body is not None:
        n.body = body.strip()

    db.add(n)
    db.commit()
    return True


def delete_notice(db: Session, notice_id: int) -> bool:
    """공지 삭제"""
    n = db.get(Notice, notice_id)
    if not n:
        return False
    db.delete(n)
    db.commit()
    return True


# ======================================================
# ✅ 참조 관리
# ======================================================


def list_references(db: Session, notice_id: int) -> List[Dict[str, Any]]:
    """공지 참조 목록"""
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
        ref_data: Dict[str, Any] = {
            "id": r.id,
            "ref_type": r.ref_type,
            "ref_id": r.ref_id,
            "ref_notice_id": r.ref_notice_id,
        }

        # 참조 대상이 공지인 경우 제목 가져오기
        target_notice_id = (
            r.ref_notice_id
            if r.ref_notice_id is not None
            else (r.ref_id if r.ref_type == "notice" else None)
        )

        if target_notice_id:
            target = db.get(Notice, target_notice_id)
            if target:
                ref_data["ref_notice_id"] = target_notice_id
                ref_data["ref_title"] = target.title

        result.append(ref_data)

    return result


def add_reference(
    db: Session,
    notice_id: int,
    *,
    ref_notice_id: Optional[int] = None,
    ref_type: Optional[str] = None,
    ref_id: Optional[int] = None,
) -> bool:
    """공지 참조 추가 (Generic + Notice ID 기반 모두 지원)"""
    try:
        # Case 1: ref_notice_id 직접 지정
        if ref_notice_id is not None:
            ref = NoticeReference(
                notice_id=notice_id,
                ref_type="notice",
                ref_id=int(ref_notice_id),
                ref_notice_id=int(ref_notice_id),
            )
        # Case 2: Generic 타입
        elif ref_type and ref_id is not None:
            ref = NoticeReference(
                notice_id=notice_id,
                ref_type=str(ref_type).lower(),
                ref_id=int(ref_id),
            )
            if ref.ref_type == "notice":
                ref.ref_notice_id = ref.ref_id
        else:
            return False

        db.add(ref)
        db.commit()
        return True

    except Exception as e:
        print(f"[❌ add_reference 실패] {e}")
        db.rollback()
        return False
