# app/routers/project_router.py
from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.database import get_db
from app.schemas.project import Project as ProjectSchema
from app.services import project_service
from app.utils.token import get_current_user

router = APIRouter(prefix="/projects", tags=["projects"])


# =====================================================
# 🧩 공통 에러 응답 헬퍼
# =====================================================
def _error(msg: str, code: int = status.HTTP_400_BAD_REQUEST):
    raise HTTPException(status_code=code, detail=msg)


# =====================================================
# ✅ 프로젝트 목록
# =====================================================
@router.get("/", response_model=List[schemas.project.Project])
def list_projects(db: Session = Depends(get_db)):
    """모든 프로젝트 목록"""
    try:
        return project_service.get_all_projects(db)
    except Exception as e:
        _error(f"프로젝트 목록 조회 실패: {str(e)}")


# =====================================================
# ✅ 프로젝트 상세
# =====================================================
@router.get("/{project_id}", response_model=schemas.project.Project)
def get_project(project_id: int, db: Session = Depends(get_db)):
    """프로젝트 상세 조회"""
    proj = project_service.get_project_by_id(db, project_id)
    if not proj:
        _error("프로젝트를 찾을 수 없습니다.", status.HTTP_404_NOT_FOUND)
    return proj


def get_project_by_id(db: Session, project_id: int):
    """프로젝트 + 업무 계층 트리 구조로 조회"""
    project = (
        db.query(ProjectModel)
        .options(
            joinedload(ProjectModel.task).joinedload(TaskModel.subtask),
            joinedload(ProjectModel.attachment),  # ✅ 첨부파일까지 로드
        )
        .filter(ProjectModel.project_id == project_id)
        .first()
    )
    if not project:
        return None

    # ✅ 프로젝트 내 모든 task 조회
    tasks = db.query(TaskModel).filter(TaskModel.project_id == project_id).all()

    # ✅ 트리 구성
    task_dict = {t.task_id: t for t in tasks}

    for task in tasks:
        if task.parent_task_id:
            parent = task_dict.get(task.parent_task_id)
            if parent:
                if not hasattr(parent, "subtask"):
                    parent.subtask = []
                parent.subtask.append(task)

    # ✅ 루트 태스크만 남기기
    project.task = [t for t in tasks if t.parent_task_id is None]

    # ✅ FastAPI 직렬화를 위해 반드시 반환은 ORM 객체 그대로 (ProjectModel)
    return project


