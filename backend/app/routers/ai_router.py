# app/routers/ai_router.py
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import ai_service

router = APIRouter(prefix="/ai", tags=["AI Assistant"])

# -------------------------
# ✅ 요청 스키마
# -------------------------
class PromptRequest(BaseModel):
    prompt: str

# -------------------------
# ✅ 자연어 → Task 자동 생성
# -------------------------
@router.post("/create_task")
async def create_task_from_prompt(req: PromptRequest, db: Session = Depends(get_db)):
    """자연어 → Task 자동 생성"""
    return ai_service.generate_task_from_prompt(db, req.prompt)

# -------------------------
# ✅ 프로젝트 단건 요약
# -------------------------
@router.get("/summary/project/{project_id}")
async def summarize_project(project_id: int, db: Session = Depends(get_db)):
    """프로젝트 단건 요약"""
    return ai_service.summarize_project(db, project_id)

# -------------------------
# ✅ 전체 프로젝트 요약
# -------------------------
@router.get("/summary/all")
async def summarize_all_projects(db: Session = Depends(get_db)):
    """전체 프로젝트 현황 요약"""
    return ai_service.summarize_all_projects(db)

# -------------------------
# ✅ 전역 AI 명령 실행
# -------------------------
@router.post("/command")
async def ai_command(req: PromptRequest, db: Session = Depends(get_db)):
    """자연어 명령 → 적절한 AI 처리 실행"""
    if not req.prompt.strip():
        return {"error": "Prompt is empty"}
    return ai_service.run_ai_command(db, req.prompt)
