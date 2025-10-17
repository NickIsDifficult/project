# app/services/milestone_service.py
from datetime import date

from sqlalchemy.orm import Session

from app import models, schemas
from app.core.exceptions import conflict, forbidden, not_found
from app.models.project import MilestoneStatus


# -------------------------------
# 자동 상태 업데이트
# -------------------------------
def auto_update_missed_milestones(db: Session, project_id: int | None = None) -> int:
    """기한이 지난 마일스톤을 자동으로 MISSED로 변경."""
    today = date.today()
    query = db.query(models.Milestone).filter(
        models.Milestone.status == MilestoneStatus.PLANNED,
        models.Milestone.due_date < today,
    )

    if project_id:
        query = query.filter(models.Milestone.project_id == project_id)

    count = query.update({models.Milestone.status: MilestoneStatus.MISSED})
    if count > 0:
        db.commit()
    return count


# -------------------------------
# 마일스톤 목록 조회
# -------------------------------
def get_milestones(db: Session, project_id: int):
    return (
        db.query(models.Milestone)
        .filter(models.Milestone.project_id == project_id)
        .order_by(models.Milestone.due_date.asc())
        .all()
    )


# -------------------------------
# 마일스톤 생성
# -------------------------------
def create_milestone(
    db: Session, project_id: int, request: schemas.project.MilestoneCreate, current_user
):
    # 권한 확인
    member = (
        db.query(models.ProjectMember)
        .filter(
            models.ProjectMember.project_id == project_id,
            models.ProjectMember.emp_id == current_user.emp_id,
        )
        .first()
    )
    if not member or member.role not in ["OWNER", "MANAGER"]:
        forbidden("이 프로젝트의 마일스톤을 생성할 권한이 없습니다.")

    # 중복 검사
    existing = (
        db.query(models.Milestone)
        .filter(
            models.Milestone.project_id == project_id,
            models.Milestone.name == request.name,
        )
        .first()
    )
    if existing:
        conflict(f"이미 존재하는 마일스톤 이름입니다: {request.name}")

    milestone = models.Milestone(
        project_id=project_id,
        name=request.name,
        description=request.description,
        due_date=request.due_date,
        status=request.status,
    )
    db.add(milestone)
    db.commit()
    db.refresh(milestone)
    return milestone


# -------------------------------
# 마일스톤 수정
# -------------------------------
def update_milestone(
    db: Session,
    project_id: int,
    milestone_id: int,
    request: schemas.project.MilestoneBase,
):
    milestone = (
        db.query(models.Milestone)
        .filter(
            models.Milestone.milestone_id == milestone_id,
            models.Milestone.project_id == project_id,
        )
        .first()
    )
    if not milestone:
        not_found("수정할 마일스톤을 찾을 수 없습니다.")

    for key, value in request.model_dump(exclude_unset=True).items():
        setattr(milestone, key, value)

    db.commit()
    db.refresh(milestone)
    return milestone


# -------------------------------
# 마일스톤 상태 변경
# -------------------------------
def change_status(
    db: Session, project_id: int, milestone_id: int, status: MilestoneStatus
):
    milestone = (
        db.query(models.Milestone)
        .filter(
            models.Milestone.milestone_id == milestone_id,
            models.Milestone.project_id == project_id,
        )
        .first()
    )
    if not milestone:
        not_found("마일스톤을 찾을 수 없습니다.")

    milestone.status = status
    db.commit()
    db.refresh(milestone)
    return milestone


# -------------------------------
# 마일스톤 삭제
# -------------------------------
def delete_milestone(db: Session, project_id: int, milestone_id: int):
    milestone = (
        db.query(models.Milestone)
        .filter(
            models.Milestone.milestone_id == milestone_id,
            models.Milestone.project_id == project_id,
        )
        .first()
    )
    if not milestone:
        not_found("삭제할 마일스톤을 찾을 수 없습니다.")

    db.delete(milestone)
    db.commit()
