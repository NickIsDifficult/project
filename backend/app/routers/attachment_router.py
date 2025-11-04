from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services import attachment_service
from app.utils.token import get_current_user

# ------------------------------------------------------------
# 📁 첨부파일 라우터
# ------------------------------------------------------------
router = APIRouter(prefix="/projects", tags=["attachments"])


# ============================================================
# 📎 [1] 태스크 첨부파일 업로드
# ============================================================
@router.post(
    "/{project_id}/tasks/{task_id}/attachments",
    response_model=schemas.attachment.Attachment,
)
def upload_task_attachment(
    project_id: int,
    task_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """
    📎 특정 태스크에 첨부파일 업로드
    - 프론트: FormData → /projects/{project_id}/tasks/{task_id}/attachments
    """
    try:
        return attachment_service.upload_attachment(
            db=db,
            project_id=project_id,
            task_id=task_id,
            file=file,
            current_user=current_user,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"첨부파일 업로드 실패: {e}",
        )


# ============================================================
# 📄 [2] 태스크 첨부파일 목록
# ============================================================
@router.get(
    "/{project_id}/tasks/{task_id}/attachments",
    response_model=List[schemas.attachment.Attachment],
)
def list_task_attachments(
    project_id: int,
    task_id: int,
    db: Session = Depends(get_db),
):
    """
    📄 특정 태스크에 등록된 첨부파일 목록 조회
    """
    try:
        return attachment_service.get_attachments_by_task(db, task_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"첨부파일 목록 조회 실패: {e}",
        )


# ============================================================
# ❌ [3] 태스크 첨부파일 삭제
# ============================================================
@router.delete("/{project_id}/tasks/{task_id}/attachments/{attachment_id}")
def delete_task_attachment(
    project_id: int,
    task_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """
    ❌ 태스크 첨부파일 삭제
    """
    try:
        return attachment_service.delete_attachment(db, attachment_id, current_user)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"첨부파일 삭제 실패: {e}",
        )


# ============================================================
# 📤 [4] 프로젝트 첨부파일 업로드
# ============================================================
@router.post(
    "/{project_id}/attachments",
    response_model=schemas.attachment.Attachment,
)
def upload_project_attachment(
    project_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """
    📁 프로젝트 단위 첨부파일 업로드
    - 업무(task)에 속하지 않은 프로젝트 전체 파일
    """
    try:
        return attachment_service.upload_attachment(
            db=db,
            project_id=project_id,
            task_id=None,
            file=file,
            current_user=current_user,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"프로젝트 첨부파일 업로드 실패: {e}",
        )


# ============================================================
# 📄 [5] 프로젝트 첨부파일 목록
# ============================================================
@router.get(
    "/{project_id}/attachments",
    response_model=List[schemas.attachment.Attachment],
)
def list_project_attachments(
    project_id: int,
    db: Session = Depends(get_db),
):
    """
    📄 프로젝트 전체 첨부파일 목록 조회
    """
    try:
        return attachment_service.get_attachments_by_project(db, project_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"프로젝트 첨부파일 목록 조회 실패: {e}",
        )


# ============================================================
# ❌ [6] 프로젝트 첨부파일 삭제
# ============================================================
@router.delete("/{project_id}/attachments/{attachment_id}")
def delete_project_attachment(
    project_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """
    ❌ 프로젝트 첨부파일 삭제
    - task_id 여부 관계없이 삭제 가능하도록 수정
    """
    att = (
        db.query(models.Attachment)
        .filter(
            models.Attachment.attachment_id == attachment_id,
            models.Attachment.project_id == project_id,
        )
        .first()
    )

    if not att:
        raise HTTPException(status_code=404, detail="첨부를 찾을 수 없습니다.")

    db.delete(att)
    db.commit()
    return {"success": True, "deleted_id": attachment_id}
