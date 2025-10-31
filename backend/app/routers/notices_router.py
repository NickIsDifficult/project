# app/routers/notices_router.py
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.notices import (
    AddRefByNoticeIdIn,
    AddRefGenericIn,
    NoticeCreateIn,
    NoticeOut,
    NoticeRefOut,
    NoticeUpdateIn,
)
from app.services import notices_service as svc

# ------------------------------------------------------
# 🔐 로그인 사용자 주입 (utils/token.py 필요)
# ------------------------------------------------------
try:
    from app.utils.token import get_current_member
except Exception:

    def get_current_member():
        raise HTTPException(status_code=401, detail="인증 필요")


router = APIRouter(prefix="/notices", tags=["notices"])


# ------------------------------------------------------
# 🔹 관리자 판정 유틸
# ------------------------------------------------------
def _is_admin(me) -> bool:
    """관리자 판정: role_no == '99' 또는 user_type == 'ADMIN'"""
    role_no = getattr(me, "role_no", None) or (me.get("role_no") if isinstance(me, dict) else None)
    user_type = getattr(me, "user_type", None) or (
        me.get("user_type") if isinstance(me, dict) else None
    )
    return role_no == "99" or user_type == "ADMIN"


# ======================================================
# ✅ 공지 목록 조회
# ======================================================
@router.get("", response_model=list[NoticeOut], status_code=status.HTTP_200_OK)
def list_notices(db: Session = Depends(get_db)):
    """공지 전체 목록 조회"""
    return svc.list_notices(db)


# ======================================================
# ✅ 공지 검색
# ======================================================
@router.get("/search", response_model=list[NoticeOut], status_code=status.HTTP_200_OK)
def search_notices(
    q: str = Query(..., min_length=1, description="검색어 (제목, 본문, 작성자, 범위)"),
    db: Session = Depends(get_db),
):
    """공지 제목/본문/작성자 검색"""
    return svc.search_notices(db, q=q)


# ======================================================
# ✅ 공지 단건 조회
# ======================================================
@router.get("/{notice_id}", response_model=NoticeOut, status_code=status.HTTP_200_OK)
def get_notice(notice_id: int, db: Session = Depends(get_db)):
    """특정 공지 상세 조회"""
    item = svc.get_notice(db, notice_id)
    if not item:
        raise HTTPException(status_code=404, detail="존재하지 않는 공지입니다.")
    return item


# ======================================================
# ✅ 공지 등록
# ======================================================
@router.post("", response_model=NoticeOut, status_code=status.HTTP_201_CREATED)
def create_notice(
    payload: NoticeCreateIn,
    db: Session = Depends(get_db),
    me=Depends(get_current_member),
):
    """
    새 공지 작성
    - 작성자 ID는 me.member_id → me.id → me.login_id(보조 조회) 순으로 안전 추출
    """
    author_id = getattr(me, "member_id", None) or getattr(me, "id", None)
    if not author_id:
        login_id = getattr(me, "login_id", None) or (
            me.get("login_id") if isinstance(me, dict) else None
        )
        if login_id:
            from app import models

            m = db.query(models.Member).filter(models.Member.login_id == login_id).first()
            if m:
                author_id = getattr(m, "member_id", None)

    if not author_id:
        raise HTTPException(status_code=401, detail="작성자 식별 실패")

    return svc.create_notice(
        db,
        author_id=int(author_id),
        title=payload.title,
        body=payload.body,
        scope=payload.scope,
    )


# ======================================================
# ✅ 공지 수정
# ======================================================
@router.put("/{notice_id}", response_model=dict, status_code=status.HTTP_200_OK)
def update_notice(
    notice_id: int,
    payload: NoticeUpdateIn,
    db: Session = Depends(get_db),
    me=Depends(get_current_member),
):
    """공지 수정"""
    current = svc.get_notice(db, notice_id)
    if not current:
        raise HTTPException(status_code=404, detail="수정할 공지가 없습니다.")

    ok = svc.update_notice(db, notice_id, title=payload.title, body=payload.body)
    if not ok:
        raise HTTPException(status_code=400, detail="수정 실패")
    return {"ok": True}


# ======================================================
# ✅ 공지 삭제 (관리자 전용)
# ======================================================
@router.delete("/{notice_id}", response_model=dict, status_code=status.HTTP_200_OK)
def delete_notice(
    notice_id: int,
    db: Session = Depends(get_db),
    me=Depends(get_current_member),
):
    """관리자 전용 공지 삭제"""
    if not _is_admin(me):
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다 (관리자 전용).")

    current = svc.get_notice(db, notice_id)
    if not current:
        return {"ok": True}

    ok = svc.delete_notice(db, notice_id)
    if not ok:
        raise HTTPException(status_code=400, detail="삭제 실패")
    return {"ok": True}


# ======================================================
# ✅ 참조 목록 조회
# ======================================================
@router.get(
    "/{notice_id}/references",
    response_model=list[NoticeRefOut],
    status_code=status.HTTP_200_OK,
)
def list_references(
    notice_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_member),
):
    """공지 참조 목록 조회"""
    return svc.list_references(db, notice_id)


# ======================================================
# ✅ 참조 추가
# ======================================================
@router.post(
    "/{notice_id}/references",
    response_model=dict,
    status_code=status.HTTP_200_OK,
)
def add_reference(
    notice_id: int,
    ref_notice: Optional[AddRefByNoticeIdIn] = None,
    ref_generic: Optional[AddRefGenericIn] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_member),
):
    """
    공지 참조 추가 (두 포맷 모두 지원)
    - AddRefByNoticeIdIn: {"ref_notice_id": 1}
    - AddRefGenericIn: {"ref_type": "event", "ref_id": 10}
    """
    ref_notice_id = None
    ref_type = None
    ref_id = None

    if ref_notice and ref_notice.ref_notice_id:
        ref_notice_id = ref_notice.ref_notice_id
    elif ref_generic and ref_generic.ref_type and ref_generic.ref_id:
        ref_type = ref_generic.ref_type
        ref_id = ref_generic.ref_id
    else:
        raise HTTPException(status_code=400, detail="잘못된 요청 형식입니다.")

    ok = svc.add_reference(
        db,
        notice_id,
        ref_notice_id=ref_notice_id,
        ref_type=ref_type,
        ref_id=ref_id,
    )
    if not ok:
        raise HTTPException(status_code=400, detail="참조 추가 실패")
    return {"ok": True}
