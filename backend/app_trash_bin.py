from datetime import datetime, timedelta
from typing import Optional, List
from random import randint
import os

from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy import String, BigInteger, DateTime, JSON, select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base, Mapped, mapped_column

# ======================
# DB 연결
# ======================
DATABASE_URL = "mysql+aiomysql://root:990113@localhost:3306/collab?charset=utf8mb4"

engine = create_async_engine(DATABASE_URL, echo=False)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
Base = declarative_base()

UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def get_db():
    async with SessionLocal() as session:
        yield session

# ======================
# 테이블
# ======================
class TrashBin(Base):
    __tablename__ = "trash_bin"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    table_name: Mapped[str] = mapped_column(String(100), nullable=False)
    record_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    snapshot: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    deleted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    delete_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

# ======================
# 스키마
# ======================
class TrashItemIn(BaseModel):
    table_name: str
    record_id: int
    title: Optional[str] = None
    snapshot: Optional[dict] = None
    delete_reason: Optional[str] = None

class TrashItemOut(BaseModel):
    id: int
    table_name: str
    record_id: int
    title: Optional[str]
    deleted_at: datetime
    delete_reason: Optional[str]

    class Config:
        from_attributes = True

# ======================
# FastAPI
# ======================
app = FastAPI(title="Collab Tool Trash Bin")

# ✅ 서버 시작 시 테이블 생성
@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# ----------------------
# 파일 업로드 → 휴지통 이동
# ----------------------
@app.post("/upload")
async def upload_file(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    # 실제 파일 저장
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # 휴지통 기록 추가
    trash = TrashBin(
        table_name="files",
        record_id=randint(1000, 9999),
        title=file.filename,
        snapshot={"path": file_path, "size": os.path.getsize(file_path)},
        delete_reason="업로드 후 휴지통 이동",
        expires_at=datetime.utcnow() + timedelta(days=30),
    )
    db.add(trash)
    await db.commit()
    await db.refresh(trash)

    return {"ok": True, "trash_id": trash.id, "filename": file.filename}

# ----------------------
# 휴지통 목록
# ----------------------
@app.get("/trash", response_model=List[TrashItemOut])
async def list_trash(db: AsyncSession = Depends(get_db)):
    stmt = select(TrashBin).order_by(TrashBin.deleted_at.desc())
    res = await db.scalars(stmt)
    return res.all()

# ----------------------
# 복원
# ----------------------
@app.post("/trash/{trash_id}/restore")
async def restore_item(trash_id: int, db: AsyncSession = Depends(get_db)):
    t = await db.get(TrashBin, trash_id)
    if not t:
        raise HTTPException(404, "not found")
    await db.delete(t)
    await db.commit()
    return {"ok": True, "message": f"{t.title} restored"}

# ----------------------
# 완전 삭제
# ----------------------
@app.delete("/trash/{trash_id}/purge")
async def purge_item(trash_id: int, db: AsyncSession = Depends(get_db)):
    t = await db.get(TrashBin, trash_id)
    if not t:
        raise HTTPException(404, "not found")

    # 파일 삭제 (있으면)
    if t.snapshot and "path" in t.snapshot:
        try:
            os.remove(t.snapshot["path"])
        except FileNotFoundError:
            pass

    await db.delete(t)
    await db.commit()
    return {"ok": True, "message": f"{t.title} permanently deleted"}

# ----------------------
# 만료된 항목 자동 삭제
# ----------------------
@app.delete("/trash/cleanup")
async def cleanup_expired(db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    stmt = select(TrashBin).where(TrashBin.expires_at < now)
    res = await db.scalars(stmt)
    expired = res.all()
    deleted_count = 0
    for t in expired:
        if t.snapshot and "path" in t.snapshot:
            try:
                os.remove(t.snapshot["path"])
            except FileNotFoundError:
                pass
        await db.delete(t)
        deleted_count += 1
    await db.commit()
    return {"ok": True, "deleted": deleted_count}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React 개발 서버 주소
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
