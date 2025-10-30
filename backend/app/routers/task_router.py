# app/routers/task_router.py
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services import attachment_service, task_service
from app.utils.token import get_current_user

router = APIRouter(prefix="/projects", tags=["tasks"])


# ---------------------------------------------------------------------
# 공통 에러 핸들러
# ---------------------------------------------------------------------
def _error(msg: str, code=status.HTTP_400_BAD_REQUEST):
    raise HTTPException(status_code=code, detail=msg)


# ---------------------------------------------------------------------
# 🌳 트리형 태스크 조회
# ---------------------------------------------------------------------
@router.get("/{project_id}/tasks/tree", response_model=List[schemas.project.TaskTree])
def get_task_tree(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """특정 프로젝트의 트리 구조(Task Tree) 반환"""
    roots = (
        db.query(models.Task)
        .filter(
            models.Task.project_id == project_id, models.Task.parent_task_id.is_(None)
        )
        .all()
    )

    def build_tree(task):
        return {
            "task_id": task.task_id,
            "project_id": task.project_id,
            "title": task.title,
            "description": task.description,
            "status": task.status,
            "priority": task.priority,
            "start_date": task.start_date,
            "due_date": task.due_date,
            "progress": task.progress,
            "assignees": [
                {"emp_id": m.emp_id, "name": m.employee.name} for m in task.taskmember
            ],
            "subtasks": [build_tree(sub) for sub in task.subtask],
        }

    return [build_tree(t) for t in roots]


# ---------------------------------------------------------------------
# 📋 태스크 CRUD
# ---------------------------------------------------------------------
@router.get("/{project_id}/tasks", response_model=List[schemas.project.Task])
def get_tasks_by_project(project_id: int, db: Session = Depends(get_db)):
    tasks = task_service.get_tasks_by_project(db, project_id)
    if not tasks:
        _error("등록된 태스크가 없습니다.", status.HTTP_404_NOT_FOUND)
    return tasks


@router.get("/{project_id}/tasks/{task_id}", response_model=schemas.project.Task)
def get_task(project_id: int, task_id: int, db: Session = Depends(get_db)):
    task = task_service.get_task_by_id(db, task_id)
    if not task or task.project_id != project_id:
        _error("태스크를 찾을 수 없습니다.", status.HTTP_404_NOT_FOUND)
    return task


@router.post("/{project_id}/tasks", response_model=schemas.project.Task)
def create_task(
    project_id: int,
    request: schemas.project.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    try:
        return task_service.create_task(db, request, current_user.emp_id, project_id)
    except Exception as e:
        _error(str(e))


@router.put("/{project_id}/tasks/{task_id}", response_model=schemas.project.Task)
def update_task(
    project_id: int,
    task_id: int,
    request: schemas.project.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    task = task_service.get_task_by_id(db, task_id)
    if not task or task.project_id != project_id:
        _error("수정할 태스크를 찾을 수 없습니다.", status.HTTP_404_NOT_FOUND)
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
    task = task_service.get_task_by_id(db, task_id)
    if not task or task.project_id != project_id:
        _error("태스크를 찾을 수 없습니다.", status.HTTP_404_NOT_FOUND)
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
    task = task_service.get_task_by_id(db, task_id)
    if not task or task.project_id != project_id:
        _error("삭제할 태스크를 찾을 수 없습니다.", status.HTTP_404_NOT_FOUND)
    task_service.delete_task(db, task, current_user.emp_id)
    return {"success": True, "message": f"태스크 {task_id} 삭제 완료"}


# ---------------------------------------------------------------------
# 📎 첨부파일
# ---------------------------------------------------------------------
@router.get(
    "/{project_id}/tasks/{task_id}/attachments",
    response_model=List[schemas.attachment.Attachment],
)
def get_task_attachments(project_id: int, task_id: int, db: Session = Depends(get_db)):
    task = task_service.get_task_by_id(db, task_id)
    if not task or task.project_id != project_id:
        _error("해당 태스크를 찾을 수 없습니다.", status.HTTP_404_NOT_FOUND)
    return attachment_service.get_attachments_by_task(db, task_id)


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
    task = task_service.get_task_by_id(db, task_id)
    if not task or task.project_id != project_id:
        _error("업로드할 태스크를 찾을 수 없습니다.", status.HTTP_404_NOT_FOUND)
    return attachment_service.upload_attachment(
        db, project_id, task_id, file, current_user
    )


@router.delete("/{project_id}/tasks/{task_id}/attachments/{attachment_id}")
def delete_task_attachment(
    project_id: int,
    task_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    task = task_service.get_task_by_id(db, task_id)
    if not task or task.project_id != project_id:
        _error("삭제할 태스크를 찾을 수 없습니다.", status.HTTP_404_NOT_FOUND)
    return attachment_service.delete_attachment(db, attachment_id, current_user)
