# app/services/project_service.py
from __future__ import annotations

from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError

from app import models
from app.models.enums import (
    MemberRole,
    ProjectStatus,
    TaskPriority,
    TaskStatus,
    ActivityAction,
)


# =====================================================
# 🔹 내부 유틸: 프로젝트 OWNER 여부 확인
# =====================================================
def is_owner(db: Session, project_id: int, emp_id: int) -> bool:
    """현재 사용자가 해당 프로젝트의 OWNER인지 확인"""
    rec = (
        db.query(models.ProjectMember)
        .filter(
            models.ProjectMember.project_id == project_id,
            models.ProjectMember.emp_id == emp_id,
            models.ProjectMember.role == MemberRole.OWNER,
        )
        .first()
    )
    return rec is not None


# =====================================================
# 🔹 내부 유틸: 멤버 자동 추가
# =====================================================
def ensure_member(
    db: Session,
    project_id: int,
    emp_id: int,
    role: MemberRole = MemberRole.MEMBER,
):
    """프로젝트 멤버가 없으면 자동 추가"""
    exists = (
        db.query(models.ProjectMember)
        .filter(
            models.ProjectMember.project_id == project_id,
            models.ProjectMember.emp_id == emp_id,
        )
        .first()
    )
    if exists:
        if role == MemberRole.OWNER and exists.role != MemberRole.OWNER:
            exists.role = MemberRole.OWNER
        return exists

    member = models.ProjectMember(
        project_id=project_id,
        emp_id=emp_id,
        role=role,
    )
    db.add(member)
    db.flush()  # 즉시 task_member 등에서 참조 가능하도록
    return member


# =====================================================
# 🔹 내부 유틸: 트리형 태스크 재귀 생성
# =====================================================
def create_task_recursive(
    db: Session,
    project_id: int,
    creator_emp_id: int,
    node: Dict[str, Any],
    parent_task_id: Optional[int] = None,
) -> models.Task:
    """태스크 및 하위 태스크를 재귀적으로 생성"""
    title = (node.get("title") or "").strip()
    if not title:
        raise ValueError("태스크 제목이 비어 있습니다.")

    task = models.Task(
        project_id=project_id,
        title=title,
        description=node.get("description"),
        start_date=node.get("start_date"),
        due_date=node.get("due_date"),
        priority=node.get("priority") or TaskPriority.MEDIUM,
        status=node.get("status") or TaskStatus.PLANNED,
        parent_task_id=parent_task_id,
        progress=node.get("progress") or 0,
    )
    db.add(task)
    db.flush()

    # ✅ 다중 담당자 등록 + 프로젝트 멤버 자동 포함
    for eid in node.get("assignee_ids") or []:
        db.add(models.TaskMember(task_id=task.task_id, emp_id=eid))
        ensure_member(db, project_id, eid, MemberRole.MEMBER)

    db.flush()

    # ✅ 하위 태스크 재귀 생성
    for child in node.get("subtasks") or []:
        create_task_recursive(db, project_id, creator_emp_id, child, parent_task_id=task.task_id)

    return task


# =====================================================
# ✅ 프로젝트 CRUD
# =====================================================
def get_all_projects(db: Session):
    """모든 프로젝트 목록 + 소유자 이름(owner_name) 포함"""
    projects = (
        db.query(models.Project)
        .options(joinedload(models.Project.employee))
        .order_by(models.Project.created_at.desc())
        .all()
    )

    for proj in projects:
        proj.owner_name = proj.employee.name if proj.employee else None

    return projects


def get_project_by_id(db: Session, project_id: int):
    """단일 프로젝트 조회"""
    return (
        db.query(models.Project)
        .filter(models.Project.project_id == project_id)
        .first()
    )


def create_project(db: Session, request, current_user: models.Employee):
    """단일 프로젝트 생성"""
    proj = models.Project(
        project_name=request.project_name.strip(),
        description=request.description,
        start_date=request.start_date,
        end_date=request.end_date,
        status=request.status or ProjectStatus.PLANNED,
        owner_emp_id=current_user.emp_id,
    )
    db.add(proj)
    db.flush()

    ensure_member(db, proj.project_id, current_user.emp_id, MemberRole.OWNER)
    db.commit()
    db.refresh(proj)
    return proj


def create_project_full(db: Session, payload: Dict[str, Any], current_user: models.Employee):
    """프로젝트 + 태스크 트리 전체 생성"""
    try:
        project_name = (payload.get("project_name") or "").strip()
        if not project_name:
            raise ValueError("project_name이 비어 있습니다.")

        proj = models.Project(
            project_name=project_name,
            description=payload.get("description"),
            start_date=payload.get("start_date"),
            end_date=payload.get("end_date"),
            status=payload.get("status") or ProjectStatus.PLANNED,
            owner_emp_id=current_user.emp_id,
        )
        db.add(proj)
        db.flush()

        # OWNER 자동 등록
        ensure_member(db, proj.project_id, current_user.emp_id, MemberRole.OWNER)

        # 메인 담당자 멤버 추가
        for eid in payload.get("main_assignees") or []:
            ensure_member(db, proj.project_id, int(eid), MemberRole.MEMBER)

        db.flush()

        # 태스크 트리 생성
        for root in payload.get("tasks") or []:
            create_task_recursive(db, proj.project_id, current_user.emp_id, root)

        # Activity Log 기록
        db.add(models.ActivityLog(
            project_id=proj.project_id,
            emp_id=current_user.emp_id,
            action=ActivityAction.project_created,
            detail=f"프로젝트 생성: {proj.project_name}"
        ))

        db.commit()
        db.refresh(proj)
        return proj

    except SQLAlchemyError as e:
        db.rollback()
        raise e


