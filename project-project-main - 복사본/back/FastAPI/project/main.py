from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import project_router, task_router

app = FastAPI()

# ✅ CORS 설정 (라우터 추가 전에 실행해야 함)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ 라우터 등록
app.include_router(project_router.router)
app.include_router(task_router.router)
