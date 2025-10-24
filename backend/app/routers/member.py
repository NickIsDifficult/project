from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.member import Member,  WorkState
from app.schemas.member import MemberUpdate, MemberResponse, StatusUpdate
from app.utils.token import get_current_user

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

@router.get("/me", response_model=MemberResponse)
def get_my_info(current_user: Member = Depends(get_current_user)):
    """
    JWT 토큰을 기반으로 현재 로그인한 회원 정보 반환
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="인증된 사용자가 아닙니다.")
    return current_user

# ✅ 상태 변경 전용 엔드포인트
@router.put("/update-status/{member_id}", response_model=MemberResponse)
def update_member_status(member_id: int, payload: StatusUpdate, db: Session = Depends(get_db)):
    member = db.query(Member).filter(Member.member_id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    # ✅ 문자열을 Enum(WorkState) 객체로 변환
    try:
        member.current_state = WorkState(payload.current_state)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid state: {payload.current_state}")

    db.commit()
    db.refresh(member)
    return member