def update_project(db: Session, project_id: int, request, current_user: models.Employee):
    """프로젝트 수정 (OWNER만 가능)"""
    proj = get_project_by_id(db, project_id)
    if not proj:
        raise ValueError("수정할 프로젝트를 찾을 수 없습니다.")
    if not is_owner(db, project_id, current_user.emp_id):
        raise PermissionError("프로젝트 소유자만 수정할 수 있습니다.")

    data = request.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(proj, k, v)

    db.commit()
    db.refresh(proj)
    return proj


def delete_project(db: Session, project_id: int, current_user: models.Employee):
    """프로젝트 삭제 (OWNER만 가능)"""
    proj = get_project_by_id(db, project_id)
    if not proj:
        raise ValueError("삭제할 프로젝트를 찾을 수 없습니다.")
    if not is_owner(db, project_id, current_user.emp_id):
        raise PermissionError("프로젝트 소유자만 삭제할 수 있습니다.")

    db.delete(proj)
    db.commit()


# =====================================================
# ✅ 프로젝트 멤버 관리
# =====================================================
def add_member(db: Session, project_id: int, member, current_user: models.Employee):
    """프로젝트 멤버 추가 (OWNER만 가능)"""
    if not is_owner(db, project_id, current_user.emp_id):
        raise PermissionError("프로젝트 소유자만 멤버 추가 가능")

    ensure_member(db, project_id, member.emp_id, member.role)
    db.commit()


def remove_member(db: Session, project_id: int, emp_id: int, current_user: models.Employee):
    """프로젝트 멤버 제거 (OWNER만 가능)"""
    if not is_owner(db, project_id, current_user.emp_id):
        raise PermissionError("프로젝트 소유자만 멤버 제거 가능")

    member = (
        db.query(models.ProjectMember)
        .filter(
            models.ProjectMember.project_id == project_id,
            models.ProjectMember.emp_id == emp_id,
        )
        .first()
    )
    if not member:
        raise ValueError("해당 멤버를 찾을 수 없습니다.")
    if member.role == MemberRole.OWNER:
        raise PermissionError("프로젝트 소유자는 제거할 수 없습니다.")

    db.delete(member)
    db.commit()


# =====================================================
# ✅ 태스크 상태 / 진행률 변경 + 활동 로그
# =====================================================
def update_task_status(db: Session, project_id: int, task_id: int, new_status: str, emp_id: int):
    task = (
        db.query(models.Task)
        .filter(models.Task.project_id == project_id, models.Task.task_id == task_id)
        .first()
    )
    if not task:
        raise ValueError("해당 업무를 찾을 수 없습니다.")
    if new_status not in TaskStatus.__members__:
        raise ValueError(f"잘못된 상태 값: {new_status}")

    old_status = task.status
    task.status = TaskStatus[new_status]
    db.flush()

    db.add(models.TaskHistory(
        task_id=task.task_id,
        old_status=old_status,
        new_status=task.status,
        changed_by=emp_id,
    ))
    db.add(models.ActivityLog(
        project_id=project_id,
        task_id=task.task_id,
        emp_id=emp_id,
        action=ActivityAction.status_changed,
        detail=f"상태 변경: {old_status.value} → {task.status.value}"
    ))

    db.commit()
    db.refresh(task)
    return task


def update_task_progress(db: Session, project_id: int, task_id: int, progress: int, emp_id: int):
    task = (
        db.query(models.Task)
        .filter(models.Task.project_id == project_id, models.Task.task_id == task_id)
        .first()
    )
    if not task:
        raise ValueError("해당 업무를 찾을 수 없습니다.")
    if not (0 <= progress <= 100):
        raise ValueError("진행률은 0~100 사이여야 합니다.")

    old_progress = task.progress
    task.progress = progress

    db.add(models.ActivityLog(
        project_id=project_id,
        task_id=task.task_id,
        emp_id=emp_id,
        action=ActivityAction.progress_changed,
        detail=f"진행률 변경: {old_progress}% → {progress}%"
    ))

    db.commit()
    db.refresh(task)
    return task


# =====================================================
# ✅ 활동 로그 조회
# =====================================================
def list_activity_logs(db: Session, project_id: int, limit: int = 50):
    """프로젝트별 활동 로그 조회 (최신순)"""
    logs = (
        db.query(models.ActivityLog)
        .filter(models.ActivityLog.project_id == project_id)
        .order_by(models.ActivityLog.created_at.desc())
        .limit(limit)
        .all()
    )
    return logs


# =====================================================
# ✅ 태스크 트리 조회
# =====================================================
def list_task_tree(db: Session, project_id: int) -> List[Dict[str, Any]]:
    """
    프로젝트의 태스크 트리 구조 반환
    - 각 Task에 subtasks 포함
    """
    def build_tree(tasks, parent_id=None):
        tree = []
        for t in tasks:
            if t.parent_task_id == parent_id:
                node = {
                    "task_id": t.task_id,
                    "project_id": t.project_id,
                    "title": t.title,
                    "description": t.description,
                    "status": t.status.value if t.status else None,
                    "priority": t.priority.value if t.priority else None,
                    "start_date": t.start_date,
                    "due_date": t.due_date,
                    "progress": t.progress,
                    "assignees": [
                        {"emp_id": m.emp_id, "name": m.employee.name if m.employee else None}
                        for m in t.taskmember
                    ],
                    "subtasks": build_tree(tasks, t.task_id),
                }
                tree.append(node)
        return tree

    tasks = (
        db.query(models.Task)
        .options(
            joinedload(models.Task.taskmember).joinedload(models.TaskMember.employee),
        )
        .filter(models.Task.project_id == project_id)
        .all()
    )
    return build_tree(tasks)
