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
def get_tasks_by_project(db: Session, project_id: int):
    tasks = (
        db.query(models.Task)
        .options(
            joinedload(models.Task.taskmember).joinedload(models.TaskMember.employee),
        )
        .filter(models.Task.project_id == project_id)
        .order_by(models.Task.created_at.asc())
        .all()
    )

    task_map = {}
    for t in tasks:
        task_map[int(t.task_id)] = {
            "task_id": int(t.task_id),
            "project_id": int(t.project_id),
            "title": t.title,
            "description": t.description,
            "status": t.status,
            "priority": t.priority,
            "progress": t.progress,
            "start_date": t.start_date,
            "due_date": t.due_date,
            "parent_task_id": int(t.parent_task_id) if t.parent_task_id else None,
            "assignees": [
                {
                    "emp_id": m.employee.emp_id,
                    "name": m.employee.name,
                    "position": getattr(m.employee, "position", None),
                }
                for m in t.taskmember
            ],
            "subtask": [],
        }

    root_tasks: list[dict] = []
    for t in task_map.values():
        pid = t["parent_task_id"]
        if pid is not None and pid in task_map:
            task_map[pid]["subtask"].append(t)
        else:
            root_tasks.append(t)

    return root_tasks


# =====================================================
# ✅ 특정 부모 태스크의 하위업무 조회
# =====================================================
def get_subtasks_by_parent(db: Session, project_id: int, parent_task_id: int):
    tasks = (
        db.query(models.Task)
        .options(
            joinedload(models.Task.taskmember).joinedload(models.TaskMember.employee)
        )
        .filter(
            models.Task.project_id == project_id,
            models.Task.parent_task_id == parent_task_id,
        )
        .order_by(models.Task.created_at.asc())
        .all()
    )

    for t in tasks:
        t.subtask = []
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
    """태스크 생성 (+ 선택적으로 하위 태스크까지 재귀 생성)"""
    try:
        new_task = models.Task(
            project_id=project_id,
            title=request.title.strip() if request.title else "(제목 없음)",
            description=request.description,
            start_date=request.start_date,
            due_date=request.due_date,
            priority=request.priority,
            status=request.status or TaskStatus.PLANNED,
            parent_task_id=request.parent_task_id,
            estimate_hours=request.estimate_hours or 0.0,
            progress=request.progress or 0,
        )
        db.add(new_task)
        db.commit()
        db.refresh(new_task)
        return new_task

    except Exception as e:
        db.rollback()
        bad_request(f"태스크 생성 중 오류 발생: {str(e)}")


# =====================================================
# ✅ 태스크 수정 (담당자 반영 포함)
# =====================================================
def update_task(
    db: Session,
    task: models.Task,
    request: schemas.project.TaskUpdate,
    updater_emp_id: int,
) -> models.Task:
    """태스크 수정 + 담당자 동기화 + 로그 + 알림"""
    try:
        # 0️⃣ 요청 데이터 파싱
        try:
            update_data = request.dict(exclude_unset=True)
        except Exception:
            update_data = request.model_dump(exclude_unset=True)

        print("🧩 [update_task] update_data =", update_data)

        if not update_data:
            print("⚠️ update_data가 비어 있습니다. FastAPI 요청 바디를 확인하세요.")
            return task

        # 1️⃣ 권한 검사
        try:
            owner_id = getattr(task.project, "owner_emp_id", None)
            member_ids = [m.emp_id for m in getattr(task, "taskmember", [])]
            if updater_emp_id not in [owner_id] + member_ids:
                forbidden("담당자 또는 프로젝트 소유자만 수정 가능합니다.")
        except Exception as e:
            print("⚠️ 권한 검사 중 오류:", e)

        # 2️⃣ 담당자 동기화
        assignee_ids = update_data.pop("assignee_ids", None)
        if assignee_ids is not None:
            new_ids = {int(i) for i in assignee_ids if i}
            old_ids = {m.emp_id for m in (task.taskmember or [])}

            # 삭제
            if old_ids - new_ids:
                (
                    db.query(models.TaskMember)
                    .filter(
                        models.TaskMember.task_id == task.task_id,
                        models.TaskMember.emp_id.in_(list(old_ids - new_ids)),
                    )
                    .delete(synchronize_session=False)
                )

            # 추가
            for emp_id in new_ids - old_ids:
                db.add(models.TaskMember(task_id=task.task_id, emp_id=emp_id))

        # 3️⃣ 필드 매핑 변환
        key_mapping = {
            "end_date": "due_date",  # ✅ 프론트 호환
        }

        for key, value in update_data.items():
            mapped_key = key_mapping.get(key, key)
            if hasattr(task, mapped_key):
                setattr(task, mapped_key, value)
                print(f"🔧 [update_task] {mapped_key} → {value}")

        # 4️⃣ DB 반영
        db.add(task)  # ✅ 세션에 명시적으로 추가
        db.commit()
        db.refresh(task)
        print(f"✅ [update_task] Task {task.task_id} 수정 완료 (due_date={task.due_date})")

        # 5️⃣ 로그 기록
        log_task_action(
            db=db,
            emp_id=updater_emp_id,
            project_id=task.project_id,
            task_id=task.task_id,
            action="task_updated",
            detail=f"'{task.title}' 수정됨",
        )

        # 6️⃣ 진행률 변경 시 알림
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

        # 7️⃣ 최신 상태로 반환
        return (
            db.query(models.Task)
            .options(
                joinedload(models.Task.taskmember).joinedload(models.TaskMember.employee),
                joinedload(models.Task.subtasks),
            )
            .filter(models.Task.task_id == task.task_id)
            .first()
        )

    except Exception as e:
        db.rollback()
        print(f"❌ [update_task] 예외 발생: {e}")
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

        history_service.create_task_history(
            db=db,
            task_id=task.task_id,
            old_status=old_status,
            new_status=new_status,
            changed_by=actor_emp_id,
        )

        log_task_action(
            db=db,
            emp_id=actor_emp_id,
            project_id=task.project_id,
            task_id=task.task_id,
            action="status_changed",
            detail=f"{old_status} → {new_status}",
        )

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
