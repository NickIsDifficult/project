# app/main.py
from datetime import datetime, timedelta
import logging
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

# --- DB / Models ---
from app import models
from app.database import Base, engine, SessionLocal
from sqlalchemy import select
from passlib.hash import bcrypt

# --- Routers ---
# auth (/auth/*)
from app.routers.auth import login as auth_login, signup as auth_signup, me as auth_me

# core (/api/*)
from app.routers import (
    project_router,
    task_router,
    comment_router,
    milestone_router,
    department_router,
    employee_router,
    history_router,
    notification_router,
    activity_router,
    ai_router,
    notices_router,
)

# 확장 라우터 (개별 export)
from app.routers.events_router import router as events_router
from app.routers.status_router import router as status_router
from app.routers.trash_router import router as trash_router

# ------------------------------------------------
# FastAPI
# ------------------------------------------------
app = FastAPI(title="업무툴 프로젝트 관리")

# ------------------------------------------------
# CORS (라우터 등록 전에!)
# ------------------------------------------------
origins = [
    "http://localhost:5173", "http://127.0.0.1:5173",
    "http://localhost:5174", "http://127.0.0.1:5174",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,   # 쿠키/리프레시 사용 시 True 유지
    allow_methods=["*"],
    allow_headers=["*"],      # Authorization, Content-Type 등
    expose_headers=["*"],
    max_age=86400,
)

# ✅ 프리플라이트(OPTIONS) 통과: /api/* 전부 204
@app.options("/api/{rest_of_path:path}")
def _cors_preflight(rest_of_path: str):
    return Response(status_code=204)

# ------------------------------------------------
# DB 초기화 (개발용)
# ------------------------------------------------
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("app")

log.info("🚀 DB 테이블 생성/동기화 시작")
Base.metadata.create_all(bind=engine)
log.info("✅ DB 테이블 생성/동기화 완료")

# ------------------------------------------------
# 라우터 등록
# ------------------------------------------------
# /auth/*
app.include_router(auth_login.router)   # POST /auth/login
app.include_router(auth_signup.router)  # POST /auth/signup
app.include_router(auth_me.router)      # GET /auth/me, PATCH /auth/me ...

# /api/* 공통 라우터
for r in [
    project_router.router,
    task_router.router,
    comment_router.router,
    milestone_router.router,
    department_router.router,
    employee_router.router,
    history_router.router,
    notification_router.router,
    activity_router.router,
    ai_router.router,
    notices_router.router,     # /api/notices
]:
    app.include_router(r, prefix="/api")

# 개별 export 라우터
app.include_router(events_router, prefix="/api")   # /api/events, /api/events/create ...
app.include_router(status_router, prefix="/api")   # /api/status
app.include_router(trash_router,  prefix="/api")   # /api/trash

# ------------------------------------------------
# 헬스체크
# ------------------------------------------------
@app.get("/")
def root():
    return {"message": "Project Management API is running!"}

@app.get("/healthz")
def healthz():
    return {"ok": True}

# ------------------------------------------------
# 부팅 시 기본 관리자 생성 (개발용)
# ------------------------------------------------
@app.on_event("startup")
def create_default_admin():
    db = SessionLocal()
    try:
        # 이미 있으면 스킵
        if db.scalar(select(models.Member.member_id).where(models.Member.login_id == "0000")):
            log.info("ℹ️ 기본 관리자(0000) 이미 존재. 초기화 스킵.")
            return

        log.info("⚙️ 기본 관리자/부서/역할/사원/멤버 생성 시작...")

        dept = db.scalar(select(models.Department).where(models.Department.dept_no == "99"))
        if not dept:
            dept = models.Department(dept_no="99", dept_name="관리자")
            db.add(dept); db.commit(); db.refresh(dept)

        role = db.scalar(select(models.Role).where(models.Role.role_no == "99"))
        if not role:
            role = models.Role(role_no="99", role_name="관리자")
            db.add(role); db.commit(); db.refresh(role)

        emp = db.scalar(select(models.Employee).where(models.Employee.emp_no == "0000"))
        if not emp:
            emp = models.Employee(
                emp_no="0000",
                dept_id=getattr(dept, "dept_id", None),
                role_id=getattr(role, "role_id", None),
                dept_no=dept.dept_no,
                role_no=role.role_no,
                name="관리자",
                email="admin@example.com",
                mobile="01000000000",
            )
            db.add(emp); db.commit(); db.refresh(emp)

        admin_member = models.Member(
            login_id="0000",
            password_hash=bcrypt.hash("0000"),
            user_type="EMPLOYEE",
            emp_id=emp.emp_id,
            dept_no=dept.dept_no,
            role_no=role.role_no,
        )
        db.add(admin_member); db.commit()
        log.info("✅ 기본 관리자 생성 완료 (ID: 0000 / PW: 0000)")
    except Exception as e:
        db.rollback()
        log.exception("❌ 기본 관리자 초기화 오류: %s", e)
    finally:
        db.close()

# ------------------------------------------------
# 부팅 시 기본 프로젝트 자동 시드 (없으면 1개 생성)
# ------------------------------------------------
@app.on_event("startup")
def seed_default_project():
    db = SessionLocal()
    try:
        exists = db.scalar(select(models.Project.project_id))
        if exists:
            return  # 하나라도 있으면 스킵

        proj = models.Project()
        # 모델에 따라 name 또는 title만 있을 수 있으므로 방어적으로 설정
        if hasattr(proj, "project_name"):
            setattr(proj, "project_name", "Default Project")
        elif hasattr(proj, "name"):
            setattr(proj, "name", "Default Project")
        elif hasattr(proj, "title"):
            setattr(proj, "title", "Default Project")
            # 2) 설명(선택)
        for field in ("description", "project_desc", "detail"):
            if hasattr(proj, field):
                setattr(proj, field, "Seeded on startup")
                break

        # 3) 날짜(선택) - NOT NULL이면 안전하게 채움
        now = datetime.utcnow()
        if hasattr(proj, "start_date") and getattr(proj, "start_date", None) is None:
            setattr(proj, "start_date", now)
        if hasattr(proj, "end_date") and getattr(proj, "end_date", None) is None:
            setattr(proj, "end_date", now + timedelta(days=30))

        # 4) 상태(선택)
        for field in ("status", "project_status"):
            if hasattr(proj, field) and getattr(proj, field, None) is None:
                setattr(proj, field, "PLANNED")

        # 5) 소유자(선택) - 관리자(emp_no=0000) 있으면 연결
        owner_id = None
        if hasattr(models, "Employee") and hasattr(models.Employee, "emp_id"):
            owner_id = db.scalar(select(models.Employee.emp_id).where(models.Employee.emp_no == "0000"))
        for field in ("owner_emp_id", "owner_id", "manager_emp_id"):
            if hasattr(proj, field) and getattr(proj, field, None) is None:
                setattr(proj, field, owner_id)


        db.add(proj)
        db.commit()
        db.refresh(proj)

        pid = getattr(proj, "project_id", getattr(proj, "id", None))
        log.info(f"🌱 기본 프로젝트 생성 완료: id={pid}")
    except Exception as e:
        db.rollback()
        log.exception("❌ 기본 프로젝트 시드 실패: %s", e)
    finally:
        db.close()

# ------------------------------------------------
# 디버그: 등록된 경로 출력
# ------------------------------------------------
@app.on_event("startup")
async def _print_routes():
    print("=== MOUNTED ROUTES ===")
    for r in app.routes:
        methods = list(getattr(r, "methods", []) or [])
        path = getattr(r, "path", "")
        if methods and path:
            print(methods, path)
