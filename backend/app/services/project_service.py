# app/services/project_service.py
from sqlalchemy.orm import Session, joinedload
from app import models, schemas
from app.models.enums import MemberRole, ProjectStatus
from app.core.exceptions import not_found, forbidden


# --------------------------
# 내부 유틸: 태스크 트리 직렬화
# --------------------------
def _serialize_task_tree(task: models.Task) -> schemas.project.TaskTree:
    # 이 태스크에 "직접" 연결된 담당자만 추출
    assignees = []
    if task.members:
        assignees = [
            schemas.project.EmployeeSimple(
                emp_id=tm.employee.emp_id,
                name=tm.employee.name if tm.employee else None,
            )
            for tm in task.members
            if tm.task_id == task.task_id  # 부모/형제의 멤버는 제외
        ]

    return schemas.project.TaskTree(
        task_id=task.task_id,
        project_id=task.project_id,
        title=task.title,
        description=task.description,
        status=task.status.name if task.status else None,
        priority=task.priority.name if task.priority else None,
        start_date=task.start_date,
        due_date=task.due_date,
        progress=task.progress or 0,
        assignees=assignees,
        subtasks=[_serialize_task_tree(sub) for sub in (task.subtasks or [])],
    )


# --------------------------
# 프로젝트 목록
# --------------------------
def get_all_projects(db: Session):
    projects = (
        db.query(models.Project)
        .options(
            # 프로젝트 멤버 + 이름까지
            joinedload(models.Project.members).joinedload(models.ProjectMember.employee),

            # 태스크 전체 트리 + 각 태스크 멤버 + 직원까지
            joinedload(models.Project.tasks)
                .joinedload(models.Task.subtasks)
                .joinedload(models.Task.members)
                .joinedload(models.TaskMember.employee),

            joinedload(models.Project.milestones),
        )
        .all()
    )

    result = []
    for p in projects:
        result.append(
            schemas.project.Project(
                project_id=p.project_id,
                title=p.project_name,  # 프런트 스키마(title)에 맞춰 반환
                description=p.description,
                start_date=p.start_date,
                end_date=p.end_date,
                status=p.status.name if p.status else None,
                owner_emp_id=p.owner_emp_id,
                members=[
                    schemas.project.ProjectMember(
                        emp_id=m.emp_id,
                        name=m.employee.name if m.employee else None,
                        role=m.role,
                        project_id=p.project_id,
                    )
                    for m in (p.members or [])
                ],
                milestones=[
                    schemas.project.Milestone(
                        milestone_id=ms.milestone_id,
                        project_id=ms.project_id,
                        name=ms.name,
                        description=ms.description,
                        due_date=ms.due_date,
                        status=ms.status,
                    )
                    for ms in (p.milestones or [])
                ],
                tasks=[
                    _serialize_task_tree(t)
                    for t in (p.tasks or [])
                    if t.parent_task_id is None
                ],
            )
        )
    return result


# --------------------------
# 프로젝트 상세
# --------------------------
def get_project_by_id(db: Session, project_id: int):
    p = (
        db.query(models.Project)
        .options(
            joinedload(models.Project.members).joinedload(models.ProjectMember.employee),
            joinedload(models.Project.tasks)
                .joinedload(models.Task.subtasks)
                .joinedload(models.Task.members)
                .joinedload(models.TaskMember.employee),
            joinedload(models.Project.milestones),
        )
        .filter(models.Project.project_id == project_id)
        .first()
    )
    if not p:
        not_found("프로젝트를 찾을 수 없습니다.")

    return schemas.project.Project(
        project_id=p.project_id,
        title=p.project_name,
        description=p.description,
        start_date=p.start_date,
        end_date=p.end_date,
        status=p.status.name if p.status else None,
        owner_emp_id=p.owner_emp_id,
        members=[
            schemas.project.ProjectMember(
                emp_id=m.emp_id,
                name=m.employee.name if m.employee else None,
                role=m.role,
                project_id=p.project_id,
            )
            for m in (p.members or [])
        ],
        milestones=[
            schemas.project.Milestone(
                milestone_id=ms.milestone_id,
                project_id=ms.project_id,
                name=ms.name,
                description=ms.description,
                due_date=ms.due_date,
                status=ms.status,
            )
            for ms in (p.milestones or [])
        ],
        tasks=[
            _serialize_task_tree(t)
            for t in (p.tasks or [])
            if t.parent_task_id is None
        ],
    )


