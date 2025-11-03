from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Notice, Project, Notification, Event
from datetime import date, datetime

router = APIRouter(tags=["preview"])

# 🔹 공지사항 미리보기
@router.get("/notices/preview")
def preview_notices(db: Session = Depends(get_db)):
    notices = (
        db.query(Notice)
        .order_by(Notice.created_at.desc())
        .limit(5)
        .all()
    )
    return [
        {"title": n.title, "summary": n.body[:60], "created_at": n.created_at}
        for n in notices
    ]

# 🔹 프로젝트 미리보기 (모든 필드 직렬화 안전처리)
@router.get("/projects/preview/list")
def preview_projects(db: Session = Depends(get_db)):
    projects = (
        db.query(Project)
        .order_by(Project.updated_at.desc())
        .limit(5)
        .all()
    )
    result = []
    for p in projects:
        try:
            result.append({
                "id": getattr(p, "project_id", None),
                "title": getattr(p, "project_name", "이름 없음"),
                "summary": getattr(p, "description", "설명 없음") or "설명 없음",
                "status": getattr(p.status, "value", str(p.status)) if p.status else "미정",
                "progress": getattr(p, "progress_rate", 0.0),
                "createdAtStr": (
                    p.updated_at.strftime("%Y-%m-%d %H:%M")
                    if getattr(p, "updated_at", None)
                    else None
                ),
            })
        except Exception as e:
            print("⚠️ preview_projects 변환 중 오류:", e)
            continue
    return result


# 🔹 알림 미리보기
@router.get("/notifications/preview")
def preview_notifications(db: Session = Depends(get_db)):
    notis = (
        db.query(Notification)
        .order_by(Notification.created_at.desc())
        .limit(5)
        .all()
    )
    return [
        {
            "title": n.type.value,
            "summary": (n.payload or {}).get("message", "알림 내용 없음"),
            "created_at": n.created_at,
        }
        for n in notis
    ]

# 🔹 오늘 일정(이벤트) 미리보기
@router.get("/calendar/preview")
def preview_calendar(db: Session = Depends(get_db)):
    today = date.today()
    start_of_day = datetime.combine(today, datetime.min.time())
    end_of_day = datetime.combine(today, datetime.max.time())

    events = (
        db.query(Event)
        .filter(Event.start_date <= end_of_day, Event.end_date >= start_of_day)
        .order_by(Event.start_date.asc())
        .limit(5)
       .all()
    )

    if not events:
        return [{"title": "오늘 일정 없음", "summary": "", "time": None}]

    return [
        {
            "title": e.title,
            "summary": e.description or "세부 내용 없음",
            "time": e.start_date.strftime("%H:%M"),
            "project_id": e.project_id,
        }
        for e in events
    ]
