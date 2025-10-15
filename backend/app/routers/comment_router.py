# app/routers/comment_router.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.services import comment_service, task_service
from app.core.exceptions import not_found
from app.utils.token import get_current_user

router = APIRouter(
    prefix="/projects/{project_id}/tasks/{task_id}/comments",
    tags=["comments"],
)

# -------------------------------
# 💬 댓글 목록
# -------------------------------
@router.get("/", response_model=list[schemas.project.TaskComment])
def get_comments(project_id: int, task_id: int, db: Session = Depends(get_db)):
    task = task_service.get_task_by_id(db, task_id)
    if not task or task.project_id != project_id:
        not_found("해당 프로젝트 내 태스크를 찾을 수 없습니다.")
    return comment_service.get_comments_by_task(db, task_id)

# -------------------------------
# 💬 댓글 작성
# -------------------------------
@router.post("/", response_model=schemas.project.TaskComment)
def create_comment(
    project_id: int,
    task_id: int,
    comment: schemas.project.TaskCommentCreate,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    task = task_service.get_task_by_id(db, task_id)
    if not task or task.project_id != project_id:
        not_found("댓글을 달 태스크를 찾을 수 없습니다.")
    return comment_service.create_comment(
        db=db,
        task_id=task_id,
        emp_id=current_user.emp_id,
        content=comment.content.strip(),
    )

# -------------------------------
# 💬 댓글 수정
# -------------------------------
@router.put("/{comment_id}", response_model=schemas.project.TaskComment)
def update_comment(
    project_id: int,
    task_id: int,
    comment_id: int,
    comment_update: schemas.project.TaskCommentCreate,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    task = task_service.get_task_by_id(db, task_id)
    if not task or task.project_id != project_id:
        not_found("수정할 댓글의 태스크를 찾을 수 없습니다.")

    updated = comment_service.update_comment(
        db=db,
        comment_id=comment_id,
        emp_id=current_user.emp_id,
        content=comment_update.content.strip(),
    )
    return updated

# -------------------------------
# 💬 댓글 삭제
# -------------------------------
@router.delete("/{comment_id}")
def delete_comment(
    project_id: int,
    task_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    task = task_service.get_task_by_id(db, task_id)
    if not task or task.project_id != project_id:
        not_found("삭제할 댓글의 태스크를 찾을 수 없습니다.")
    return comment_service.delete_comment(db, comment_id, current_user.emp_id)