# --------------------------
# 프로젝트 생성/수정/삭제/멤버
# --------------------------
def create_project(db: Session, request: schemas.project.ProjectCreate, current_user: models.Employee):
    proj = models.Project(
        project_name=request.title or "새 프로젝트",
        description=request.description,
        start_date=request.start_date,
        end_date=request.end_date,
        status=request.status or ProjectStatus.PLANNED,
        owner_emp_id=current_user.emp_id,
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)

    db.add(models.ProjectMember(
        project_id=proj.project_id,
        emp_id=current_user.emp_id,
        role=MemberRole.OWNER,
    ))
    db.commit()

    return proj


def update_project(db: Session, project_id: int, request: schemas.project.ProjectUpdate, current_user: models.Employee):
    proj = db.query(models.Project).filter(models.Project.project_id == project_id).first()
    if not proj:
        not_found("프로젝트를 찾을 수 없습니다.")

    owner = (
        db.query(models.ProjectMember)
        .filter(
            models.ProjectMember.project_id == project_id,
            models.ProjectMember.emp_id == current_user.emp_id,
            models.ProjectMember.role == MemberRole.OWNER,
        )
        .first()
    )
    if not owner:
        forbidden("프로젝트 소유자만 수정할 수 있습니다.")

    data = request.model_dump(exclude_unset=True)
    # 스키마는 title, DB는 project_name
    if "title" in data:
        proj.project_name = data.pop("title") or proj.project_name

    for k, v in data.items():
        setattr(proj, k, v)

    db.commit()
    db.refresh(proj)
    return proj


def delete_project(db: Session, project_id: int, current_user: models.Employee):
    proj = db.query(models.Project).filter(models.Project.project_id == project_id).first()
    if not proj:
        not_found("프로젝트를 찾을 수 없습니다.")

    owner = (
        db.query(models.ProjectMember)
        .filter(
            models.ProjectMember.project_id == project_id,
            models.ProjectMember.emp_id == current_user.emp_id,
            models.ProjectMember.role == MemberRole.OWNER,
        )
        .first()
    )
    if not owner:
        forbidden("프로젝트 소유자만 삭제할 수 있습니다.")

    db.delete(proj)
    db.commit()


def add_project_member(db: Session, project_id: int, member: schemas.project.ProjectMemberBase, current_user: models.Employee):
    owner = (
        db.query(models.ProjectMember)
        .filter(
            models.ProjectMember.project_id == project_id,
            models.ProjectMember.emp_id == current_user.emp_id,
            models.ProjectMember.role == MemberRole.OWNER,
        )
        .first()
    )
    if not owner:
        forbidden("프로젝트 소유자만 멤버를 추가할 수 있습니다.")

    new_member = models.ProjectMember(
        project_id=project_id,
        emp_id=member.emp_id,
        role=member.role or MemberRole.MEMBER,
    )
    db.add(new_member)
    db.commit()


def remove_project_member(db: Session, project_id: int, emp_id: int, current_user: models.Employee):
    owner = (
        db.query(models.ProjectMember)
        .filter(
            models.ProjectMember.project_id == project_id,
            models.ProjectMember.emp_id == current_user.emp_id,
            models.ProjectMember.role == MemberRole.OWNER,
        )
        .first()
    )
    if not owner:
        forbidden("프로젝트 소유자만 멤버를 제거할 수 있습니다.")

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

    db.delete(member)
    db.commit()
