# app/services/activity_feed_service.py
from sqlalchemy import desc, literal, select, union_all, func
from sqlalchemy.orm import Session
from app import models



# -------------------------------
# ✅ 프로젝트 멤버 여부 확인
# -------------------------------
def is_project_member(db: Session, project_id: int, emp_id: int) -> bool:
    """해당 프로젝트의 멤버인지 확인"""
    return (
        db.query(models.ProjectMember)
        .filter(
            models.ProjectMember.project_id == project_id,
            models.ProjectMember.emp_id == emp_id,
        )
        .first()
        is not None
    )


# -------------------------------
# ✅ 프로젝트 활동 피드 통합 조회
# -------------------------------
def get_project_activity(db: Session, project_id: int, limit: int = 100):
    """
    TaskHistory + TaskComment + ActivityLog 통합 조회
    - created_at 기준 최신순 정렬
    - 반환: list[dict]
    """

    # --------------------------
    # ① Task 상태 변경 이력
    # --------------------------
    q_history = (
        select(
            models.TaskHistory.changed_at.label("created_at"),
            models.TaskHistory.task_id.label("task_id"),
            models.TaskHistory.changed_by.label("emp_id"),
            literal("status_changed").label("type"),
            func.concat(
                models.TaskHistory.old_status, " → ", models.TaskHistory.new_status
            ).label("detail"),
        )
        .join(models.Task, models.Task.task_id == models.TaskHistory.task_id)
        .where(models.Task.project_id == project_id)
    )

    # --------------------------
    # ② 댓글
    # --------------------------
    q_comment = (
        select(
            models.TaskComment.created_at.label("created_at"),
            models.TaskComment.task_id.label("task_id"),
            models.TaskComment.emp_id.label("emp_id"),
            literal("commented").label("type"),
            models.TaskComment.content.label("detail"),
        )
        .join(models.Task, models.Task.task_id == models.TaskComment.task_id)
        .where(models.Task.project_id == project_id)
    )

    # --------------------------
    # ③ 액티비티 로그
    # --------------------------
    q_activity = (
        select(
            models.ActivityLog.created_at.label("created_at"),
            models.ActivityLog.task_id.label("task_id"),
            models.ActivityLog.emp_id.label("emp_id"),
            models.ActivityLog.action.label("type"),  # ✅ 실제 action 값 사용
            models.ActivityLog.detail.label("detail"),
        )
        .where(models.ActivityLog.project_id == project_id)
    )

    # --------------------------
    # ④ 통합 쿼리
    # --------------------------
    union_q = union_all(q_history, q_comment, q_activity).alias("feed_union")

    stmt = (
        select(
            union_q.c.created_at,
            union_q.c.task_id,
            union_q.c.emp_id,
            union_q.c.type,
            union_q.c.detail,
        )
        .order_by(desc(union_q.c.created_at))
        .limit(limit)
    )

    # --------------------------
    # ⑤ 실행 및 결과 반환
    # --------------------------
    results = db.execute(stmt).fetchall()

    feed = [
        {
            "created_at": r.created_at,
            "task_id": r.task_id,
            "emp_id": r.emp_id,
            "type": r.type,
            "detail": r.detail,
        }
        for r in results
    ]

    return feed
