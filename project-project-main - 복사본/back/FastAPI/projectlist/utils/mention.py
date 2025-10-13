# app/utils/mention.py
import re
from typing import List

from sqlalchemy.orm import Session

from models.employee import Employee

# ✅ @username, @홍길동, @lee_hs 등 다양한 케이스 지원
MENTION_PATTERN = re.compile(r"@([A-Za-z0-9가-힣._-]+)")


def extract_mentions(text: str) -> List[str]:
    """
    본문에서 '@멘션' 문자열 추출
    예시: "@lee_hs 프로젝트 확인해주세요" → ["lee_hs"]
    """
    if not text:
        return []
    return MENTION_PATTERN.findall(text)


def resolve_recipients(
    db: Session, identifiers: List[str], by: str = "emp_no"
) -> List[int]:
    """
    멘션 문자열(@아이디)을 Employee.emp_id 리스트로 변환
    - by: 매핑 기준 ('emp_no', 'name', 'email')
    """
    if not identifiers:
        return []

    query = None
    if by == "name":
        query = db.query(Employee.emp_id).filter(Employee.name.in_(identifiers))
    elif by == "email":
        query = db.query(Employee.emp_id).filter(Employee.email.in_(identifiers))
    else:
        query = db.query(Employee.emp_id).filter(Employee.emp_no.in_(identifiers))

    return [row.emp_id for row in query.all()]


def resolve_mentions(db: Session, text: str, by: str = "emp_no") -> List[int]:
    """
    본문에서 '@멘션' → 실제 직원 emp_id 리스트로 변환
    """
    mentions = extract_mentions(text)
    if not mentions:
        return []
    return resolve_recipients(db, mentions, by)
