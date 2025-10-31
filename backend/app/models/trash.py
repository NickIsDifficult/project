from datetime import datetime
from pathlib import Path
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Trash(Base):
    """
    휴지통 항목 모델
    - 실제 데이터가 삭제/이동될 때 메타정보를 저장(파일 경로 포함 가능)
    """
    __tablename__ = "trash"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # 표시 정보
    title = Column(String(255), nullable=True)  # 파일명/문서 제목 등

    # 원본 위치 정보
    table_name = Column(String(64), nullable=False)   # 예: "files", "notices"
    record_id = Column(Integer, nullable=False)       # 원본 레코드 PK

    # 삭제 메타
    deleted_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    delete_reason = Column(String(255), nullable=True)

    # 삭제한 사람(선택)
    deleted_by_emp_id = Column(Integer, ForeignKey("employee.emp_id", ondelete="SET NULL"), nullable=True)
    deleted_by = relationship("Employee", foreign_keys=[deleted_by_emp_id])

    # 파일 관련(선택) - 파일이 있는 경우
    file_path = Column(Text, nullable=True)      # 서버 저장 경로(상대/절대)
    content_type = Column(String(128), nullable=True)
    size_bytes = Column(Integer, nullable=True)

    # 인덱스
    __table_args__ = (
        Index("ix_trash_table_record", "table_name", "record_id"),
        Index("ix_trash_deleted_at", "deleted_at"),
    )

    # 편의: 실제 파일이 있는지 여부
    def has_file(self) -> bool:
        return bool(self.file_path)
