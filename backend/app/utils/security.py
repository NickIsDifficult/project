# app/utils/security.py
from passlib.context import CryptContext
from passlib.exc import UnknownHashError

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_or_plain: str) -> tuple[bool, bool]:
    """
    returns (is_valid, needs_rehash)
    - hashed_or_plain 이 bcrypt가 아니면 평문으로 간주하여 비교
    - 평문 일치 시 True, 그리고 rehash 필요(True) 반환
    """
    try:
        # bcrypt 형태면 정상 검증
        ok = pwd_context.verify(plain_password, hashed_or_plain)
        return ok, (ok and pwd_context.needs_update(hashed_or_plain))
    except UnknownHashError:
        # bcrypt 아님 → 과거 평문 저장으로 보고 비교
        return plain_password == hashed_or_plain, True  # rehash 필요

def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)
