# app/routers/milestone_router.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from projectlist import models, schemas
from projectlist.core.auth import get_current_user
from projectlist.core.exceptions import conflict, forbidden, not_found
from projectlist.database import get_db
from projectlist.models.project import MilestoneStatus
from projectlist.services import milestone_service

router = APIRouter(prefix="/projects/{project_id}/milestones", tags=["milestones"])


# -------------------------------
# 마일스톤 목록 조회
# -------------------------------
@router.get("/", response_model=list[schemas.project.Milestone])
def get_milestones(project_id: int, db: Session = Depends(get_db)):
    # ✅ 자동 상태 업데이트 (서비스 계층으로 분리)
    milestone_service.auto_update_missed_milestones(db, project_id)
    return milestone_service.get_milestones(db, project_id)


# -------------------------------
# 마일스톤 생성
# -------------------------------
@router.post("/", response_model=schemas.project.Milestone)
def create_milestone(
    project_id: int,
    request: schemas.project.MilestoneCreate,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    return milestone_service.create_milestone(db, project_id, request, current_user)


# -------------------------------
# 마일스톤 수정
# -------------------------------
@router.put("/{milestone_id}", response_model=schemas.project.Milestone)
def update_milestone(
    project_id: int,
    milestone_id: int,
    request: schemas.project.MilestoneBase,
    db: Session = Depends(get_db),
):
    return milestone_service.update_milestone(db, project_id, milestone_id, request)


# -------------------------------
# 마일스톤 상태 변경
# -------------------------------
@router.patch("/{milestone_id}/status", response_model=schemas.project.Milestone)
def change_milestone_status(
    project_id: int,
    milestone_id: int,
    status: MilestoneStatus,
    db: Session = Depends(get_db),
):
    return milestone_service.change_status(db, project_id, milestone_id, status)


# -------------------------------
# 마일스톤 삭제
# -------------------------------
@router.delete("/{milestone_id}")
def delete_milestone(project_id: int, milestone_id: int, db: Session = Depends(get_db)):
    milestone_service.delete_milestone(db, project_id, milestone_id)
    return {"success": True, "message": f"마일스톤 {milestone_id} 삭제 완료"}
