# app/utils/token.py
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, Header, HTTPException, status
from jose import ExpiredSignatureError, JWTError, jwt
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

# .env에서 ACCESS_TOKEN_EXPIRE_MINUTES 로드 + 방어 처리
try:
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "360"))
    if ACCESS_TOKEN_EXPIRE_MINUTES < 1:
        ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 최소 1시간
except Exception:
    ACCESS_TOKEN_EXPIRE_MINUTES = 360

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
# ✅ JWT 생성
# ============================================
def create_access_token(
    data: dict,
    expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES,
) -> str:
    """
    JWT 액세스 토큰 생성
    - UTC 기준 만료시간(exp) 설정
    - jose 호환을 위해 exp를 timestamp(int)로 변환
    """
    to_encode = data.copy()

    # 최소 유효시간 5분 보장
    if not expires_minutes or expires_minutes < 5:
        expires_minutes = 60

    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    to_encode["exp"] = int(expire.timestamp())

    try:
        encoded = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"토큰 생성 실패: {str(e)}",
        )


# ============================================
# ✅ JWT 검증 및 사용자 반환
# ============================================
def get_current_user(Authorization: str = Header(None), db=Depends(get_db)):
    """
    Authorization 헤더의 Bearer 토큰을 검증하고 Member 객체 반환
    """
    # --- 헤더 검사 ---
    if not Authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization 헤더가 없습니다. (Bearer 토큰 필요)",
        )

    if not Authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer 토큰 형식이 아닙니다.",
        )

    token = Authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="토큰이 비어 있습니다.")

    # --- JWT 디코드 ---
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        login_id = payload.get("login_id")
        if not login_id:
            raise HTTPException(status_code=401, detail="토큰에 사용자 정보가 없습니다.")
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="토큰이 만료되었습니다.")
    except JWTError:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"토큰 검증 실패: {e}")

    # --- DB 조회 ---
    user = db.query(Member).filter(Member.login_id == login_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="사용자를 찾을 수 없습니다.")

    return user


# ============================================
# ✅ 라우터 호환용 별칭
# ============================================
def get_current_member(Authorization: str = Header(None), db=Depends(get_db)):
    """notices_router 등에서 사용하는 이름. get_current_user와 동일."""
    return get_current_user(Authorization=Authorization, db=db)
