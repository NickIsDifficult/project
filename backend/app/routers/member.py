from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.member import Member
from app.schemas.member import MemberUpdate, MemberResponse

router = APIRouter(prefix="/api/member", tags=["Member"])

@router.put("/update-info/{member_id}", response_model=MemberResponse)
def update_personal_info(member_id: int, payload: MemberUpdate, db: Session = Depends(get_db)):
    member = db.query(Member).filter(Member.member_id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    data = payload.dict(exclude_unset=True)  # ✅ dict로 변환
    if "current_state" in data:
        member.current_state = data["current_state"]
    if "email" in data:
        member.email = data["email"]

    db.commit()
    db.refresh(member)
    return member

@router.get("/me/{member_id}", response_model=MemberResponse)
def get_my_info(member_id: int, db: Session = Depends(get_db)):
    member = db.query(Member).filter(Member.member_id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return member
