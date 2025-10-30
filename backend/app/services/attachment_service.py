# app/services/attachment_service.py
from __future__ import annotations
import os
import shutil
from typing import List
from fastapi import UploadFile
from sqlalchemy.orm import Session

from app import models, schemas
from app.core.exceptions import bad_request, not_found, forbidden


# ------------------------------------------------------
# ✅ 첨부파일 목록 조회
# ------------------------------------------------------
def get_attachments_by_task(db: Session, task_id: int) -> List[models.Attachment]:
    return (
        db.query(models.Attachment)
        .filter(models.Attachment.task_id == task_id, models.Attachment.is_deleted == False)
        .order_by(models.Attachment.uploaded_at.desc())
        .all()
    )


def get_attachments_by_project(db: Session, project_id: int) -> List[models.Attachment]:
    return (
        db.query(models.Attachment)
        .filter(models.Attachment.project_id == project_id, models.Attachment.is_deleted == False)
        .order_by(models.Attachment.uploaded_at.desc())
        .all()
    )


# ------------------------------------------------------
# ✅ 첨부파일 업로드
# ------------------------------------------------------
def upload_attachment(
    db: Session,
    project_id: int | None,
    task_id: int | None,
    file: UploadFile,
    current_user: models.Employee,
) -> models.Attachment:
    try:
        # 🧱 저장 경로 지정
        upload_dir = f"uploads/projects/{project_id or 'general'}/tasks/{task_id or 'misc'}"
        os.makedirs(upload_dir, exist_ok=True)

        file_path = os.path.join(upload_dir, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        attachment = models.Attachment(
            project_id=project_id,
            task_id=task_id,
            uploaded_by=current_user.emp_id,
            file_name=file.filename,
            file_path=file_path,
            file_type=file.content_type,
            file_size=os.path.getsize(file_path),
        )

        db.add(attachment)
        db.commit()
        db.refresh(attachment)
        return attachment

    except Exception as e:
        db.rollback()
        bad_request(f"첨부파일 업로드 실패: {str(e)}")


# ------------------------------------------------------
# ✅ 첨부파일 삭제 (soft delete + 파일 삭제)
# ------------------------------------------------------
def delete_attachment(db: Session, attachment_id: int, current_user: models.Employee):
    attachment = (
        db.query(models.Attachment)
        .filter(models.Attachment.attachment_id == attachment_id)
        .first()
    )
    if not attachment:
        not_found("삭제할 첨부파일을 찾을 수 없습니다.")

    # 권한 검증 (업로더 또는 프로젝트 소유자만)
    if attachment.uploaded_by != current_user.emp_id:
        project_owner = (
            db.query(models.Project)
            .filter(models.Project.project_id == attachment.project_id)
            .first()
        )
        if not project_owner or project_owner.owner_emp_id != current_user.emp_id:
            forbidden("삭제 권한이 없습니다.")

    # Soft delete + 실제 파일 삭제
    attachment.is_deleted = True
    db.commit()

    try:
        if os.path.exists(attachment.file_path):
            os.remove(attachment.file_path)
    except Exception:
        pass  # 파일 시스템 오류 무시 (DB 우선)

    return {"success": True, "message": f"{attachment.file_name} 삭제 완료"}


# ------------------------------------------------------
# ✅ 첨부파일 상세 조회
# ------------------------------------------------------
def get_attachment_by_id(db: Session, attachment_id: int) -> models.Attachment:
    att = db.query(models.Attachment).filter(models.Attachment.attachment_id == attachment_id).first()
    if not att:
        not_found("첨부파일을 찾을 수 없습니다.")
    return att
