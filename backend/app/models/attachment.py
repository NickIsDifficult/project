# app/models/attachment.py
from __future__ import annotations
from datetime import datetime
from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Attachment(Base):
    """
    📎 파일 첨부 모델
    - 프로젝트 / 태스크 단위로 파일 업로드 관리
    - 업로더(Employee) 관계 포함
    - soft-delete 지원 (is_deleted)
    """

    __tablename__ = "attachments"

    # -----------------------------------------------------------------
    # 기본 컬럼
    # -----------------------------------------------------------------
    attachment_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    project_id: Mapped[int | None] = mapped_column(
        ForeignKey("projects.project_id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    task_id: Mapped[int | None] = mapped_column(
        ForeignKey("tasks.task_id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    uploaded_by: Mapped[int | None] = mapped_column(
        ForeignKey("employees.emp_id", ondelete="SET NULL"),
        nullable=True,
    )

    # -----------------------------------------------------------------
    # 파일 메타데이터
    # -----------------------------------------------------------------
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    file_size: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    file_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # -----------------------------------------------------------------
    # 업로드 시각
    # -----------------------------------------------------------------
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # -----------------------------------------------------------------
    # 관계 설정
    # -----------------------------------------------------------------
    project: Mapped["Project"] = relationship(
        back_populates="attachments",
        lazy="selectin",
    )

    task: Mapped["Task"] = relationship(
        back_populates="attachments",
        lazy="selectin",
    )

    uploader: Mapped["Employee"] = relationship(
        back_populates="attachments",
        lazy="selectin",
    )

    # -----------------------------------------------------------------
    # 표현
    # -----------------------------------------------------------------
    def __repr__(self) -> str:
        return f"<Attachment id={self.attachment_id}, file='{self.file_name}', deleted={self.is_deleted}>"
