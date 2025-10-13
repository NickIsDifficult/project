# app/routers/task_router.py
from typing import List

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app import models, schemas
from app.core.exceptions import forbidden, not_found
from app.database import get_db
from app.schemas import attachment as attachment_schema, project as comment_schema
from app.services import attachment_service, comment_service, task_service
from app.utils.token import get_current_user

# ✅ /projects/... 으로 시작
router = APIRouter(prefix="/projects", tags=["tasks"])


# =====================================================
# 🌳 트리형 태스크 목록
# =====================================================
@router.get("/{project_id}/tasks/tree", response_model=List[schemas.project.TaskTree])
def get_task_tree(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """
    특정 프로젝트의 트리형(Task Tree) 구조를 반환.
    - 상위 업무(parent_task_id가 NULL인 태스크)부터 시작해
      하위(subtasks)까지 중첩된 계층 구조로 반환
    """
    roots = (
        db.query(models.Task)
        .filter(
            models.Task.project_id == project_id, models.Task.parent_task_id.is_(None)
        )
        .all()
    )
    if not roots:
        not_found("등록된 상위 업무가 없습니다.")

    def build_tree(task):
        subtasks = (
            db.query(models.Task)
            .filter(models.Task.parent_task_id == task.task_id)
            .all()
        )
        return {
            "task_id": task.task_id,
            "project_id": task.project_id,
            "title": task.title,
            "description": task.description,
            "status": task.status,
            "priority": task.priority,
            "start_date": task.start_date,
            "due_date": task.due_date,
            "assignee_emp_id": task.assignee_emp_id,
            "assignee_name": task.assignee.name if task.assignee else None,
            "subtasks": [build_tree(sub) for sub in subtasks],
        }

    return [build_tree(t) for t in roots]


# =====================================================
# 📋 태스크(Task)
# =====================================================


@router.get("/{project_id}/tasks", response_model=List[schemas.project.Task])
def get_tasks_by_project(
    project_id: int,
    db: Session = Depends(get_db),
):
    """특정 프로젝트의 모든 태스크 목록"""
    tasks = task_service.get_tasks_by_project(db, project_id)
    if not tasks:
        not_found(f"프로젝트 {project_id}에 등록된 태스크가 없습니다.")
    return tasks


@router.get("/{project_id}/tasks/{task_id}", response_model=schemas.project.Task)
def get_task(
    project_id: int,
    task_id: int,
    db: Session = Depends(get_db),
):
    """개별 태스크 상세 조회"""
    task = task_service.get_task_by_id(db, task_id)
    if not task or task.project_id != project_id:
        not_found("해당 프로젝트 내에서 태스크를 찾을 수 없습니다.")
    return task


@router.post("/{project_id}/tasks", response_model=schemas.project.Task)
def create_task(
    project_id: int,
    request: schemas.project.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """새 태스크 생성"""

    return task_service.create_task(db, request, current_user.emp_id, project_id)


@router.put("/{project_id}/tasks/{task_id}", response_model=schemas.project.Task)
def update_task(
    project_id: int,
    task_id: int,
    request: schemas.project.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """태스크 수정"""
    task = task_service.get_task_by_id(db, task_id)
    if not task or task.project_id != project_id:
        not_found("수정할 태스크를 찾을 수 없습니다.")
    return task_service.update_task(db, task, request, current_user.emp_id)


@router.patch(
    "/{project_id}/tasks/{task_id}/status", response_model=schemas.project.Task
)
def update_task_status(
    project_id: int,
    task_id: int,
    request: schemas.project.TaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """태스크 상태 변경"""
    task = task_service.get_task_by_id(db, task_id)
    if not task or task.project_id != project_id:
        not_found("태스크를 찾을 수 없습니다.")
    return task_service.change_task_status(
        db, task, request.status, current_user.emp_id
    )


@router.delete("/{project_id}/tasks/{task_id}")
def delete_task(
    project_id: int,
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """태스크 삭제"""
    task = task_service.get_task_by_id(db, task_id)
    if not task or task.project_id != project_id:
        not_found(f"태스크 ID {task_id}를 찾을 수 없습니다.")
    task_service.delete_task(db, task, current_user.emp_id)
    return {"success": True, "message": f"태스크 {task_id} 삭제 완료"}


# =====================================================
# 💬 댓글(Comment)
# =====================================================


@router.get(
    "/{project_id}/tasks/{task_id}/comments",
    response_model=List[comment_schema.TaskComment],
)
def get_task_comments(
    project_id: int,
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """특정 태스크의 댓글 목록 조회"""
    task = task_service.get_task_by_id(db, task_id)
    if not task or task.project_id != project_id:
        not_found("해당 프로젝트 내에 태스크가 없습니다.")
    return comment_service.get_comments_by_task(db, task_id)


@router.post(
    "/{project_id}/tasks/{task_id}/comments", response_model=comment_schema.TaskComment
)
def create_task_comment(
    project_id: int,
    task_id: int,
    request: comment_schema.TaskCommentCreate,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """특정 태스크에 댓글 작성"""
    task = task_service.get_task_by_id(db, task_id)
    if not task or task.project_id != project_id:
        not_found("댓글을 달 태스크를 찾을 수 없습니다.")
    return comment_service.create_comment(
        db, task_id, current_user.emp_id, request.content
    )


@router.put(
    "/{project_id}/tasks/{task_id}/comments/{comment_id}",
    response_model=comment_schema.TaskComment,
)
def update_task_comment(
    project_id: int,
    task_id: int,
    comment_id: int,
    request: comment_schema.TaskCommentCreate,  # content만 받음
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """특정 댓글 수정"""
    task = task_service.get_task_by_id(db, task_id)
    if not task or task.project_id != project_id:
        not_found("수정할 댓글의 태스크를 찾을 수 없습니다.")
    return comment_service.update_comment(
        db, comment_id, current_user.emp_id, request.content
    )


@router.delete("/{project_id}/tasks/{task_id}/comments/{comment_id}")
def delete_task_comment(
    project_id: int,
    task_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """특정 댓글 삭제"""
    task = task_service.get_task_by_id(db, task_id)
    if not task or task.project_id != project_id:
        not_found("삭제할 댓글의 태스크를 찾을 수 없습니다.")
    return comment_service.delete_comment(db, comment_id, current_user.emp_id)


# -------------------------------
# 📎 첨부파일 목록 조회
# -------------------------------
@router.get(
    "/{project_id}/tasks/{task_id}/attachments",
    response_model=List[attachment_schema.Attachment],
)
def get_task_attachments(
    project_id: int,
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """특정 태스크의 첨부파일 목록"""
    task = task_service.get_task_by_id(db, task_id)
    if not task or task.project_id != project_id:
        not_found("해당 프로젝트 내에 태스크가 없습니다.")
    return attachment_service.get_attachments_by_task(db, task_id)


# -------------------------------
# 📤 첨부파일 업로드
# -------------------------------
@router.post(
    "/{project_id}/tasks/{task_id}/attachments",
    response_model=attachment_schema.Attachment,
)
def upload_task_attachment(
    project_id: int,
    task_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """태스크에 첨부파일 업로드"""
    task = task_service.get_task_by_id(db, task_id)
    if not task or task.project_id != project_id:
        not_found("업로드할 태스크를 찾을 수 없습니다.")
    return attachment_service.upload_attachment(
        db=db,
        project_id=project_id,
        task_id=task_id,
        file=file,
        current_user=current_user,
    )


# -------------------------------
# ❌ 첨부파일 삭제
# -------------------------------
@router.delete("/{project_id}/tasks/{task_id}/attachments/{attachment_id}")
def delete_task_attachment(
    project_id: int,
    task_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """첨부파일 삭제"""
    task = task_service.get_task_by_id(db, task_id)
    if not task or task.project_id != project_id:
        not_found("삭제할 태스크를 찾을 수 없습니다.")
    return attachment_service.delete_attachment(db, attachment_id, current_user)
