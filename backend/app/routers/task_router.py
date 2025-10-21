from typing import List
from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload

from app import models, schemas
from app.core.exceptions import not_found
from app.database import get_db
from app.schemas import attachment as attachment_schema
from app.services import attachment_service, task_service
from app.utils.token import get_current_user

router = APIRouter(prefix="/projects", tags=["tasks"])

# 🌳 트리형 태스크 목록
@router.get("/{project_id}/tasks/tree", response_model=dict)
def get_task_tree(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    project = (
        db.query(models.Project)
        .options(
            joinedload(models.Project.members).joinedload(models.ProjectMember.employee),
            joinedload(models.Project.tasks)
                .joinedload(models.Task.task_members)
                .joinedload(models.TaskMember.employee),
        )
        .filter(models.Project.project_id == project_id)
        .first()
    )

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    def build_tree(task):
        return {
            "task_id": task.task_id,
            "project_id": task.project_id,
            "title": task.title or "(제목 없음)",
            "description": task.description or "",
            "status": task.status,
            "priority": task.priority,
            "start_date": task.start_date,
            "due_date": task.due_date,
            "progress": task.progress,
            "assignees": [
                {"emp_id": m.employee.emp_id, "name": m.employee.name}
                for m in task.task_members if m.employee
            ],
            "subtasks": [build_tree(sub) for sub in task.subtasks],
        }

    roots = [t for t in project.tasks if t.parent_task_id is None]

    return {
        "project": {
            "project_id": project.project_id,
            "project_name": project.project_name,
            "description": project.description,
            "status": project.status,
            "start_date": project.start_date,
            "end_date": project.end_date,
            "owner_emp_id": project.owner_emp_id,
            "members": [
                {"emp_id": m.employee.emp_id, "name": m.employee.name, "role": m.role}
                for m in project.members if m.employee
            ],
        },
        "tasks": [build_tree(t) for t in roots],
    }

# 📋 태스크 CRUD
@router.get("/{project_id}/tasks", response_model=List[schemas.project.TaskSimple])
def get_tasks_by_project(project_id: int, db: Session = Depends(get_db)):
    tasks = task_service.get_tasks_by_project(db, project_id)
    if not tasks:
        not_found(f"프로젝트 {project_id}에 등록된 태스크가 없습니다.")
    return tasks


@router.get("/{project_id}/tasks/{task_id}", response_model=schemas.project.TaskSimple)
def get_task(project_id: int, task_id: int, db: Session = Depends(get_db)):
    task = task_service.get_task_by_id(db, task_id)
    if not task or task.project_id != project_id:
        not_found("해당 프로젝트 내에서 태스크를 찾을 수 없습니다.")
    return {**task.__dict__, "assignee_name": task.assignee.name if task.assignee else None}


@router.post("/{project_id}/tasks", response_model=schemas.project.TaskSimple)
def create_task(project_id: int, request: schemas.project.TaskCreate, db: Session = Depends(get_db), current_user: models.Employee = Depends(get_current_user)):
    return task_service.create_task(db, request, current_user.emp_id, project_id)


@router.put("/{project_id}/tasks/{task_id}", response_model=schemas.project.TaskSimple)
def update_task(project_id: int, task_id: int, request: schemas.project.TaskUpdate, db: Session = Depends(get_db), current_user: models.Employee = Depends(get_current_user)):
    task = task_service.get_task_by_id(db, task_id)
    if not task or task.project_id != project_id:
        not_found("수정할 태스크를 찾을 수 없습니다.")
    updated = task_service.update_task(db, task, request, current_user.emp_id)
    return {**updated.__dict__, "assignee_name": updated.assignee.name if updated.assignee else None}


@router.patch("/{project_id}/tasks/{task_id}/status", response_model=schemas.project.TaskSimple)
def update_task_status(project_id: int, task_id: int, request: schemas.project.TaskStatusUpdate, db: Session = Depends(get_db), current_user: models.Employee = Depends(get_current_user)):
    task = task_service.get_task_by_id(db, task_id)
    if not task or task.project_id != project_id:
        not_found("태스크를 찾을 수 없습니다.")
    updated = task_service.change_task_status(db, task, request.status, current_user.emp_id)
    return {**updated.__dict__, "assignee_name": updated.assignee.name if updated.assignee else None}


@router.delete("/{project_id}/tasks/{task_id}")
def delete_task(project_id: int, task_id: int, db: Session = Depends(get_db), current_user: models.Employee = Depends(get_current_user)):
    task = task_service.get_task_by_id(db, task_id)
    if not task or task.project_id != project_id:
        not_found(f"태스크 ID {task_id}를 찾을 수 없습니다.")
    task_service.delete_task(db, task, current_user.emp_id)
    return {"success": True, "message": f"태스크 {task_id} 삭제 완료"}
