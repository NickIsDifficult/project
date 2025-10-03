from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.core.auth import get_current_user
from app.core.exceptions import bad_request, forbidden, not_found
from app.database import get_db
from app.services import comment_service  # ✅ 서비스 사용

router = APIRouter(prefix="/tasks/{task_id}/comments", tags=["comments"])


# -------------------------------
# ✅ 댓글 목록 조회
# -------------------------------
@router.get("/", response_model=list[schemas.project.TaskComment])
def get_comments(task_id: int, db: Session = Depends(get_db)):
    comments = comment_service.get_comments_by_task(db, task_id)
    if not comments:
        not_found("댓글이 없습니다.")
    return comments


# -------------------------------
# ✅ 댓글 작성
# -------------------------------
@router.post("/", response_model=schemas.project.TaskComment)
def create_comment(
    task_id: int,
    comment: schemas.project.TaskCommentCreate,
    db: Session = Depends(get_db),
    current_user: models.Member = Depends(get_current_user),
):
    # 직원만 가능
    if current_user.user_type != "EMPLOYEE":
        forbidden("직원만 댓글을 작성할 수 있습니다.")

    # ✅ 서비스 계층에 위임
    return comment_service.create_comment(
        db=db,
        task_id=task_id,
        emp_id=current_user.emp_id,
        content=comment.content.strip(),
    )


# -------------------------------
# ✅ 댓글 수정
# -------------------------------
@router.patch("/{comment_id}", response_model=schemas.project.TaskComment)
def update_comment(
    task_id: int,
    comment_id: int,
    comment_update: schemas.project.TaskCommentCreate,
    db: Session = Depends(get_db),
    current_user: models.Member = Depends(get_current_user),
):
    return comment_service.update_comment(
        db=db,
        comment_id=comment_id,
        emp_id=current_user.emp_id,
        content=comment_update.content.strip(),
    )


# -------------------------------
# ✅ 댓글 삭제
# -------------------------------
@router.delete("/{comment_id}")
def delete_comment(
    task_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: models.Member = Depends(get_current_user),
):
    return comment_service.delete_comment(
        db=db,
        comment_id=comment_id,
        emp_id=current_user.emp_id,
    )
