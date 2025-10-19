from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.core.exceptions import bad_request, forbidden, not_found
from app.models.enums import TaskStatus
from app.models.notification import NotificationType
from app.routers.ws_router import notify_project
from app.services import history_service
from app.utils.activity_logger import log_task_action
from app.utils.notifier import create_notifications


# =====================================================
# ✅ 프로젝트별 태스크 조회
# =====================================================
def get_tasks_by_project(db: Session, project_id: int):
    """특정 프로젝트의 모든 태스크 조회 (다중 담당자 포함)"""
    return (
        db.query(models.Task)
        .filter(models.Task.project_id == project_id)
        .options(
            joinedload(models.Task.task_assignees).joinedload(
                models.TaskAssignee.employee
            )
        )
        .order_by(models.Task.due_date.asc())
        .all()
    )


# =====================================================
# ✅ 단일 태스크 조회
# =====================================================
def get_task_by_id(db: Session, task_id: int):
    """태스크 ID로 조회"""
    return (
        db.query(models.Task)
        .filter(models.Task.task_id == task_id)
        .options(
            joinedload(models.Task.task_assignees).joinedload(
                models.TaskAssignee.employee
            )
        )
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
):
    """태스크 생성 + 담당자 연결 + 로그 + 알림"""
    try:
        new_task = models.Task(
            project_id=project_id,
            title=request.title.strip(),
            description=request.description,
            priority=request.priority,
            status=request.status or TaskStatus.TODO,
            parent_task_id=request.parent_task_id,
            start_date=request.start_date,
            due_date=request.due_date,
            estimate_hours=request.estimate_hours,
            progress=request.progress or 0,
        )
        db.add(new_task)
        db.flush()  # task_id 확보

        # ✅ 다중 담당자 연결
        if request.assignee_ids:
            for emp_id in request.assignee_ids:
                db.add(models.TaskAssignee(task_id=new_task.task_id, emp_id=emp_id))

        db.commit()
        db.refresh(new_task)

        # 🕓 활동 로그
        log_task_action(
            db=db,
            emp_id=creator_emp_id,
            project_id=project_id,
            task_id=new_task.task_id,
            action="task_created",
            detail=f"'{new_task.title}' 태스크 생성",
        )

        # 🔔 알림 전송 (담당자 전체)
        if request.assignee_ids:
            create_notifications(
                db=db,
                recipients=request.assignee_ids,
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
):
    """태스크 수정 + 로그 기록 + 담당자 변경 지원"""
    try:
        # 권한 확인 (기존 담당자 or 프로젝트 소유자)
        current_assignees = {a.emp_id for a in task.task_assignees}
        if (
            updater_emp_id not in current_assignees
            and updater_emp_id != task.project.owner_emp_id
        ):
            forbidden("태스크 담당자 또는 프로젝트 소유자만 수정할 수 있습니다.")

        update_data = request.model_dump(exclude_unset=True)

        # ✅ 변경 전 상태 기록 (로그용)
        before_progress = task.progress
        before_status = task.status

        # 일반 필드 수정
        for key, value in update_data.items():
            if key not in ["assignee_ids"]:
                setattr(task, key, value)

        # ✅ 담당자 동기화
        if "assignee_ids" in update_data:
            new_ids = set(update_data["assignee_ids"] or [])
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

        # ✅ 로그 메시지
        detail_msg = f"'{task.title}' 수정됨"
        if "progress" in update_data:
            detail_msg += f" (진행률: {update_data['progress']}%)"

        log_task_action(
            db=db,
            emp_id=updater_emp_id,
            project_id=task.project_id,
            task_id=task.task_id,
            action="task_updated",
            detail=detail_msg,
        )

        # ✅ 진행률 변경 시 알림 (다중 담당자)
        if "progress" in update_data:
            recipients = [
                a.emp_id for a in task.task_assignees if a.emp_id != updater_emp_id
            ]
            if recipients:
                create_notifications(
                    db=db,
                    recipients=recipients,
                    actor_emp_id=updater_emp_id,
                    project_id=task.project_id,
                    task_id=task.task_id,
                    ntype=NotificationType.status_change,
                    payload={"progress": update_data["progress"]},
                )

        return task

    except Exception as e:
        db.rollback()
        bad_request(f"태스크 수정 중 오류: {str(e)}")


# =====================================================
# ✅ 태스크 상태 변경
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

        # 🧾 상태 변경 이력 저장
        history_service.create_task_history(
            db=db,
            task_id=task.task_id,
            old_status=old_status,
            new_status=new_status,
            changed_by=actor_emp_id,
        )

        # 🔔 담당자 전체에게 알림 (다중)
        recipients = [a.emp_id for a in task.task_assignees if a.emp_id != actor_emp_id]
        if recipients:
            create_notifications(
                db=db,
                recipients=recipients,
                actor_emp_id=actor_emp_id,
                project_id=task.project_id,
                task_id=task.task_id,
                ntype=NotificationType.status_change,
                payload={"old_status": old_status, "new_status": new_status},
            )

        # 🕓 로그 기록
        log_task_action(
            db=db,
            emp_id=actor_emp_id,
            project_id=task.project_id,
            task_id=task.task_id,
            action="status_changed",
            detail=f"{old_status} → {new_status}",
        )

        return task

    except Exception as e:
        db.rollback()
        bad_request(f"태스크 상태 변경 중 오류: {str(e)}")


# =====================================================
# ✅ 태스크 삭제
# =====================================================
def delete_task(db: Session, task: models.Task, actor_emp_id: int):
    """태스크 삭제 + 로그 기록"""
    try:
        title = task.title
        current_assignees = {a.emp_id for a in task.task_assignees}

        # 권한 확인
        if (
            actor_emp_id not in current_assignees
            and actor_emp_id != task.project.owner_emp_id
        ):
            forbidden("태스크 담당자 또는 프로젝트 소유자만 삭제할 수 있습니다.")

        # 🕓 삭제 로그 (삭제 전)
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


# =====================================================
# ✅ WebSocket 상태 업데이트 (변경 없음)
# =====================================================
async def update_task_status(project_id: int, task_id: int, new_status: str):
    await notify_project(
        project_id,
        {
            "event": "task_updated",
            "payload": {"task_id": task_id, "status": new_status},
        },
    )
