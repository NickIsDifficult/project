# backend/app/database.py
import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# backend/.env 를 절대경로로 로드
BASE_DIR = Path(__file__).resolve().parent.parent  # backend/app -> backend
load_dotenv(BASE_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Check backend/.env")

# 중요: mysql+mysqlconnector 사용 시 타임아웃 키는 connect_timeout가 아니라 "connection_timeout"
# (mysql-connector-python 규약)
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=1800,
    connect_args={
        "connection_timeout": 5,
        "use_pure": True
    }
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
