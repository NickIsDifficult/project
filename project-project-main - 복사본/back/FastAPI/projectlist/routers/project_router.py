# app/routers/project_router.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from core.auth import get_current_user
from core.exceptions import conflict, forbidden, not_found
from database import get_db
from services import project_service

router = APIRouter(prefix="/projects", tags=["projects"])


# -------------------------------
# 전체 프로젝트 조회
# -------------------------------
@router.get("/", response_model=list[schemas.project.Project])
def read_projects(db: Session = Depends(get_db)):
    """모든 프로젝트 목록 조회"""
    return project_service.get_all_projects(db)


# -------------------------------
# 프로젝트 상세 조회
# -------------------------------
@router.get("/{project_id}", response_model=schemas.project.Project)
def read_project(project_id: int, db: Session = Depends(get_db)):
    project = project_service.get_project_by_id(db, project_id)
    if not project:
        not_found(f"프로젝트 ID {project_id}를 찾을 수 없습니다.")
    return project


# -------------------------------
# 프로젝트 생성
# -------------------------------
@router.post("/", response_model=schemas.project.Project)
def create_project(
    request: schemas.project.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """현재 로그인한 직원이 프로젝트 생성"""
    new_project = project_service.create_project(
        db=db, request=request, owner_emp_id=current_user.emp_id
    )
    return new_project


# -------------------------------
# 프로젝트 수정
# -------------------------------
@router.put("/{project_id}", response_model=schemas.project.Project)
def update_project(
    project_id: int,
    request: schemas.project.ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    project = project_service.get_project_by_id(db, project_id)
    if not project:
        not_found("수정할 프로젝트를 찾을 수 없습니다.")

    if not project_service.is_project_owner(db, project_id, current_user.emp_id):
        forbidden("프로젝트 소유자만 수정할 수 있습니다.")

    return project_service.update_project(db, project, request)


# -------------------------------
# 프로젝트 삭제
# -------------------------------
@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    project = project_service.get_project_by_id(db, project_id)
    if not project:
        not_found(f"프로젝트 {project_id}를 찾을 수 없습니다.")

    if not project_service.is_project_owner(db, project_id, current_user.emp_id):
        forbidden("프로젝트 소유자만 삭제할 수 있습니다.")

    project_service.delete_project(db, project)
    return {"success": True, "message": f"프로젝트 {project_id} 삭제 완료"}


# -------------------------------
# 프로젝트 멤버 추가
# -------------------------------
@router.post("/{project_id}/members", response_model=schemas.project.ProjectMember)
def add_member(
    project_id: int,
    member: schemas.project.ProjectMemberBase,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    if not project_service.is_project_owner(db, project_id, current_user.emp_id):
        forbidden("프로젝트 소유자만 멤버를 추가할 수 있습니다.")
    return project_service.add_member(db, project_id, member)


# -------------------------------
# 프로젝트 멤버 제거
# -------------------------------
@router.delete("/{project_id}/members/{emp_id}")
def remove_member(
    project_id: int,
    emp_id: int,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    if not project_service.is_project_owner(db, project_id, current_user.emp_id):
        forbidden("프로젝트 소유자만 멤버를 제거할 수 있습니다.")

    project_service.remove_member(db, project_id, emp_id)
    return {
        "success": True,
        "message": f"직원 {emp_id} 프로젝트 {project_id}에서 제거됨",
    }
