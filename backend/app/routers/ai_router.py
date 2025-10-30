from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Any, Dict, Optional

from app.database import get_db
from app.services import ai_service

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


# -----------------------------
# ✅ 요청 / 응답 스키마
# -----------------------------
class PromptRequest(BaseModel):
    prompt: str


class AIResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None


# -----------------------------
# ✅ 자연어 → Task 자동 생성
# -----------------------------
@router.post("/create_task", response_model=AIResponse)
async def create_task_from_prompt(req: PromptRequest, db: Session = Depends(get_db)):
    if not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")
    try:
        result = ai_service.generate_task_from_prompt(db, req.prompt)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -----------------------------
# ✅ 프로젝트 단건 요약
# -----------------------------
@router.get("/summary/project/{project_id}", response_model=AIResponse)
async def summarize_project(project_id: int, db: Session = Depends(get_db)):
    try:
        result = ai_service.summarize_project(db, project_id)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -----------------------------
# ✅ 전체 프로젝트 요약
# -----------------------------
@router.get("/summary/all", response_model=AIResponse)
async def summarize_all_projects(db: Session = Depends(get_db)):
    try:
        result = ai_service.summarize_all_projects(db)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -----------------------------
# ✅ 전역 AI 명령 실행
# -----------------------------
@router.post("/command", response_model=AIResponse)
async def ai_command(req: PromptRequest, db: Session = Depends(get_db)):
    prompt = req.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")

    try:
        result = ai_service.run_ai_command(db, prompt)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI command failed: {str(e)}")
