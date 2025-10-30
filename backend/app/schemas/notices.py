# app/schemas/notices.py
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# ===============================
# ✅ 기본 Notice 입력/수정 스키마
# ===============================
class NoticeBase(BaseModel):
    title: str = Field(..., max_length=200)
    body: str
    scope: str = Field(default="GLOBAL", max_length=20)


class NoticeCreateIn(NoticeBase):
    """공지 생성 요청"""
    pass


class NoticeUpdateIn(BaseModel):
    """공지 수정 요청"""
    title: Optional[str] = Field(None, max_length=200)
    body: Optional[str] = None


# ===============================
# ✅ Notice 출력 (응답용)
# ===============================
class NoticeOut(BaseModel):
    """공지 조회 응답"""
    id: int
    title: str
    body: str
    scope: str
    username: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True


# ===============================
# ✅ Reference 관련 스키마
# ===============================
class AddRefByNoticeIdIn(BaseModel):
    """공지 상세 화면용 참조 추가"""
    ref_notice_id: int


class AddRefGenericIn(BaseModel):
    """공지 참조 목록(NoticeReferences) 컴포넌트용"""
    ref_type: str
    ref_id: int


class NoticeRefOut(BaseModel):
    """참조 리스트 조회 응답"""
    id: int
    ref_type: Optional[str] = None
    ref_id: Optional[int] = None
    ref_notice_id: Optional[int] = None
    ref_title: Optional[str] = None

    class Config:
        orm_mode = True


# ===============================
# ✅ List 응답 스키마 (배열 형태)
# ===============================
class NoticeListOut(BaseModel):
    items: List[NoticeOut]


class NoticeRefListOut(BaseModel):
    items: List[NoticeRefOut]
