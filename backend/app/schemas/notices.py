# app/schemas/notices.py
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ======================================================
# 🧩 Base Notice Schemas
# ======================================================
class NoticeBase(BaseModel):
    """공통 Notice 기본 필드"""

    title: str = Field(..., max_length=200, description="공지 제목")
    body: str = Field(..., description="공지 본문 내용")
    scope: str = Field(
        default="GLOBAL", max_length=20, description="공지 범위 (GLOBAL/TEAM/PROJECT)"
    )


class NoticeCreateIn(NoticeBase):
    """공지 생성 요청"""

    pass


class NoticeUpdateIn(BaseModel):
    """공지 수정 요청"""

    title: Optional[str] = Field(None, max_length=200, description="변경할 제목")
    body: Optional[str] = Field(None, description="변경할 본문")


# ======================================================
# 🧩 Notice Output Schemas
# ======================================================
class NoticeOut(BaseModel):
    """공지 조회/응답용"""

    id: int
    title: str
    body: str
    scope: str
    username: Optional[str] = Field(None, description="작성자 이름 또는 로그인 ID")
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ======================================================
# 🧩 Reference (참조) Schemas
# ======================================================
class AddRefByNoticeIdIn(BaseModel):
    """공지 상세 화면용 참조 추가"""

    ref_notice_id: int = Field(..., description="참조할 공지 ID")


class AddRefGenericIn(BaseModel):
    """Generic 참조 추가 (event, file, notice 등)"""

    ref_type: str = Field(..., max_length=20, description="참조 타입 (notice/event/file 등)")
    ref_id: int = Field(..., description="참조 대상 ID")


class NoticeRefOut(BaseModel):
    """공지 참조 조회 응답"""

    id: int
    ref_type: Optional[str] = Field(None, description="참조 타입")
    ref_id: Optional[int] = Field(None, description="참조 대상 ID")
    ref_notice_id: Optional[int] = Field(None, description="참조 공지 ID")
    ref_title: Optional[str] = Field(None, description="참조 공지 제목")

    model_config = ConfigDict(from_attributes=True)


# ======================================================
# 🧩 Optional List Wrappers (선택적)
# ======================================================
class NoticeListOut(BaseModel):
    """공지 리스트 응답 (wrap 구조가 필요한 경우)"""

    items: List[NoticeOut]


class NoticeRefListOut(BaseModel):
    """공지 참조 리스트 응답 (wrap 구조가 필요한 경우)"""

    items: List[NoticeRefOut]
