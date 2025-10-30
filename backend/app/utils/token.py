# app/utils/token.py
import os
from datetime import datetime, timedelta
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.database import get_db
from app.models.member import Member

# ============================================
# ✅ 환경변수 로드
# ============================================
BASE_DIR = Path(__file__).resolve().parent.parent  # backend/app
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("SECRET_KEY", "change_this_in_production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "360"))

# ============================================
# ✅ 비밀번호 해시
# ============================================
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """평문 비밀번호를 bcrypt로 해시"""
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """평문과 해시 비교"""
    return pwd_context.verify(plain, hashed)

# ============================================
# ✅ JWT 토큰 생성
# ============================================
def create_access_token(
    data: dict,
    expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES,
) -> str:
    """JWT 액세스 토큰 생성"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ============================================
# ✅ JWT 토큰 파싱
# ============================================
def get_current_user(Authorization: str = Header(None), db=Depends(get_db)):
    """JWT 토큰에서 현재 로그인한 사용자(Member) 반환"""
    if Authorization is None or not Authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증 헤더가 누락되었습니다. (Bearer 토큰 필요)",
        )

    token = Authorization.split(" ")[1]  # ← 이 줄이 누락되어 있었음

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        login_id = payload.get("login_id")
        if not login_id:
            raise HTTPException(status_code=401, detail="토큰에 사용자 정보가 없습니다.")
    except JWTError:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")

    user = db.query(Member).filter(Member.login_id == login_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="사용자를 찾을 수 없습니다.")
    return user


# ============================================
# ✅ get_current_member (라우터 호환용 별칭)
# ============================================
def get_current_member(Authorization: str = Header(None), db=Depends(get_db)):
    """notices_router 등에서 사용하는 이름. get_current_user와 동일."""
    return get_current_user(Authorization=Authorization, db=db)
