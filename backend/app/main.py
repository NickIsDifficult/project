import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models
from app.database import Base, engine, SessionLocal
from app.routers import (
    activity_router,
    comment_router,
    department_router,
    employee_router,
    history_router,
    milestone_router,
    notification_router,
    project_router,
    task_router,
)
from app.routers.auth import login, signup, me as me_router
from app.routers.admin import dept_role as admin_dept_role
from app.routers.admin import account as admin_account

from passlib.hash import bcrypt
from sqlalchemy import select

logging.basicConfig(level=logging.INFO)

logging.info("🚀 DB 연결 시도 중...")
Base.metadata.create_all(bind=engine)
logging.info("✅ DB 테이블 생성 완료")

# ---------------------------
# FastAPI 앱 생성
# ---------------------------
app = FastAPI(title="업무툴 프로젝트 관리")

# ✅ 프론트엔드 허용 도메인 (Vite: 5173)
origins = ["http://localhost:5173",
           "http://localhost:5174",
           "http://127.0.0.1:5173",
           "http://127.0.0.1:5174"]
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
app.include_router(login.router)
app.include_router(signup.router)
app.include_router(project_router.router)  # 프로젝트 & 멤버
app.include_router(task_router.router)  # 태스크
app.include_router(comment_router.router)  # 코멘트
app.include_router(milestone_router.router)  # 마일스톤
app.include_router(department_router.router)
app.include_router(employee_router.router)
app.include_router(history_router.router)
app.include_router(notification_router.router)
app.include_router(activity_router.router)  # ✅ 프로젝트 활동 피드
app.include_router(me_router.router)
app.include_router(admin_dept_role.router)
app.include_router(admin_account.router)

# ---------------------------
# 헬스 체크
# ---------------------------
@app.get("/")
def root():
    return {"message": "Project Management API is running!"}

@app.on_event("startup")
def create_default_admin():
    db = SessionLocal()
    admin_exists = db.scalar(select(models.Member).where(models.Member.login_id == "0000"))
    if not admin_exists:
        print("⚙️  기본 관리자 계정 생성 중...")

        # 기본 부서/직급이 존재하지 않으면 생성
        dept = db.scalar(select(models.Department).where(models.Department.dept_no == "99"))
        if not dept:
            dept = models.Department(dept_no="99", dept_name="관리자")
            db.add(dept)
            db.commit()
            db.refresh(dept)

        role = db.scalar(select(models.Role).where(models.Role.role_no == "99"))
        if not role:
            role = models.Role(role_no="99", role_name="관리자")
            db.add(role)
            db.commit()
            db.refresh(role)

            emp = models.Employee(
            emp_no="0000",
            dept_id=dept.dept_id,
            role_id=role.role_id,
            dept_no=dept.dept_no,
            role_no=role.role_no,
            name="관리자",
            email="admin@example.com",
            mobile="01000000000",
        )
        db.add(emp)
        db.commit()
        db.refresh(emp)


    # 관리자 멤버 생성
        row = models.Member(
            login_id="0000",
            password_hash=bcrypt.hash("0000"),
            user_type="EMPLOYEE",
            emp_id=emp.emp_id,
            dept_no=dept.dept_no,
            role_no=role.role_no
        )
        db.add(row)
        db.commit()
        print("✅ admin 계정 생성 완료 (아이디 : 0000 / 비밀번호: 0000)")
    db.close()
