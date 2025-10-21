# app/routers/project_router.py
from __future__ import annotations
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.utils.token import get_current_user
from app.models.enums import MemberRole, ProjectStatus, TaskPriority, TaskStatus
from app.services import project_service

router = APIRouter(prefix="/projects", tags=["projects"])


# ---------------------------------------------------------------------
# 공통 예외 유틸
# ---------------------------------------------------------------------
def _bad_request(msg: str):
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

def _not_found(msg: str):
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=msg)

def _forbidden(msg: str):
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=msg)


# ---------------------------------------------------------------------
# ✅ 프로젝트 목록
# ---------------------------------------------------------------------
@router.get("/", response_model=List[schemas.project.Project])
def list_projects(db: Session = Depends(get_db)):
    try:
        return project_service.get_all_projects(db)
    except Exception as e:
        _bad_request(f"프로젝트 목록 조회 실패: {e}")


# ---------------------------------------------------------------------
# ✅ 프로젝트 상세
# ---------------------------------------------------------------------
@router.get("/{project_id}", response_model=schemas.project.Project)
def get_project(project_id: int, db: Session = Depends(get_db)):
    try:
        return project_service.get_project_by_id(db, project_id)
    except Exception as e:
        _bad_request(f"프로젝트 상세 조회 실패: {e}")


# ---------------------------------------------------------------------
# ✅ 프로젝트 생성
# ---------------------------------------------------------------------
@router.post("/", response_model=schemas.project.Project)
def create_project(
    request: schemas.project.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    try:
        return project_service.create_project(db, request, current_user)
    except Exception as e:
        _bad_request(f"프로젝트 생성 실패: {e}")


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
    try:
        return project_service.update_project(db, project_id, request, current_user)
    except Exception as e:
        _bad_request(f"프로젝트 수정 실패: {e}")


# ---------------------------------------------------------------------
# ✅ 프로젝트 삭제
# ---------------------------------------------------------------------
@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    try:
        project_service.delete_project(db, project_id, current_user)
        return {"success": True, "message": f"프로젝트 {project_id} 삭제 완료"}
    except Exception as e:
        _bad_request(f"프로젝트 삭제 실패: {e}")


# ---------------------------------------------------------------------
# ✅ 프로젝트 멤버 관리
# ---------------------------------------------------------------------
@router.post("/{project_id}/members")
def add_member(
    project_id: int,
    member: schemas.project.ProjectMemberBase,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    try:
        project_service.add_project_member(db, project_id, member, current_user)
        return {"success": True}
    except Exception as e:
        _bad_request(f"멤버 추가 실패: {e}")


@router.delete("/{project_id}/members/{emp_id}")
def remove_member(
    project_id: int,
    emp_id: int,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    try:
        project_service.remove_project_member(db, project_id, emp_id, current_user)
        return {"success": True}
    except Exception as e:
        _bad_request(f"멤버 제거 실패: {e}")
