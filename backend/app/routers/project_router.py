# app/routers/project_router.py
from __future__ import annotations
from typing import List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
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
    request: schemas.project.ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """프로젝트 수정 (OWNER만 가능)"""
    try:
        return project_service.update_project(db, project_id, request, current_user)
    except PermissionError as e:
        _error(str(e), status.HTTP_403_FORBIDDEN)
    except Exception as e:
        _error(f"프로젝트 수정 실패: {str(e)}")


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
        return project_service.update_task_status(db, project_id, task_id, new_status, current_user.emp_id)
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
        return project_service.update_task_progress(db, project_id, task_id, progress, current_user.emp_id)
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
