from typing import List

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime

from app import models, schemas
from app.core.exceptions import not_found
from app.database import get_db
from app.schemas import attachment as attachment_schema
from app.services import attachment_service
from app.utils.token import get_current_user

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
        .options(
            joinedload(models.Task.task_assignees).joinedload(
                models.TaskAssignee.employee
            )
        )
        .all()
    )

    if not roots:
        return []  # ✅ 빈 리스트 반환으로 UX 개선

    def build_tree(task):
        subtasks = (
            db.query(models.Task)
            .filter(models.Task.parent_task_id == task.task_id)
            .options(
                joinedload(models.Task.task_assignees).joinedload(
                    models.TaskAssignee.employee
                )
            )
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
            "progress": task.progress,
            "assignee_ids": [a.emp_id for a in task.task_assignees],
            "assignees": [
                {"emp_id": a.emp_id, "name": a.employee.name}
                for a in task.task_assignees
                if a.employee
            ],
            "subtasks": [build_tree(sub) for sub in subtasks],
        }

    return [build_tree(t) for t in roots]


# =====================================================
# 📋 태스크 목록 조회
# =====================================================
@router.get("/{project_id}/tasks", response_model=List[schemas.project.Task])
def get_tasks_by_project(project_id: int, db: Session = Depends(get_db)):
    """특정 프로젝트의 모든 태스크 목록"""
    tasks = (
        db.query(models.Task)
        .filter(models.Task.project_id == project_id)
        .options(
            joinedload(models.Task.task_assignees).joinedload(
                models.TaskAssignee.employee
            )
        )
        .all()
    )
    if not tasks:
        not_found(f"프로젝트 {project_id}에 등록된 태스크가 없습니다.")

    result = []
    for t in tasks:
        assignees = [
            {"emp_id": ta.emp_id, "name": ta.employee.name}
            for ta in t.task_assignees
            if ta.employee
        ]
        result.append(
            {
                **t.__dict__,
                "assignee_ids": [a["emp_id"] for a in assignees],
                "assignees": assignees,
            }
        )
    return result


# =====================================================
# 📋 태스크 상세 조회
# =====================================================
@router.get("/{project_id}/tasks/{task_id}", response_model=schemas.project.Task)
def get_task(project_id: int, task_id: int, db: Session = Depends(get_db)):
    """개별 태스크 상세 조회"""
    task = (
        db.query(models.Task)
        .filter(models.Task.task_id == task_id, models.Task.project_id == project_id)
        .options(
            joinedload(models.Task.task_assignees).joinedload(
                models.TaskAssignee.employee
            )
        )
        .first()
    )
    if not task:
        not_found("해당 프로젝트 내에서 태스크를 찾을 수 없습니다.")

    return {
        **task.__dict__,
        "assignee_ids": [a.emp_id for a in task.task_assignees],
        "assignees": [
            {"emp_id": a.emp_id, "name": a.employee.name}
            for a in task.task_assignees
            if a.employee
        ],
    }


# =====================================================
# 🆕 태스크 생성
# =====================================================
@router.post("/{project_id}/tasks", response_model=schemas.project.Task)
def create_task(
    project_id: int,
    request: schemas.project.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """새 태스크 생성"""
    new_task = models.Task(
        project_id=project_id,
        title=request.title,
        description=request.description,
        status=request.status,
        priority=request.priority,
        start_date=request.start_date,
        due_date=request.due_date,
        estimate_hours=request.estimate_hours,
        progress=request.progress,
        parent_task_id=request.parent_task_id,
    )
    db.add(new_task)
    db.flush()  # task_id 확보

    # ✅ 담당자 연결 (다중)
    if request.assignee_ids:
        for emp_id in request.assignee_ids:
            db.add(models.TaskAssignee(task_id=new_task.task_id, emp_id=emp_id))

    db.commit()
    db.refresh(new_task)

    assignees = [
        {"emp_id": ta.emp_id, "name": ta.employee.name}
        for ta in new_task.task_assignees
        if ta.employee
    ]
    return {
        **new_task.__dict__,
        "assignee_ids": [a["emp_id"] for a in assignees],
        "assignees": assignees,
    }


# =====================================================
# ✏️ 태스크 수정
# =====================================================
@router.put("/{project_id}/tasks/{task_id}", response_model=schemas.project.Task)
def update_task(
    project_id: int,
    task_id: int,
    request: schemas.project.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """태스크 수정"""
    task = (
        db.query(models.Task)
        .filter(models.Task.task_id == task_id, models.Task.project_id == project_id)
        .options(joinedload(models.Task.task_assignees))
        .first()
    )
    if not task:
        not_found("수정할 태스크를 찾을 수 없습니다.")

    # 기본 필드 업데이트
    for field, value in request.dict(exclude_unset=True).items():
        if hasattr(task, field) and field not in ["assignee_ids"]:
            setattr(task, field, value)

    # ✅ 담당자 변경 처리
    if request.assignee_ids is not None:
        new_ids = set(request.assignee_ids)
        old_ids = {a.emp_id for a in task.task_assignees}

        # 제거
        for a in list(task.task_assignees):
            if a.emp_id not in new_ids:
                db.delete(a)

        # 추가
        for emp_id in new_ids - old_ids:
            db.add(models.TaskAssignee(task_id=task.task_id, emp_id=emp_id))

    db.commit()
    db.refresh(task)

    assignees = [
        {"emp_id": a.emp_id, "name": a.employee.name}
        for a in task.task_assignees
        if a.employee
    ]
    return {
        **task.__dict__,
        "assignee_ids": [a["emp_id"] for a in assignees],
        "assignees": assignees,
    }


# =====================================================
# 🚮 태스크 삭제
# =====================================================
@router.delete("/{project_id}/tasks/{task_id}")
def delete_task(
    project_id: int,
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """태스크 삭제"""
    task = (
        db.query(models.Task).filter_by(task_id=task_id, project_id=project_id).first()
    )
    if not task:
        not_found(f"태스크 ID {task_id}를 찾을 수 없습니다.")

    db.delete(task)
    db.commit()
    return {"success": True, "message": f"태스크 {task_id} 삭제 완료"}

# =====================================================
# 🔄 태스크 상태 변경 (경량 PATCH)
# =====================================================
@router.patch("/{project_id}/tasks/{task_id}/status")
def update_task_status(
    project_id: int,
    task_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """
    🧩 태스크 상태만 변경 (예: TO_DO → IN_PROGRESS)
    - 칸반보드/리스트뷰 드롭다운 등 빠른 상태 변경용
    """
    task = (
        db.query(models.Task)
        .filter(models.Task.project_id == project_id, models.Task.task_id == task_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    new_status = payload.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="Status is required")

    task.status = new_status
    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)

    return {
        "message": "Task status updated successfully",
        "task_id": task.task_id,
        "project_id": project_id,
        "status": task.status,
    }


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
    task = (
        db.query(models.Task).filter_by(task_id=task_id, project_id=project_id).first()
    )
    if not task:
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
    task = (
        db.query(models.Task).filter_by(task_id=task_id, project_id=project_id).first()
    )
    if not task:
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
    task = (
        db.query(models.Task).filter_by(task_id=task_id, project_id=project_id).first()
    )
    if not task:
        not_found("삭제할 태스크를 찾을 수 없습니다.")
    return attachment_service.delete_attachment(db, attachment_id, current_user)
