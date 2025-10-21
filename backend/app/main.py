import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine

# === 라우터 임포트 ===
from app.routers.activity_router import router as activity_router
from app.routers.comment_router import router as comment_router
from app.routers.department_router import router as department_router
from app.routers.employee_router import router as employee_router
from app.routers.history_router import router as history_router
from app.routers.milestone_router import router as milestone_router
from app.routers.notification_router import router as notification_router
from app.routers.project_router import router as project_router
from app.routers.task_router import router as task_router
from app.routers.events_router import router as events_router
from app.routers.status_router import router as status_router
from app.routers.auth.login import router as login_router
from app.routers.auth.signup import router as signup_router
from app.routers.auth.me import router as me_router
from app.routers.trash_router import router as trash_router

# -------------------------------
# 기본 설정
# -------------------------------
API_PREFIX = "/api"

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logging.info("🚀 DB 연결 시도 중...")

# ⚠️ 개발 단계 간편 생성 (운영은 Alembic 권장)
Base.metadata.create_all(bind=engine)
logging.info("✅ DB 테이블 생성 완료")

app = FastAPI(title="업무툴 프로젝트 관리")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# 라우터 등록
# (모든 라우터를 /api 아래로 노출)
# -------------------------------
app.include_router(login_router,        prefix=API_PREFIX)
app.include_router(signup_router,       prefix=API_PREFIX)
app.include_router(me_router,           prefix=API_PREFIX)

app.include_router(project_router,      prefix=API_PREFIX)
app.include_router(task_router,         prefix=API_PREFIX)
app.include_router(comment_router,      prefix=API_PREFIX)
app.include_router(milestone_router,    prefix=API_PREFIX)
app.include_router(department_router,   prefix=API_PREFIX)
app.include_router(employee_router,     prefix=API_PREFIX)
app.include_router(history_router,      prefix=API_PREFIX)
app.include_router(notification_router, prefix=API_PREFIX)
app.include_router(activity_router,     prefix=API_PREFIX)
app.include_router(events_router,       prefix=API_PREFIX)   # /api/events
app.include_router(status_router,       prefix=API_PREFIX)   # /api/status

# (옵션) 프론트가 아직 /events, /status로 호출하면 레거시 경로도 임시로 열기
app.include_router(events_router)   # /events
app.include_router(status_router)   # /status
app.include_router(trash_router, prefix=API_PREFIX)
app.include_router(trash_router)
# -------------------------------
# 헬스체크 & 루트
# -------------------------------
@app.get("/")
def root():
    return {"message": "Project Management API is running!"}

@app.get(f"{API_PREFIX}/health")
def health():
    return {"ok": True}

# -------------------------------
# 라우트 덤프 (부팅 로그 + JSON)
# -------------------------------
@app.on_event("startup")
async def _dump_routes():
    logging.info("📜 Registered routes:")
    for r in app.router.routes:
        methods = getattr(r, "methods", None)
        methods_str = ",".join(sorted(methods)) if isinstance(methods, (set, list)) else ""
        path_str = getattr(r, "path", "")
        logging.info("  %s %s", methods_str, path_str)

@app.get("/__routes")
def __routes():
    data = []
    for r in app.router.routes:
        methods = getattr(r, "methods", None)
        methods_lst = sorted(list(methods)) if isinstance(methods, (set, list)) else []
        path_str = getattr(r, "path", "")
        data.append({"methods": methods_lst, "path": path_str})
    return {"routes": data}
