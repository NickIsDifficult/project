# app/main.py
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from passlib.hash import bcrypt
from sqlalchemy import select

from app import models  # 모델 패키지를 로드해 메타데이터를 채움
from app.database import Base, SessionLocal, engine
from app.routers import notices_router  # ✅ 공지 라우터
from app.routers import search  # ✅ 추가
from app.routers import (
    activity_router,
    ai_router,
    comment_router,
    department_router,
    employee_router,
    history_router,
    milestone_router,
    notification_router,
    preview_router,
    project_router,
    task_router,
)
from app.routers.admin import account as admin_account, dept_role as admin_dept_role
from app.routers.auth import login, me as me_router, signup
from app.routers.events_router import router as events_router
from app.routers.status_router import router as status_router
from app.routers.trash_router import router as trash_router
from app.routers.org.org_chart_router import router as org_chart_router

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("app")

log.info("🚀 DB 연결 시도 중...")
# 개발환경에서만 사용 권장(운영은 Alembic 사용 권장)
Base.metadata.create_all(bind=engine)
log.info("✅ DB 테이블 생성/동기화 완료")

# ---------------------------
# FastAPI 앱 생성
# ---------------------------
app = FastAPI(title="업무툴 프로젝트 관리")

# ✅ 프론트엔드 허용 도메인 (Vite: 5173/5174)
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]

# ---------------------------
# CORS 설정
# ---------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# DB 초기화 및 로그
# ---------------------------

logging.basicConfig(level=logging.INFO)

logging.info("🚀 DB 연결 시도 중...")
Base.metadata.create_all(bind=engine)
logging.info("✅ DB 테이블 생성 완료")

# ---------------------------
# (추가) 기초코드 보정 헬퍼
# ---------------------------

def ensure_department(db, dept_no: str, dept_name: str):
    """
    부서 존재 보정. 없으면 생성 후 반환.
    """
    dept = db.scalar(select(models.Department).where(models.Department.dept_no == dept_no))
    if not dept:
        dept = models.Department(dept_no=dept_no, dept_name=dept_name)
        db.add(dept)
        db.commit()
        db.refresh(dept)
    return dept

def ensure_role(db, role_no: str, role_name: str):
    """
    직급(역할) 존재 보정. 없으면 생성 후 반환.
    """
    role = db.scalar(select(models.Role).where(models.Role.role_no == role_no))
    if not role:
        role = models.Role(role_no=role_no, role_name=role_name)
        db.add(role)
        db.commit()
        db.refresh(role)
    return role

# ---------------------------
# 라우터 등록
# ---------------------------
# (기존 경로 설계에 맞게 prefix 적용 여부는 선택)
# auth
app.include_router(login.router)
app.include_router(signup.router)
app.include_router(me_router.router)

# core
app.include_router(project_router.router)
app.include_router(task_router.router)
app.include_router(comment_router.router)
app.include_router(milestone_router.router)
app.include_router(department_router.router)
app.include_router(employee_router.router)
app.include_router(org_chart_router)
app.include_router(history_router.router)
app.include_router(notification_router.router)
app.include_router(activity_router.router)
app.include_router(admin_dept_role.router)
app.include_router(admin_account.router)
app.include_router(events_router)
app.include_router(status_router)
app.include_router(trash_router)
app.include_router(ai_router.router)
app.include_router(search.router)
app.include_router(preview_router.router)
app.include_router(notices_router.router)


# ---------------------------
# 헬스 체크
# ---------------------------
@app.get("/")
def root():
    return {"message": "Project Management API is running!"}


@app.get("/healthz")
def healthz():
    return {"ok": True}

@app.on_event("startup")
def ensure_base_codes():
    db = SessionLocal()
    try:

        # 관리자(99)
        admin_dept = ensure_department(db, "99", "관리자")
        admin_role = ensure_role(db, "99", "관리자")

        # 외부인(90) — 변수명 그대로 dept / role 사용
        dept = ensure_department(db, "90", "외부인")
        role = ensure_role(db, "90", "외부인")

        log.info("✅ 기초코드 보정 완료: 부서/직급 90·99 보정")
    except Exception as e:
        db.rollback()
        log.exception("❌ 기초코드 보정 실패: %s", e)
    finally:
        db.close()

@app.on_event("startup")
def create_default_admin():
    db = SessionLocal()
    try:
        admin_exists = db.scalar(
            select(models.Member.member_id).where(models.Member.login_id == "0000")
        )
        if admin_exists:
            log.info("ℹ️ 기본 관리자(0000) 이미 존재. 초기화 스킵.")
            return

        log.info("⚙️ 기본 관리자(사원/멤버) 생성 시작...")

        # 99(관리자) 부서/직급 재확인(ensure_base_codes와 독립적으로 안전)
        admin_dept = db.scalar(select(models.Department).where(models.Department.dept_no == "99"))
        admin_role = db.scalar(select(models.Role).where(models.Role.role_no == "99"))

        # 사원
        emp = db.scalar(select(models.Employee).where(models.Employee.emp_no == "0000"))
        if not emp:
            emp = models.Employee(
                emp_no="0000",
                dept_id=getattr(admin_dept, "dept_id", None),
                role_id=getattr(admin_role, "role_id", None),
                dept_no=admin_dept.dept_no,
                role_no=admin_role.role_no,
                name="관리자",
                email="admin@example.com",
                mobile="01000000000",
            )
            db.add(emp)
            db.commit()
            db.refresh(emp)

        # 멤버
        admin_member = models.Member(
            login_id="0000",
            password_hash=bcrypt.hash("0000"),
            user_type="EMPLOYEE",  # (Enum이면 models.UserType.EMPLOYEE 로 교체)
            emp_id=emp.emp_id,
            dept_no=admin_dept.dept_no,
            role_no=admin_role.role_no,
        )
        db.add(admin_member)
        db.commit()

        log.info("✅ 기본 관리자 계정 생성 완료 (아이디: 0000 / 비밀번호: 0000)")
    except Exception as e:
        db.rollback()
        log.exception("❌ 기본 관리자 초기화 중 오류: %s", e)
    finally:
        db.close()
