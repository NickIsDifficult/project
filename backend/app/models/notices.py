# app/models/notices.py
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship

from app.database import Base

class Notice(Base):
    __tablename__ = "notice"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False, index=True)
    body = Column(Text, nullable=False)
    scope = Column(String(20), nullable=False, default="GLOBAL", index=True)  # GLOBAL/TEAM/PROJECT
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    author_id = Column(Integer, ForeignKey("member.member_id"), nullable=False, index=True)
    author = relationship("Member", backref="notices")

    # 참조 관계
    references = relationship("NoticeReference", back_populates="notice", cascade="all, delete-orphan")

# 검색/정렬 최적화
Index("ix_notice_comp", Notice.scope, Notice.created_at)

class NoticeReference(Base):
    __tablename__ = "notice_reference"

    id = Column(Integer, primary_key=True, autoincrement=True)
    notice_id = Column(Integer, ForeignKey("notice.id", ondelete="CASCADE"), nullable=False, index=True)

    # 두 포맷 모두 지원:
    # 1) ref_type + ref_id (generic: 'notice'|'event'|'file' + 숫자ID)
    # 2) ref_notice_id (공지 ID 참조 전용, NoticeDetail 컴포넌트 호환)
    ref_type = Column(String(20), nullable=True, index=True)  # e.g., 'notice', 'event', 'file'
    ref_id = Column(Integer, nullable=True, index=True)
    ref_notice_id = Column(Integer, nullable=True, index=True)

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    notice = relationship("Notice", back_populates="references")

    __table_args__ = (
        # 동일 참조 중복 방지
        UniqueConstraint("notice_id", "ref_type", "ref_id", name="uq_notice_ref_generic"),
        UniqueConstraint("notice_id", "ref_notice_id", name="uq_notice_ref_notice"),
    )
