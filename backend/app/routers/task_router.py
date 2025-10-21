# app/routers/task_router.py
from typing import List
from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app import models, schemas
from app.core.exceptions import not_found
from app.database import get_db
from app.schemas import attachment as attachment_schema
from app.services import attachment_service, task_service
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
    """특정 프로젝트의 트리형(Task Tree) 구조 반환"""
    roots = (
        db.query(models.Task)
        .filter(
            models.Task.project_id == project_id,
            models.Task.parent_task_id.is_(None),
        )
        .all()
    )

    if not roots:
        return []  # ✅ 빈 리스트 반환으로 UX 개선

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
# 📋 태스크 CRUD
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
    return {
        **task.__dict__,
        "assignee_name": task.assignee.name if task.assignee else None,
    }


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

    updated = task_service.update_task(db, task, request, current_user.emp_id)
    assignee_name = updated.assignee.name if updated.assignee else None
    return {**updated.__dict__, "assignee_name": assignee_name}


@router.patch(
    "/{project_id}/tasks/{task_id}/status",
    response_model=schemas.project.Task,
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

    updated = task_service.change_task_status(
        db, task, request.status, current_user.emp_id
    )
    assignee_name = updated.assignee.name if updated.assignee else None
    return {**updated.__dict__, "assignee_name": assignee_name}


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
# 📎 첨부파일
# =====================================================
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
    """첨부파일 목록"""
    task = task_service.get_task_by_id(db, task_id)
    if not task or task.project_id != project_id:
        not_found("해당 프로젝트 내에 태스크가 없습니다.")
    return attachment_service.get_attachments_by_task(db, task_id)


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
    """첨부파일 업로드"""
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
