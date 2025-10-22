# app/services/project_service.py
from __future__ import annotations
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session
from app import models
from app.models.enums import MemberRole, ProjectStatus, TaskPriority, TaskStatus


# ---------------------------------------------------------------------
# 내부 유틸: 프로젝트 OWNER 여부 확인
# ---------------------------------------------------------------------
def is_owner(db: Session, project_id: int, emp_id: int) -> bool:
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


# ---------------------------------------------------------------------
# 내부 유틸: 멤버가 없으면 자동 추가
# ---------------------------------------------------------------------
def ensure_member(
    db: Session,
    project_id: int,
    emp_id: int,
    role: MemberRole = MemberRole.MEMBER,
):
    exists = (
        db.query(models.ProjectMember)
        .filter(
            models.ProjectMember.project_id == project_id,
            models.ProjectMember.emp_id == emp_id,
        )
        .first()
    )
    if not exists:
        db.add(models.ProjectMember(project_id=project_id, emp_id=emp_id, role=role))


# ---------------------------------------------------------------------
# 내부 유틸: 트리형 태스크 재귀 생성
# ---------------------------------------------------------------------
def create_task_recursive(
    db: Session,
    project_id: int,
    creator_emp_id: int,
    node: Dict[str, Any],
    parent_task_id: Optional[int] = None,
) -> models.Task:
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
        status=TaskStatus.TODO,
        parent_task_id=parent_task_id,
        progress=node.get("progress") or 0,
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # 다중 담당자 등록
    assignee_ids: List[int] = node.get("assignee_ids") or []
    for eid in assignee_ids:
        db.add(models.TaskMember(task_id=task.task_id, emp_id=eid))
    db.commit()

    # 하위 태스크 재귀
    for child in (node.get("subtasks") or []):
        create_task_recursive(db, project_id, creator_emp_id, child, parent_task_id=task.task_id)

    return task


# ---------------------------------------------------------------------
# ✅ CRUD 서비스
# ---------------------------------------------------------------------
def get_all_projects(db: Session):
    return db.query(models.Project).order_by(models.Project.created_at.desc()).all()


def get_project_by_id(db: Session, project_id: int):
    return db.query(models.Project).filter(models.Project.project_id == project_id).first()


def create_project(db: Session, request, current_user: models.Employee):
    proj = models.Project(
        project_name=request.project_name.strip(),
        description=request.description,
        start_date=request.start_date,
        end_date=request.end_date,
        status=request.status or ProjectStatus.PLANNED,
        owner_emp_id=current_user.emp_id,
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)

    # OWNER 자동 등록
    ensure_member(db, proj.project_id, current_user.emp_id, MemberRole.OWNER)
    db.commit()
    return proj


def create_project_full(db: Session, payload: Dict[str, Any], current_user: models.Employee):
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
    db.commit()
    db.refresh(proj)

    # main_assignees를 멤버로 등록
    for eid in (payload.get("main_assignees") or []):
        ensure_member(db, proj.project_id, int(eid), MemberRole.MEMBER)
    db.commit()

    # 태스크 트리 생성
    for root in (payload.get("tasks") or []):
        create_task_recursive(db, proj.project_id, current_user.emp_id, root)

    db.commit()
    return proj


def update_project(db: Session, project_id: int, request, current_user: models.Employee):
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
    proj = get_project_by_id(db, project_id)
    if not proj:
        raise ValueError("삭제할 프로젝트를 찾을 수 없습니다.")
    if not is_owner(db, project_id, current_user.emp_id):
        raise PermissionError("프로젝트 소유자만 삭제할 수 있습니다.")

    db.delete(proj)
    db.commit()


def add_member(db: Session, project_id: int, member, current_user: models.Employee):
    if not is_owner(db, project_id, current_user.emp_id):
        raise PermissionError("프로젝트 소유자만 멤버 추가 가능")

    ensure_member(db, project_id, member.emp_id, member.role)
    db.commit()


def remove_member(db: Session, project_id: int, emp_id: int, current_user: models.Employee):
    if not is_owner(db, project_id, current_user.emp_id):
        raise PermissionError("프로젝트 소유자만 멤버 제거 가능")

    member = (
        db.query(models.ProjectMember)
        .filter(models.ProjectMember.project_id == project_id, models.ProjectMember.emp_id == emp_id)
        .first()
    )
    if not member:
        raise ValueError("해당 멤버를 찾을 수 없습니다.")
    if member.role == MemberRole.OWNER:
        raise PermissionError("프로젝트 소유자는 제거할 수 없습니다.")

    db.delete(member)
    db.commit()
