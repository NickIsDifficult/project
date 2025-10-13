# app/services/attachment_service.py
import os
from datetime import datetime

from fastapi import UploadFile
from sqlalchemy.orm import Session

from projectlist import models
from projectlist.core.exceptions import bad_request, forbidden, not_found
from projectlist.utils.activity_logger import log_task_action

# -------------------------------
# 🧭 기본 저장 경로 설정
# -------------------------------
UPLOAD_DIR = os.path.join("uploads", "files")  # 루트 경로 기준
os.makedirs(UPLOAD_DIR, exist_ok=True)


# -------------------------------
# ✅ 특정 태스크의 첨부파일 목록 조회
# -------------------------------
def get_attachments_by_task(db: Session, task_id: int):
    """특정 태스크에 연결된 첨부파일 조회"""
    attachments = (
        db.query(models.Attachment)
        .filter(models.Attachment.task_id == task_id)
        .order_by(models.Attachment.uploaded_at.desc())
        .all()
    )
    # 빈 리스트면 그냥 [] 반환 (404 굳이 아님)
    return attachments


# -------------------------------
# ✅ 첨부파일 업로드
# -------------------------------
def upload_attachment(
    db: Session,
    task_id: int,
    project_id: int,
    file: UploadFile,
    current_user,
):
    """파일 업로드 처리"""
    if current_user.user_type != "EMPLOYEE":
        forbidden("직원만 첨부파일을 업로드할 수 있습니다.")

    # task 존재 여부 체크
    task = db.query(models.Task).filter(models.Task.task_id == task_id).first()
    if not task:
        not_found("해당 태스크를 찾을 수 없습니다.")

    try:
        # ----------------------------
        # 1️⃣ 실제 파일 저장
        # ----------------------------
        filename = file.filename
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        safe_name = f"{timestamp}_{filename}"
        file_path = os.path.join(UPLOAD_DIR, safe_name)

        # UploadFile은 async이므로 .file.read() 보다는 .read() 써도 되지만, 파일이 클 경우는 async context 필요
        with open(file_path, "wb") as buffer:
            buffer.write(file.file.read())

        # ----------------------------
        # 2️⃣ DB 기록
        # ----------------------------
        new_file = models.Attachment(
            project_id=project_id,
            task_id=task_id,
            uploaded_by=current_user.emp_id,
            file_name=filename,
            file_path=file_path,
            uploaded_at=datetime.utcnow(),
        )
        db.add(new_file)
        db.commit()
        db.refresh(new_file)

        # ----------------------------
        # 3️⃣ 로그 기록
        # ----------------------------
        log_task_action(
            db=db,
            task_id=task_id,
            emp_id=current_user.emp_id,
            action="file_uploaded",
            detail=f"{filename} 업로드됨",
        )

        return new_file

    except Exception as e:
        db.rollback()
        bad_request(f"파일 업로드 중 오류 발생: {str(e)}")


# -------------------------------
# ✅ 첨부파일 삭제
# -------------------------------
def delete_attachment(db: Session, attachment_id: int, current_user):
    """본인이 업로드한 파일만 삭제 가능"""
    attachment = (
        db.query(models.Attachment)
        .filter(models.Attachment.attachment_id == attachment_id)
        .first()
    )
    if not attachment:
        not_found(f"첨부파일 ID {attachment_id}를 찾을 수 없습니다.")
    if attachment.uploaded_by != current_user.emp_id:
        forbidden("본인이 업로드한 파일만 삭제할 수 있습니다.")

    try:
        # 실제 파일 삭제
        if attachment.file_path and os.path.exists(attachment.file_path):
            os.remove(attachment.file_path)

        db.delete(attachment)
        db.commit()

        # 로그 기록
        log_task_action(
            db=db,
            task_id=attachment.task_id,
            emp_id=current_user.emp_id,
            action="file_deleted",
            detail=f"{attachment.file_name} 삭제됨",
        )

        return {"success": True, "message": f"{attachment.file_name} 삭제 완료"}

    except Exception as e:
        db.rollback()
        bad_request(f"첨부파일 삭제 중 오류 발생: {str(e)}")