# =====================================================
# ✅ 프로젝트 생성
# =====================================================
@router.post("/", response_model=schemas.project.Project)
def create_project(
    request: schemas.project.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """단일 프로젝트 생성"""
    try:
        return project_service.create_project(db, request, current_user)
    except Exception as e:
        _error(f"프로젝트 생성 실패: {str(e)}")


# =====================================================
# ✅ 프로젝트 + 태스크 트리 동시 생성
# =====================================================
@router.post("/full-create", response_model=schemas.project.Project)
def create_project_full(
    payload: schemas.project.ProjectFullCreateRequest,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """프로젝트 + 하위업무 트리 전체 생성"""
    try:
        return project_service.create_project_full(db, payload.dict(), current_user)
    except Exception as e:
        _error(f"프로젝트 Full 생성 실패: {str(e)}")


# =====================================================
# ✅ 프로젝트 수정
# =====================================================
@router.put("/{project_id}", response_model=schemas.project.Project)
def update_project(
    project_id: int,
    data: schemas.project.ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    db_project = db.query(models.Project).filter(models.Project.project_id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")

    update_data = data.dict(exclude_unset=True)

    # 🔹 1. 필드 갱신 (assignee_ids 제외)
    for key, value in update_data.items():
        if key in [
            "task",
            "attachments",
            "projectmember",
            "taskcomment",
            "milestone",
            "assignee_ids",
        ]:
            continue
        setattr(db_project, key, value)

    # 🔹 2. 프로젝트 담당자(assignee_ids) 동기화
    if "assignee_ids" in update_data:
        new_ids = [int(i) for i in update_data.get("assignee_ids") or []]
        old_ids = (
            {m.emp_id for m in db_project.projectmember} if db_project.projectmember else set()
        )

        # 삭제
        for m in list(db_project.projectmember or []):
            if m.emp_id not in new_ids:
                db.delete(m)

        # 추가
        for emp_id in new_ids:
            if emp_id not in old_ids:
                db.add(models.ProjectMember(project_id=db_project.project_id, emp_id=emp_id))

    # 🔹 3. 태스크 갱신
    if "task" in update_data:
        for t_data in update_data["task"]:
            db_task = db.query(models.Task).filter(models.Task.task_id == t_data["task_id"]).first()
            if db_task:
                for field, val in t_data.items():
                    if field in [
                        "task_id",
                        "project_id",
                        "assignee_ids",  # ✅ 읽기 전용 속성
                        "taskmember",
                        "taskcomment",
                        "subtask",
                        "attachments",
                    ]:
                        continue
                    if hasattr(db_task, field):
                        try:
                            setattr(db_task, field, val)
                        except AttributeError:
                            continue
            else:
                # ✅ 새로운 Task 생성 전 불필요 필드 제거
                t_data.pop("assignee_ids", None)
                t_data.pop("taskmember", None)
                t_data.pop("subtask", None)
                t_data.pop("attachments", None)
                t_data.pop("taskcomment", None)

                new_task = models.Task(**t_data)
                new_task.project_id = project_id
                db.add(new_task)

    # 🔹 4. 첨부파일 갱신
    if "attachments" in update_data:
        for a_data in update_data["attachments"]:
            db_attach = (
                db.query(models.Attachment)
                .filter(models.Attachment.attachment_id == a_data["attachment_id"])
                .first()
            )
            if db_attach:
                for field, val in a_data.items():
                    if hasattr(db_attach, field):
                        setattr(db_attach, field, val)
            else:
                new_attach = models.Attachment(**a_data)
                new_attach.project_id = project_id
                db.add(new_attach)

    # 🔹 5. 커밋 및 갱신
    db.commit()
    db.refresh(db_project)

    db_project = (
        db.query(models.Project)
        .options(
            joinedload(models.Project.task)
            .joinedload(models.Task.subtasks)
            .joinedload(models.Task.attachments),
            joinedload(models.Project.attachments),
            joinedload(models.Project.projectmember),
        )
        .filter(models.Project.project_id == project_id)
        .first()
    )

    return ProjectSchema.model_validate(db_project, from_attributes=True)


# =====================================================
# ✅ 프로젝트 삭제
# =====================================================
@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """프로젝트 삭제 (OWNER만 가능)"""
    try:
        project_service.delete_project(db, project_id, current_user)
        return {"success": True, "message": f"프로젝트 {project_id} 삭제 완료"}
    except PermissionError as e:
        _error(str(e), status.HTTP_403_FORBIDDEN)
    except Exception as e:
        _error(f"프로젝트 삭제 실패: {str(e)}")


# =====================================================
# ✅ 프로젝트 멤버 추가 / 삭제
# =====================================================
@router.post("/{project_id}/members")
def add_member(
    project_id: int,
    member: schemas.project.ProjectMemberBase,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """프로젝트 멤버 추가 (OWNER만 가능)"""
    try:
        project_service.add_member(db, project_id, member, current_user)
        return {"success": True}
    except PermissionError as e:
        _error(str(e), status.HTTP_403_FORBIDDEN)
    except Exception as e:
        _error(f"멤버 추가 실패: {str(e)}")


@router.delete("/{project_id}/members/{emp_id}")
def remove_member(
    project_id: int,
    emp_id: int,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """프로젝트 멤버 제거 (OWNER만 가능)"""
    try:
        project_service.remove_member(db, project_id, emp_id, current_user)
        return {"success": True}
    except PermissionError as e:
        _error(str(e), status.HTTP_403_FORBIDDEN)
    except Exception as e:
        _error(f"멤버 제거 실패: {str(e)}")


# =====================================================
# ✅ 태스크 상태 변경
# =====================================================
@router.patch("/{project_id}/tasks/{task_id}/status", response_model=schemas.project.Task)
def update_task_status(
    project_id: int,
    task_id: int,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """업무 상태 변경"""
    try:
        new_status = payload.get("status")
        return project_service.update_task_status(
            db, project_id, task_id, new_status, current_user.emp_id
        )
    except Exception as e:
        _error(f"태스크 상태 변경 실패: {str(e)}")


# =====================================================
# ✅ 태스크 진행률 변경
# =====================================================
@router.patch("/{project_id}/tasks/{task_id}/progress", response_model=schemas.project.Task)
def update_task_progress(
    project_id: int,
    task_id: int,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """업무 진행률 변경"""
    try:
        progress = payload.get("progress")
        return project_service.update_task_progress(
            db, project_id, task_id, progress, current_user.emp_id
        )
    except Exception as e:
        _error(f"태스크 진행률 변경 실패: {str(e)}")


# =====================================================
# ✅ 활동 로그 조회
# =====================================================
@router.get("/{project_id}/activity", response_model=List[schemas.project.ActivityLog])
def list_activity_logs(
    project_id: int,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """프로젝트 활동 로그 조회"""
    try:
        return project_service.list_activity_logs(db, project_id, limit)
    except Exception as e:
        _error(f"활동 로그 조회 실패: {str(e)}")


# =====================================================
# ✅ 태스크 트리 조회
# =====================================================
@router.get("/{project_id}/tasks/tree", response_model=List[schemas.project.TaskTree])
def get_task_tree(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """프로젝트의 트리형 업무 구조 조회"""
    try:
        return project_service.list_task_tree(db, project_id)
    except Exception as e:
        _error(f"태스크 트리 조회 실패: {str(e)}")
