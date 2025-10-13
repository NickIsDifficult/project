# app/services/project_service.py
from sqlalchemy.orm import Session

from projectlist import models, schemas
from projectlist.core.exceptions import bad_request, conflict, forbidden, not_found
from projectlist.models.enums import MemberRole, ProjectStatus


# -------------------------------
# ✅ 전체 프로젝트 조회
# -------------------------------
def get_all_projects(db: Session):
    """모든 프로젝트 목록을 최신순으로 조회"""
    return db.query(models.Project).order_by(models.Project.created_at.desc()).all()


# -------------------------------
# ✅ 단일 프로젝트 조회
# -------------------------------
def get_project_by_id(db: Session, project_id: int):
    """특정 프로젝트 단건 조회"""
    return (
        db.query(models.Project).filter(models.Project.project_id == project_id).first()
    )


# -------------------------------
# ✅ 프로젝트 생성
# -------------------------------
def create_project(
    db: Session, request: schemas.project.ProjectCreate, owner_emp_id: int
):
    """새 프로젝트 생성 (생성자 자동 OWNER 등록)"""
    try:
        new_project = models.Project(
            project_name=request.project_name.strip(),
            description=request.description,
            start_date=request.start_date,
            end_date=request.end_date,
            status=request.status or ProjectStatus.PLANNED,
            owner_emp_id=owner_emp_id,
        )
        db.add(new_project)
        db.commit()
        db.refresh(new_project)

        # OWNER 자동 등록
        owner_member = models.ProjectMember(
            project_id=new_project.project_id,
            emp_id=owner_emp_id,
            role=MemberRole.OWNER,
        )
        db.add(owner_member)
        db.commit()

        return new_project

    except Exception as e:
        db.rollback()
        bad_request(f"프로젝트 생성 중 오류: {str(e)}")


# -------------------------------
# ✅ 프로젝트 수정
# -------------------------------
def update_project(
    db: Session, project: models.Project, request: schemas.project.ProjectUpdate
):
    """기존 프로젝트 수정"""
    try:
        update_data = request.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(project, key, value)
        db.commit()
        db.refresh(project)
        return project
    except Exception as e:
        db.rollback()
        bad_request(f"프로젝트 수정 중 오류: {str(e)}")


# -------------------------------
# ✅ 프로젝트 삭제
# -------------------------------
def delete_project(db: Session, project: models.Project):
    """프로젝트 및 관련 데이터 삭제"""
    try:
        # 명시적 삭제 (Cascade 설정 없는 경우 대비)
        db.query(models.ProjectMember).filter(
            models.ProjectMember.project_id == project.project_id
        ).delete()
        db.query(models.Task).filter(
            models.Task.project_id == project.project_id
        ).delete()

        db.delete(project)
        db.commit()
        return True

    except Exception as e:
        db.rollback()
        bad_request(f"프로젝트 삭제 중 오류: {str(e)}")


# -------------------------------
# ✅ 프로젝트 멤버 추가
# -------------------------------
def add_member(db: Session, project_id: int, member: schemas.project.ProjectMemberBase):
    """프로젝트에 새로운 멤버 추가"""
    existing = (
        db.query(models.ProjectMember)
        .filter(
            models.ProjectMember.project_id == project_id,
            models.ProjectMember.emp_id == member.emp_id,
        )
        .first()
    )
    if existing:
        conflict("이미 프로젝트에 등록된 멤버입니다.")

    try:
        new_member = models.ProjectMember(
            project_id=project_id,
            emp_id=member.emp_id,
            role=member.role or MemberRole.MEMBER,
        )
        db.add(new_member)
        db.commit()
        db.refresh(new_member)
        return new_member

    except Exception as e:
        db.rollback()
        bad_request(f"멤버 추가 중 오류: {str(e)}")


# -------------------------------
# ✅ 프로젝트 멤버 제거
# -------------------------------
def remove_member(db: Session, project_id: int, emp_id: int):
    """프로젝트에서 특정 멤버 제거 (OWNER는 불가)"""
    member = (
        db.query(models.ProjectMember)
        .filter(
            models.ProjectMember.project_id == project_id,
            models.ProjectMember.emp_id == emp_id,
        )
        .first()
    )
    if not member:
        not_found("해당 멤버를 찾을 수 없습니다.")

    if member.role == MemberRole.OWNER:
        forbidden("프로젝트 소유자는 제거할 수 없습니다.")

    try:
        db.delete(member)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        bad_request(f"멤버 제거 중 오류: {str(e)}")


# -------------------------------
# ✅ 권한 확인 (OWNER 여부)
# -------------------------------
def is_project_owner(db: Session, project_id: int, emp_id: int) -> bool:
    """특정 직원이 해당 프로젝트의 OWNER인지 확인"""
    member = (
        db.query(models.ProjectMember)
        .filter(
            models.ProjectMember.project_id == project_id,
            models.ProjectMember.emp_id == emp_id,
            models.ProjectMember.role == MemberRole.OWNER,
        )
        .first()
    )
    return member is not None
