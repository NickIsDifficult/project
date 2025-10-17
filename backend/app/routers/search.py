# app/routers/search.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import List, Dict, Any

from app.database import get_db
from app.models.department import Department
from app.models.employee import Employee
from app.models.project import Project, Task
from app.models.notice import Notice

router = APIRouter(prefix="/api/search", tags=["Search"])

# -----------------------
# 🔧 헬퍼 함수
# -----------------------
def fmt_date(d) -> str:
    """datetime/date/str/None → 안전하게 YYYY-MM-DD 문자열 변환"""
    if not d:
        return ""
    try:
        if isinstance(d, (datetime, date)):
            return d.strftime("%Y-%m-%d")
        if isinstance(d, str):
            return d[:10]
    except Exception:
        pass
    return ""

def safe_summary(value, limit: int = 80):
    """description/content가 None이거나 str이 아닐 때도 안전하게 처리"""
    if not value or not isinstance(value, str):
        return ""
    return (value[:limit] + "...") if len(value) > limit else value

def within_range(d, from_date: str, to_date: str) -> bool:
    """from_date ~ to_date 범위 필터"""
    if not d:
        return True
    try:
        dt = datetime.strptime(fmt_date(d), "%Y-%m-%d")
        if from_date and dt < datetime.strptime(from_date, "%Y-%m-%d"):
            return False
        if to_date and dt > datetime.strptime(to_date, "%Y-%m-%d"):
            return False
    except Exception:
        return True
    return True

# -----------------------
# 🔍 통합 검색 API
# -----------------------
@router.get("/", response_model=List[Dict[str, Any]])
def search(
    keyword: str = Query("", description="검색어"),
    category: str = Query("", description="카테고리 (공지사항, 프로젝트, 업무, 직원)"),
    from_date: str = Query("", description="검색 시작일"),
    to_date: str = Query("", description="검색 종료일"),
    sort: str = Query("recent", description="정렬 방식"),
    db: Session = Depends(get_db),
):
    results = []

    # -----------------------
    # 공지사항
    # -----------------------
    if category in ("", "공지사항"):
        q = db.query(Notice)
        if keyword:
            q = q.filter(Notice.title.like(f"%{keyword}%"))
        for n in q.all():
            if not within_range(n.reg_date, from_date, to_date):
                continue
            dept = db.query(Department).get(n.dept_id)
            results.append({
                "id": n.notice_id,
                "type": "공지사항",
                "title": n.title or "",
                "owner": dept.dept_name if dept else "-",
                "createdAt": fmt_date(n.reg_date),
                "createdAtStr": fmt_date(n.reg_date),
                "summary": safe_summary(n.content),
            })

    # -----------------------
    # 프로젝트
    # -----------------------
    if category in ("", "프로젝트"):
        q = db.query(Project)
        if keyword:
            q = q.filter(Project.project_name.like(f"%{keyword}%"))
        for p in q.all():
            if not within_range(p.created_at, from_date, to_date):
                continue
            results.append({
                "id": p.project_id,
                "type": "프로젝트",
                "title": p.project_name or "",
                "owner": p.owner.name if getattr(p, "owner", None) else "-",
                "createdAt": fmt_date(getattr(p, "created_at", None)),
                "createdAtStr": fmt_date(getattr(p, "created_at", None)),
                "summary": safe_summary(getattr(p, "description", "")),
            })

    # -----------------------
    # 업무(Task)
    # -----------------------
    if category in ("", "업무"):
        q = db.query(Task)
        if keyword:
            q = q.filter(Task.title.like(f"%{keyword}%"))
        for t in q.all():
            if not within_range(t.created_at, from_date, to_date):
                continue
            results.append({
                "id": t.task_id,
                "type": "업무",
                "title": t.title or "",
                "owner": t.assignee.name if getattr(t, "assignee", None) else "-",
                "createdAt": fmt_date(getattr(t, "created_at", None)),
                "createdAtStr": fmt_date(getattr(t, "created_at", None)),
                "summary": safe_summary(getattr(t, "description", "")),
            })

    # -----------------------
    # 직원(Employee)
    # -----------------------
    if category in ("", "직원"):
        q = db.query(Employee)
        if keyword:
            q = q.filter(Employee.name.like(f"%{keyword}%"))
        for e in q.all():
            if not within_range(e.created_at, from_date, to_date):
                continue
            dept = db.query(Department).get(e.dept_id)
            results.append({
                "id": e.emp_id,
                "type": "직원",
                "title": e.name or "",
                "owner": dept.dept_name if dept else "-",
                "createdAt": fmt_date(getattr(e, "created_at", None)),
                "createdAtStr": fmt_date(getattr(e, "created_at", None)),
                "summary": f"이메일: {e.email or '-'} / 연락처: {e.mobile or '-'}",
            })

    # -----------------------
    # 정렬
    # -----------------------
    if sort in ("recent", "oldest"):
        results.sort(key=lambda x: x["createdAt"], reverse=(sort == "recent"))
    elif sort == "title_asc":
        results.sort(key=lambda x: x["title"])
    elif sort == "title_desc":
        results.sort(key=lambda x: x["title"], reverse=True)

    return results
