from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.project import Project
from app.models.notices import Notice
from app.models.employee import Employee
from app.models.department import Department

router = APIRouter(prefix="/search", tags=["Search"])

@router.get("/")
def search_all(
    keyword: str = Query("", alias="keyword"),
    category: str = Query("", alias="category"),
    from_date: str = Query("", alias="from_date"),
    to_date: str = Query("", alias="to_date"),
    sort: str = Query("desc", alias="sort"),
    db: Session = Depends(get_db),
):
    q_like = f"%{keyword}%"
    results = []

    # ---- 프로젝트 검색 ----
    projects = db.query(Project).filter(Project.project_name.like(q_like)).all()
    for p in projects:
        created_at = getattr(p, "created_at", None)
        results.append({
            "id": p.project_id,
            "type": "프로젝트",
            "title": p.project_name,
            "owner": getattr(p.employee, "name", "미지정"),
            "summary": (p.description or "")[:120],
            "createdAt": created_at.isoformat() if created_at else "",
            "createdAtStr": created_at.strftime("%Y-%m-%d") if created_at else "",
        })

    # ---- 공지사항 검색 ----
    notices = db.query(Notice).filter(Notice.title.like(q_like)).all()
    for n in notices:
        created_at = getattr(n, "created_at", None)
        results.append({
            "id": n.id,
            "type": "공지사항",
            "title": n.title,
            "owner": getattr(n.author, "name", getattr(n.author, "member_name", "관리자")),
            "summary": (n.body or "")[:120],
            "createdAt": created_at.isoformat() if created_at else "",
            "createdAtStr": created_at.strftime("%Y-%m-%d") if created_at else "",
        })

    # ---- 직원 검색 ----
    employees = (
        db.query(Employee)
        .join(Department, Employee.dept_id == Department.dept_id)
        .filter(
            (Employee.name.like(q_like)) |
            (Employee.email.like(q_like)) |
            (Employee.emp_no.like(q_like)) |
            (Department.dept_name.like(q_like))
        )
        .all()
    )

    for e in employees:
        created_at = getattr(e, "created_at", None)
        results.append({
            "id": e.emp_id,
            "type": "직원",
            "title": e.name,
            "owner": e.email,
            "summary": f"{getattr(e.department, 'dept_name', '')} / {getattr(e.role, 'role_name', '')}",
            "createdAt": created_at.isoformat() if created_at else "",
            "createdAtStr": created_at.strftime("%Y-%m-%d") if created_at else "",
        })

    # ---- 정렬 ----
    if sort == "asc":
        results.sort(key=lambda x: x["createdAt"])
    else:
        results.sort(key=lambda x: x["createdAt"], reverse=True)

    return results
