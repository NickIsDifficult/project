from datetime import datetime

from sqlalchemy.orm import Session, joinedload

from app import models
from app.core.exceptions import bad_request, forbidden, not_found
from app.utils.activity_logger import log_task_action
from app.utils.mention import extract_mentions
from app.utils.notifier import create_notifications


# --------------------------------
# 🧱 댓글 목록 조회
# --------------------------------
def get_comments_by_task(db: Session, task_id: int):
    """특정 태스크의 댓글 목록 조회"""
    comments = (
        db.query(models.TaskComment)
        .filter(models.TaskComment.task_id == task_id)
        .order_by(models.TaskComment.created_at.asc())
        .all()
    )

    # ✅ 작성자 이름(author_name) 포함하여 반환
    return [
        {
            **c.__dict__,
            "emp_id": c.emp_id,
            "author_name": c.employee.name if c.employee else None,
        }
        for c in comments
    ]


# --------------------------------
# 📝 댓글 생성
# --------------------------------
def create_comment(db: Session, task_id: int, emp_id: int, content: str):
    """댓글 작성 + 멘션 알림 + 액티비티 로그"""
    if not content.strip():
        bad_request("댓글 내용을 입력하세요.")

    # ✅ 태스크 존재 확인
    task = db.query(models.Task).filter(models.Task.task_id == task_id).first()
    if not task:
        not_found("해당 태스크를 찾을 수 없습니다.")

    new_comment = models.TaskComment(
        project_id=task.project_id,
        task_id=task_id,
        emp_id=emp_id,
        content=content.strip(),
        created_at=datetime.utcnow(),
    )

    try:
        db.add(new_comment)
        db.commit()

        # ✅ 작성자(employee) 관계를 즉시 로드
        new_comment = (
            db.query(models.TaskComment)
            .options(joinedload(models.TaskComment.employee))
            .filter(models.TaskComment.comment_id == new_comment.comment_id)
            .first()
        )

        # ✅ 작성자 이름(author_name) 필드 포함
        response_data = {
            **new_comment.__dict__,
            "emp_id": new_comment.emp_id,
            "author_name": new_comment.employee.name if new_comment.employee else None,
        }

        # ✅ 멘션 감지 및 알림
        mentioned_users = extract_mentions(content)
        if mentioned_users:
            create_notifications(
                db=db,
                recipients=mentioned_users,
                actor_emp_id=emp_id,
                project_id=task.project_id,
                task_id=task_id,
                notif_type="mention",
                payload={"content": content},
            )

        # ✅ 액티비티 로그 기록
        log_task_action(
            db=db,
            emp_id=emp_id,
            project_id=task.project_id,
            task_id=task_id,
            action="commented",
            detail=f"'{content[:30]}...'",
        )

        return response_data

    except Exception as e:
        db.rollback()
        bad_request(f"댓글 등록 중 오류 발생: {str(e)}")


# --------------------------------
# ✏️ 댓글 수정
# --------------------------------
def update_comment(db: Session, comment_id: int, emp_id: int, content: str):
    """댓글 수정 + 로그 기록"""
    comment = (
        db.query(models.TaskComment)
        .filter(models.TaskComment.comment_id == comment_id)
        .first()
    )
    if not comment:
        not_found("댓글을 찾을 수 없습니다.")
    if comment.emp_id != emp_id:
        forbidden("본인이 작성한 댓글만 수정할 수 있습니다.")

    comment.content = content.strip()
    comment.updated_at = datetime.utcnow()

    try:
        db.commit()
        db.refresh(comment)

        # ✅ 액티비티 로그
        log_task_action(
            db=db,
            emp_id=emp_id,
            project_id=comment.project_id,
            task_id=comment.task_id,
            action="comment_edited",
            detail=f"댓글 {comment.comment_id} 수정됨",
        )

        # ✅ 작성자 이름 포함 반환
        return {
            **comment.__dict__,
            "emp_id": comment.emp_id,
            "author_name": comment.employee.name if comment.employee else None,
        }

    except Exception as e:
        db.rollback()
        bad_request(f"댓글 수정 중 오류 발생: {str(e)}")


# --------------------------------
# 🗑️ 댓글 삭제
# --------------------------------
def delete_comment(db: Session, comment_id: int, emp_id: int):
    """댓글 삭제 + 로그 기록"""
    comment = (
        db.query(models.TaskComment)
        .filter(models.TaskComment.comment_id == comment_id)
        .first()
    )
    if not comment:
        not_found("댓글을 찾을 수 없습니다.")
    if comment.emp_id != emp_id:
        forbidden("본인이 작성한 댓글만 삭제할 수 있습니다.")

    try:
        db.delete(comment)
        db.commit()

        # ✅ 액티비티 로그
        log_task_action(
            db=db,
            emp_id=emp_id,
            project_id=comment.project_id,
            task_id=comment.task_id,
            action="comment_deleted",
            detail=f"댓글 {comment.comment_id} 삭제됨",
        )

        return {"success": True, "message": f"댓글 {comment.comment_id} 삭제 완료"}

    except Exception as e:
        db.rollback()
        bad_request(f"댓글 삭제 중 오류 발생: {str(e)}")
