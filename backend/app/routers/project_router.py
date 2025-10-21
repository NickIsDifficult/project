# app/routers/project_router.py
from __future__ import annotations
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.utils.token import get_current_user
from app.models.enums import MemberRole, ProjectStatus, TaskPriority, TaskStatus

router = APIRouter(prefix="/projects", tags=["projects"])

# ---------------------------------------------------------------------
# 내부 유틸: 공통 에러
# ---------------------------------------------------------------------
def _bad_request(msg: str):
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

def _not_found(msg: str):
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=msg)

def _forbidden(msg: str):
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=msg)

# ---------------------------------------------------------------------
# 내부 유틸: 프로젝트 소유자 체크
# ---------------------------------------------------------------------
def _is_owner(db: Session, project_id: int, emp_id: int) -> bool:
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
# 내부 유틸: 프로젝트 멤버 보장 (없으면 추가)
# ---------------------------------------------------------------------
def _ensure_project_member(db: Session, project_id: int, emp_id: int, role: MemberRole = MemberRole.MEMBER):
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
# node 예시:
# {
#   "title": "...",
#   "description": "...",
#   "start_date": "YYYY-MM-DD" | null,
#   "due_date": "YYYY-MM-DD" | null,
#   "priority": "LOW|MEDIUM|HIGH|URGENT",
#   "progress": 0,
#   "assignee_ids": [1,2,3],
#   "subtasks": [ { ... }, { ... } ]
# }
# ---------------------------------------------------------------------
def _create_task_recursive(
    db: Session,
    project_id: int,
    creator_emp_id: int,
    node: Dict[str, Any],
    parent_task_id: Optional[int] = None,
) -> models.Task:
    # 기본값/정규화
    title = (node.get("title") or "").strip()
    if not title:
        _bad_request("태스크 제목이 비어 있습니다.")
    description = node.get("description")
    start_date = node.get("start_date")
    due_date = node.get("due_date")
    priority = node.get("priority") or TaskPriority.MEDIUM
    progress = node.get("progress") or 0
    assignee_ids: List[int] = node.get("assignee_ids") or []
    subtasks = node.get("subtasks") or []

    # 메인 단일 담당자(있다면 리스트의 첫 번째) — 옵션
    main_assignee = assignee_ids[0] if assignee_ids else None

    # 태스크 생성
    task = models.Task(
        project_id=project_id,
        title=title,
        description=description,
        start_date=start_date,
        due_date=due_date,
        priority=priority,
        status=TaskStatus.TODO,
        parent_task_id=parent_task_id,
        progress=progress,
        assignee_emp_id=main_assignee,  # 단일 필드(있으면)
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # 다중 담당자 매핑 (task_member)
    if assignee_ids:
        for eid in assignee_ids:
            db.add(models.TaskMember(task_id=task.task_id, emp_id=eid))
        db.commit()

    # 하위업무 재귀
    for child in subtasks:
        _create_task_recursive(db, project_id, creator_emp_id, child, parent_task_id=task.task_id)

    return task

# ---------------------------------------------------------------------
# ✅ 프로젝트 목록
# ---------------------------------------------------------------------
@router.get("/", response_model=List[schemas.project.Project])
def list_projects(db: Session = Depends(get_db)):
    return db.query(models.Project).order_by(models.Project.created_at.desc()).all()

# ---------------------------------------------------------------------
# ✅ 프로젝트 상세
# ---------------------------------------------------------------------
@router.get("/{project_id}", response_model=schemas.project.Project)
def get_project(project_id: int, db: Session = Depends(get_db)):
    proj = (
        db.query(models.Project)
        .filter(models.Project.project_id == project_id)
        .first()
    )
    if not proj:
        _not_found(f"프로젝트 {project_id}를 찾을 수 없습니다.")
    return proj

# ---------------------------------------------------------------------
# ✅ (기본) 프로젝트만 생성
# ---------------------------------------------------------------------
@router.post("/", response_model=schemas.project.Project)
def create_project_only(
    request: schemas.project.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    try:
        proj = models.Project(
            project_name=(request.project_name or "").strip(),
            description=request.description,
            start_date=request.start_date,
            end_date=request.end_date,
            status=request.status or ProjectStatus.PLANNED,
            owner_emp_id=current_user.emp_id,
        )
        db.add(proj)
        db.commit()
        db.refresh(proj)

        # 소유자 = OWNER 멤버 등록
        _ensure_project_member(db, proj.project_id, current_user.emp_id, MemberRole.OWNER)
        db.commit()

        return proj
    except Exception as e:
        db.rollback()
        _bad_request(f"프로젝트 생성 실패: {str(e)}")

# ---------------------------------------------------------------------
# 🔥 풀 생성: 프로젝트 + main_assignees + 태스크/하위업무 + task_member
# ---------------------------------------------------------------------
@router.post("/full-create", response_model=schemas.project.Project)
def create_project_full(
    request: Dict[str, Any],  # 프론트 payload 그대로 받기 (유연)
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    # payload 검증(최소 필수)
    project_name = (request.get("project_name") or "").strip()
    if not project_name:
        _bad_request("project_name이 비어 있습니다.")

    try:
        # 1) 프로젝트 생성
        proj = models.Project(
            project_name=project_name,
            description=request.get("description"),
            start_date=request.get("start_date"),
            end_date=request.get("end_date"),
            status=request.get("status") or ProjectStatus.PLANNED,
            owner_emp_id=current_user.emp_id,
        )
        db.add(proj)
        db.commit()
        db.refresh(proj)

        # 2) 프로젝트 멤버: 소유자 + main_assignees
        for emp_id in (request.get("main_assignees") or []):
            _ensure_project_member(db, proj.project_id, int(emp_id), MemberRole.MEMBER)
        db.commit()

        # 3) 태스크 트리 생성
        for root in (request.get("tasks") or []):
            _create_task_recursive(
                db=db,
                project_id=proj.project_id,
                creator_emp_id=current_user.emp_id,
                node=root,
                parent_task_id=None,
            )

        db.commit()
        return proj

    except Exception as e:
        db.rollback()
        _bad_request(f"full-create 실패: {str(e)}")

# ---------------------------------------------------------------------
# ✅ 프로젝트 수정
# ---------------------------------------------------------------------
@router.put("/{project_id}", response_model=schemas.project.Project)
def update_project(
    project_id: int,
    request: schemas.project.ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    proj = (
        db.query(models.Project)
        .filter(models.Project.project_id == project_id)
        .first()
    )
    if not proj:
        _not_found("수정할 프로젝트를 찾을 수 없습니다.")
    if not _is_owner(db, project_id, current_user.emp_id):
        _forbidden("프로젝트 소유자만 수정할 수 있습니다.")

    try:
        data = request.model_dump(exclude_unset=True)
        for k, v in data.items():
            setattr(proj, k, v)
        db.commit()
        db.refresh(proj)
        return proj
    except Exception as e:
        db.rollback()
        _bad_request(f"프로젝트 수정 실패: {str(e)}")

# ---------------------------------------------------------------------
# ✅ 프로젝트 삭제
# ---------------------------------------------------------------------
@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    proj = (
        db.query(models.Project)
        .filter(models.Project.project_id == project_id)
        .first()
    )
    if not proj:
        _not_found(f"프로젝트 {project_id}를 찾을 수 없습니다.")
    if not _is_owner(db, project_id, current_user.emp_id):
        _forbidden("프로젝트 소유자만 삭제할 수 있습니다.")

    try:
        # 종속 데이터 정리 (FK CASCADE 걸려있어도 안전하게)
        db.query(models.Task).filter(models.Task.project_id == project_id).delete()
        db.query(models.ProjectMember).filter(models.ProjectMember.project_id == project_id).delete()
        db.delete(proj)
        db.commit()
        return {"success": True, "message": f"프로젝트 {project_id} 삭제 완료"}
    except Exception as e:
        db.rollback()
        _bad_request(f"프로젝트 삭제 실패: {str(e)}")

# ---------------------------------------------------------------------
# ✅ (옵션) 프로젝트 멤버 추가/삭제 API (원래 라우터에 있었다면 유지)
# ---------------------------------------------------------------------
@router.post("/{project_id}/members")
def add_member(
    project_id: int,
    member: schemas.project.ProjectMemberBase,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    if not _is_owner(db, project_id, current_user.emp_id):
        _forbidden("프로젝트 소유자만 멤버를 추가할 수 있습니다.")
    try:
        _ensure_project_member(db, project_id, member.emp_id, member.role or MemberRole.MEMBER)
        db.commit()
        return {"success": True}
    except Exception as e:
        db.rollback()
        _bad_request(f"멤버 추가 실패: {str(e)}")

@router.delete("/{project_id}/members/{emp_id}")
def remove_member(
    project_id: int,
    emp_id: int,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    if not _is_owner(db, project_id, current_user.emp_id):
        _forbidden("프로젝트 소유자만 멤버를 제거할 수 있습니다.")

    member = (
        db.query(models.ProjectMember)
        .filter(
            models.ProjectMember.project_id == project_id,
            models.ProjectMember.emp_id == emp_id,
        )
        .first()
    )
    if not member:
        _not_found("해당 멤버를 찾을 수 없습니다.")
    if member.role == MemberRole.OWNER:
        _forbidden("프로젝트 소유자는 제거할 수 없습니다.")

    try:
        db.delete(member)
        db.commit()
        return {"success": True}
    except Exception as e:
        db.rollback()
        _bad_request(f"멤버 제거 실패: {str(e)}")
