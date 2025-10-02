from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

# ⬇ 모듈이 아니라 router 객체를 직접 import
from app.routers.auth.signup import router as signup_router
from app.routers.auth.login import router as login_router

app = FastAPI(title="colink")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/healthz")
def healthz():
    return {"ok": True}

@app.exception_handler(IntegrityError)
async def handle_integrity_error(request: Request, exc: IntegrityError):
    return JSONResponse(status_code=400, content={"detail": "이미 사용 중인 정보(이메일/연락처/아이디)입니다."})

@app.exception_handler(SQLAlchemyError)
async def handle_sqlalchemy_error(request: Request, exc: SQLAlchemyError):
    return JSONResponse(status_code=500, content={"detail": "DB 오류가 발생했습니다."})

# ⬇ router 객체를 직접 등록
app.include_router(signup_router, prefix="/auth", tags=["auth"])
app.include_router(login_router)

@app.get("/")
def root():
    return {"status": "server is running"}
