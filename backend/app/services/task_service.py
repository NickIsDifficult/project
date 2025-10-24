# app/services/task_service.py
from __future__ import annotations

from typing import List

from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.core.exceptions import bad_request, forbidden, not_found
from app.models.enums import TaskStatus
from app.models.notification import NotificationType
from app.services import history_service
from app.utils.activity_logger import log_task_action
from app.utils.notifier import create_notifications


# =====================================================
# ✅ 프로젝트별 태스크 조회
# =====================================================
def get_tasks_by_project(db: Session, project_id: int) -> List[models.Task]:
    """특정 프로젝트의 모든 태스크 조회 (다중 담당자 포함)"""
    tasks = (
        db.query(models.Task)
        .options(
            joinedload(models.Task.taskmember).joinedload(models.TaskMember.employee),
            joinedload(models.Task.subtask),
        )
        .filter(models.Task.project_id == project_id)
        .order_by(models.Task.due_date.asc().nulls_last())
        .all()
    )

    for t in tasks:
        t.assignee_ids = [m.emp_id for m in t.taskmember]
    return tasks


# =====================================================
# ✅ 단일 태스크 조회
# =====================================================
def get_task_by_id(db: Session, task_id: int) -> models.Task | None:
    return (
        db.query(models.Task)
        .options(
            joinedload(models.Task.taskmember).joinedload(models.TaskMember.employee)
        )
        .filter(models.Task.task_id == task_id)
        .first()
    )


# =====================================================
# ✅ 태스크 생성
# =====================================================
def create_task(
    db: Session,
    request: schemas.project.TaskCreate,
    creator_emp_id: int,
    project_id: int,
) -> models.Task:
    """태스크 생성 + 로그 + 알림"""
    try:
        new_task = models.Task(
            project_id=project_id,
            title=request.title.strip(),
            description=request.description,
            start_date=request.start_date,
            due_date=request.due_date,
            priority=request.priority,
            status=request.status or TaskStatus.PLANNED,
            parent_task_id=request.parent_task_id,
            estimate_hours=request.estimate_hours,
            progress=request.progress or 0,
        )

        db.add(new_task)
        db.commit()
        db.refresh(new_task)

        # 담당자(단일 필드 기반)
        if request.assignee_emp_id:
            db.add(
                models.TaskMember(
                    task_id=new_task.task_id, emp_id=request.assignee_emp_id
                )
            )
            db.commit()

        # 로그 기록
        log_task_action(
            db=db,
            emp_id=creator_emp_id,
            project_id=project_id,
            task_id=new_task.task_id,
            action="task_created",
            detail=f"'{new_task.title}' 생성됨",
        )

        # 알림 (담당자가 있을 때만)
        if request.assignee_emp_id:
            create_notifications(
                db=db,
                recipients=[request.assignee_emp_id],
                actor_emp_id=creator_emp_id,
                project_id=project_id,
                task_id=new_task.task_id,
                ntype=NotificationType.assignment,
                payload={"title": new_task.title},
            )

        return new_task

    except Exception as e:
        db.rollback()
        bad_request(f"태스크 생성 중 오류 발생: {str(e)}")


# =====================================================
# ✅ 태스크 수정
# =====================================================
def update_task(
    db: Session,
    task: models.Task,
    request: schemas.project.TaskUpdate,
    updater_emp_id: int,
) -> models.Task:
    """태스크 수정 + 로그 + 선택적 알림"""
    try:
        if updater_emp_id not in [task.project.owner_emp_id] + [
            m.emp_id for m in task.taskmember
        ]:
            forbidden("담당자 또는 프로젝트 소유자만 수정 가능합니다.")

        update_data = request.model_dump(exclude_unset=True)

        before_progress = task.progress
        for key, value in update_data.items():
            setattr(task, key, value)

        db.commit()
        db.refresh(task)

        # 로그
        log_task_action(
            db=db,
            emp_id=updater_emp_id,
            project_id=task.project_id,
            task_id=task.task_id,
            action="task_updated",
            detail=f"'{task.title}' 수정됨",
        )

        # 진행률 변경 알림
        if "progress" in update_data and task.taskmember:
            for member in task.taskmember:
                if member.emp_id != updater_emp_id:
                    create_notifications(
                        db=db,
                        recipients=[member.emp_id],
                        actor_emp_id=updater_emp_id,
                        project_id=task.project_id,
                        task_id=task.task_id,
                        ntype=NotificationType.status_change,
                        payload={"progress": update_data["progress"]},
                    )

        return task

    except Exception as e:
        db.rollback()
        bad_request(f"태스크 수정 중 오류 발생: {str(e)}")


# =====================================================
# ✅ 상태 변경
# =====================================================
def change_task_status(
    db: Session, task: models.Task, new_status: TaskStatus, actor_emp_id: int
):
    """상태 변경 + 로그 + 이력 + 알림"""
    old_status = task.status
    task.status = new_status

    try:
        db.commit()
        db.refresh(task)

        # 이력 저장
        history_service.create_task_history(
            db=db,
            task_id=task.task_id,
            old_status=old_status,
            new_status=new_status,
            changed_by=actor_emp_id,
        )

        # 로그
        log_task_action(
            db=db,
            emp_id=actor_emp_id,
            project_id=task.project_id,
            task_id=task.task_id,
            action="status_changed",
            detail=f"{old_status} → {new_status}",
        )

        # 알림
        if task.taskmember:
            for member in task.taskmember:
                if member.emp_id != actor_emp_id:
                    create_notifications(
                        db=db,
                        recipients=[member.emp_id],
                        actor_emp_id=actor_emp_id,
                        project_id=task.project_id,
                        task_id=task.task_id,
                        ntype=NotificationType.status_change,
                        payload={"old_status": old_status, "new_status": new_status},
                    )

        return task

    except Exception as e:
        db.rollback()
        bad_request(f"태스크 상태 변경 중 오류: {str(e)}")


# =====================================================
# ✅ 태스크 삭제
# =====================================================
def delete_task(db: Session, task: models.Task, actor_emp_id: int):
    """태스크 삭제 + 로그"""
    try:
        if actor_emp_id not in [task.project.owner_emp_id] + [
            m.emp_id for m in task.taskmember
        ]:
            forbidden("담당자 또는 프로젝트 소유자만 삭제할 수 있습니다.")

        title = task.title

        log_task_action(
            db=db,
            emp_id=actor_emp_id,
            project_id=task.project_id,
            task_id=task.task_id,
            action="task_deleted",
            detail=f"'{title}' 삭제됨",
        )

        db.delete(task)
        db.commit()
        return True

    except Exception as e:
        db.rollback()
        bad_request(f"태스크 삭제 중 오류: {str(e)}")
