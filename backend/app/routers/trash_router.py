from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/trash", tags=["trash"])

# 간단 목업 스토리지 (DB 없을 때 테스트용)
class TrashItem(BaseModel):
    id: int
    title: Optional[str] = None
    table_name: str
    record_id: int
    deleted_at: datetime
    delete_reason: Optional[str] = None

# 시작 데이터
_TRASH: list[dict] = [
    TrashItem(
        id=1,
        title="보고서.pdf",
        table_name="files",
        record_id=101,
        deleted_at=datetime.utcnow(),
        delete_reason="테스트",
    ).model_dump()
]
_NEXT_ID = 2

@router.get("", response_model=List[TrashItem])  # GET /api/trash
def list_trash():
    return _TRASH

@router.post("/{trash_id}/restore")  # POST /api/trash/{id}/restore
def restore_item(trash_id: int):
    global _TRASH
    found = next((x for x in _TRASH if x["id"] == trash_id), None)
    if not found:
        raise HTTPException(status_code=404, detail="Trash item not found")
    # 실제로는 원래 테이블로 복원하는 로직 필요
    _TRASH = [x for x in _TRASH if x["id"] != trash_id]
    return {"ok": True, "restored_id": trash_id}

@router.delete("/{trash_id}/purge")  # DELETE /api/trash/{id}/purge
def purge_item(trash_id: int):
    global _TRASH
    before = len(_TRASH)
    _TRASH = [x for x in _TRASH if x["id"] != trash_id]
    if len(_TRASH) == before:
        raise HTTPException(status_code=404, detail="Trash item not found")
    return {"ok": True, "purged_id": trash_id}

@router.post("/upload")  # POST /api/trash/upload
def upload_to_trash(file: UploadFile = File(...)):
    """업로드된 파일을 '휴지통 항목'으로 바로 넣는 목업 엔드포인트."""
    global _NEXT_ID, _TRASH
    title = file.filename
    # 실제로는 파일 저장/DB insert가 필요
    item = TrashItem(
        id=_NEXT_ID,
        title=title or "제목 없음",
        table_name="files",
        record_id=1000 + _NEXT_ID,
        deleted_at=datetime.utcnow(),
        delete_reason="업로드로 휴지통 이동",
    ).model_dump()
    _TRASH.insert(0, item)
    _NEXT_ID += 1
    return {"ok": True, "id": item["id"], "title": item["title"]}
