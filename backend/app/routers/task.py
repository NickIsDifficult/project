# # backend/app/routers/task.py (예시)
# from fastapi import APIRouter, Depends
# from app.utils.token import get_current_member
# from app.models.member import Member

# router = APIRouter()

# @router.get("/tasks/me")
# def my_tasks(current: Member = Depends(get_current_member)):
#     # current.member_id 로 사용자별 데이터 조회
#     return [{"task_id": 1, "title": "샘플"}]
