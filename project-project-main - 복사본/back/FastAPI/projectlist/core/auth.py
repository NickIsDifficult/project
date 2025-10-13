# app/core/auth.py
from datetime import datetime, timedelta

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app import models
from database import get_db

# ---------------------------
# 설정
# ---------------------------
SECRET_KEY = "your_secret_key_here"  # 🔒 실제 서비스에서는 환경변수로 관리
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24시간

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


# ---------------------------
# 해시/검증
# ---------------------------
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


# ---------------------------
# JWT 생성
# ---------------------------
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# ---------------------------
# 현재 로그인 사용자 정보
# ---------------------------
# def get_current_user(
#     token: str = Depends(oauth2_scheme),
#     db: Session = Depends(get_db),
# ):
#     credentials_exception = HTTPException(
#         status_code=status.HTTP_401_UNAUTHORIZED,
#         detail="유효하지 않은 인증 토큰입니다.",
#         headers={"WWW-Authenticate": "Bearer"},
#     )

#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         login_id: str = payload.get("sub")
#         if login_id is None:
#             raise credentials_exception
#     except JWTError:
#         raise credentials_exception


#     user = db.query(models.Member).filter(models.Member.login_id == login_id).first()
#     if user is None:
#         raise credentials_exception
#     return user
def get_current_user(db: Session = Depends(get_db)):
    """⚠️ 테스트용 임시 인증 우회 (항상 첫 번째 직원으로 인증 처리)"""
    return db.query(models.Employee).first()
