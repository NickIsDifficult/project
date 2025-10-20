from sqlalchemy.orm import Session, joinedload
from app import models, schemas
from app.core.exceptions import bad_request, conflict, forbidden, not_found
from app.models.enums import MemberRole, ProjectStatus
from app.services import task_service


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
        db.query(models.Project)
        .filter(models.Project.project_id == project_id)
        .first()
    )


# -------------------------------
# ✅ 프로젝트 생성
# -------------------------------
def create_project(db: Session, request: schemas.project.ProjectCreate, owner_emp_id: int):
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
def update_project(db: Session, project: models.Project, request: schemas.project.ProjectUpdate):
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
# ✅ 프로젝트 멤버 조회
# -------------------------------
def get_members(db: Session, project_id: int):
    """특정 프로젝트의 멤버 + 직원 정보 반환"""
    members = (
        db.query(
            models.Employee.emp_id,
            models.Employee.name,
            models.Employee.email,
            models.ProjectMember.role,
        )
        .join(
            models.ProjectMember,
            models.Employee.emp_id == models.ProjectMember.emp_id,
        )
        .filter(models.ProjectMember.project_id == project_id)
        .all()
    )

    return [
        {
            "emp_id": emp_id,
            "name": name,
            "email": email,
            "role": role,
        }
        for emp_id, name, email, role in members
    ]


def create_project_with_tasks(
    db: Session,
    request: schemas.project.ProjectWithTasksCreate,
    owner_emp_id: int,
):
    """프로젝트와 업무를 함께 생성"""
    try:
        # 1️⃣ 프로젝트 생성
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

        # 2️⃣ OWNER 자동 등록
        owner_member = models.ProjectMember(
            project_id=new_project.project_id,
            emp_id=owner_emp_id,
            role=MemberRole.OWNER,
        )
        db.add(owner_member)
        db.commit()

        # 3️⃣ 업무 생성 (재귀 포함)
        def create_task_tree(task_data, parent_id=None):
            new_task = models.Task(
                project_id=new_project.project_id,
                parent_task_id=parent_id,
                title=task_data.title.strip(),
                description=task_data.description,
                status=task_data.status,
                priority=task_data.priority,
                start_date=task_data.start_date,
                due_date=task_data.due_date,
                estimate_hours=task_data.estimate_hours or 0,
                progress=task_data.progress or 0,
            )
            db.add(new_task)
            db.commit()
            db.refresh(new_task)

            # ✅ 담당자 연결 (task_assignee)
            if task_data.assignee_ids:
                for emp_id in task_data.assignee_ids:
                    db.add(models.TaskAssignee(task_id=new_task.task_id, emp_id=emp_id))
                db.commit()

            # ✅ 하위 업무 재귀 생성
            for sub in getattr(task_data, "subtasks", []):
                create_task_tree(sub, parent_id=new_task.task_id)

        for t in request.tasks:
            create_task_tree(t, parent_id=None)

        return new_project

    except Exception as e:
        db.rollback()
        bad_request(f"프로젝트+업무 생성 중 오류: {str(e)}")



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


# -------------------------------
# ✅ 프로젝트 멤버 여부 확인
# -------------------------------
def is_project_member(db: Session, project_id: int, emp_id: int) -> bool:
    """특정 직원이 프로젝트 멤버인지 확인"""
    return (
        db.query(models.ProjectMember)
        .filter(
            models.ProjectMember.project_id == project_id,
            models.ProjectMember.emp_id == emp_id,
        )
        .first()
        is not None
    )
