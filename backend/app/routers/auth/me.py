from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.user import ProfileOut, ProfilePatch, PasswordChange
from app.services.user_service import (
    get_my_profile_aggregated,
    update_my_profile_xref,
    change_my_password,
)
from app.utils.token import get_current_user
from app.models.member import Member

# ✅ prefix 변경: /auth → /api/member
router = APIRouter(prefix="/api/member", tags=["member"])

@router.get("/me", response_model=ProfileOut)
def get_me(
    db: Session = Depends(get_db),
    me: Member = Depends(get_current_user),
):
    return get_my_profile_aggregated(db, me)

@router.patch("/me", response_model=ProfileOut)
def patch_me(
    payload: ProfilePatch,
    db: Session = Depends(get_db),
    me: Member = Depends(get_current_user),
):
    return update_my_profile_xref(
        db,
        me,
        name=payload.name,
        email=payload.email,
    )

@router.put("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def put_me_password(
    payload: PasswordChange,
    db: Session = Depends(get_db),
    me: Member = Depends(get_current_user),
):
    ok, msg = change_my_password(db, me, payload.current, payload.next)
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
