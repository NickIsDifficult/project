from pathlib import Path
import os
from datetime import datetime, timedelta

from dotenv import load_dotenv
from jose import jwt
from passlib.context import CryptContext

# .env 로드 (절대경로로 안전하게)
BASE_DIR = Path(__file__).resolve().parent.parent  # backend/app
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("SECRET_KEY", "change_this_in_production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# bcrypt 설정
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """평문 비밀번호를 bcrypt로 해시"""
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    """평문과 해시 비교"""
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES) -> str:
    """JWT 액세스 토큰 생성"""
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + timedelta(minutes=expires_minutes)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
