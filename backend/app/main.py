# ---------------------------
# DB 테이블 자동 생성
# ---------------------------
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models
from app.database import Base, engine
from app.routers import notification_router  # ✅ 추가
from app.routers import (
    activity_router,
    auth_router,
    comment_router,
    department_router,
    employee_router,
    history_router,
    milestone_router,
    project_router,
    task_router,
)

logging.basicConfig(level=logging.INFO)

logging.info("🚀 DB 연결 시도 중...")
Base.metadata.create_all(bind=engine)
logging.info("✅ DB 테이블 생성 완료")

# ---------------------------
# FastAPI 앱 생성
# ---------------------------
app = FastAPI(title="업무툴 프로젝트 관리")

# ✅ 프론트엔드 허용 도메인 (Vite: 5173)
origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
# ---------------------------
# CORS 설정 (React Vite 프론트 허용)
# ---------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# 라우터 등록
# ---------------------------
app.include_router(auth_router.router)  # 로그인/회원 관리
app.include_router(project_router.router)  # 프로젝트 & 멤버
app.include_router(task_router.router)  # 태스크
app.include_router(comment_router.router)  # 코멘트
app.include_router(milestone_router.router)  # 마일스톤
app.include_router(department_router.router)
app.include_router(employee_router.router)
app.include_router(history_router.router)
app.include_router(notification_router.router)
app.include_router(activity_router.router)  # ✅ 프로젝트 활동 피드


# ---------------------------
# 헬스 체크
# ---------------------------
@app.get("/")
def root():
    return {"message": "Project Management API is running!"}
