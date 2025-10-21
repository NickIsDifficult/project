# app/utils/token.py
import os
import unicodedata
from datetime import datetime, timedelta
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from passlib.exc import UnknownHashError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.member import Member


# ============================================================
# ✅ 환경 변수 로드 (.env)
# ============================================================
BASE_DIR = Path(__file__).resolve().parent.parent  # backend/app
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("SECRET_KEY", "change_this_in_production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))


# ============================================================
# ✅ bcrypt 전용 컨텍스트
# ============================================================
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ============================================================
# ✅ 비밀번호 해시 / 검증 (레거시 호환 포함)
# ============================================================
def hash_password(password: str) -> str:
    """새 비밀번호를 bcrypt로 해시"""
    return pwd_context.hash(password)


def _is_bcrypt_like(hashed: str) -> bool:
    """bcrypt 포맷 여부($2a$ / $2b$ / $2y$)"""
    return isinstance(hashed, str) and hashed.startswith(("$2a$", "$2b$", "$2y$"))


def _norm(s: str) -> str:
    """유니코드 정규화 + 공백/개행 제거"""
    return unicodedata.normalize("NFC", (s or "")).strip()


def verify_password(plain: str, hashed: str) -> bool:
    """
    ⚙️ 레거시 호환 규칙 (기존처럼 동작)
    1️⃣ bcrypt 해시면 bcrypt 검증
    2️⃣ UnknownHashError 발생 시 평문 비교
    3️⃣ bcrypt 아님(과거 평문 저장 등) → 평문 + 정규화 비교
    """
    if _is_bcrypt_like(hashed):
        try:
            return pwd_context.verify(plain, hashed)
        except UnknownHashError:
            # bcrypt 식별 실패 시 평문 비교
            return _norm(plain) == _norm(hashed)
    # bcrypt 포맷이 아닌 경우(예: 평문)
    return _norm(plain) == _norm(hashed)


# ============================================================
# ✅ JWT 토큰 생성
# ============================================================
def create_access_token(data: dict, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES) -> str:
    """JWT 액세스 토큰 생성"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ============================================================
# ✅ 현재 사용자 정보 가져오기 (JWT 인증)
# ============================================================
def get_current_user(Authorization: str = Header(None), db: Session = Depends(get_db)):
    """Authorization 헤더에서 사용자 정보 추출"""
    if Authorization is None or not Authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증 헤더가 누락되었습니다.",
        )

    token = Authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        login_id = payload.get("login_id")
        if not login_id:
            raise HTTPException(status_code=401, detail="토큰에 사용자 정보가 없습니다.")
    except JWTError:
        raise HTTPException(status_code=401, detail="토큰이 유효하지 않습니다.")

    user = db.query(Member).filter(Member.login_id == login_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="사용자를 찾을 수 없습니다.")

    return user
