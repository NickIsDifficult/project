# app/schemas/event.py
from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_serializer, field_validator

IN_FMT = "%Y-%m-%d %H:%M"
OUT_FMT = "%Y-%m-%d %H:%M"


def _parse_dt(v):
    if v is None:
        return None
    if isinstance(v, datetime):
        return v.astimezone(timezone.utc).replace(tzinfo=None) if v.tzinfo else v
    if isinstance(v, str):
        s = v.strip()
        try:
            if s.endswith("Z"):
                s = s[:-1] + "+00:00"
            dt = datetime.fromisoformat(s)
            return dt.astimezone(timezone.utc).replace(tzinfo=None) if dt.tzinfo else dt
        except Exception:
            pass
        try:
            return datetime.strptime(s, IN_FMT)
        except Exception:
            pass
    raise ValueError("지원하지 않는 datetime 포맷입니다. ISO 또는 'YYYY-MM-DD HH:mm'를 사용하세요.")


class _DTInMixin(BaseModel):
    """입력은 무엇이 와도 datetime으로 정규화 (None은 통과)"""

    @field_validator("start_date", mode="before", check_fields=False)
    @classmethod
    def _v_start(cls, v):
        return _parse_dt(v)

    @field_validator("end_date", mode="before", check_fields=False)
    @classmethod
    def _v_end(cls, v):
        return _parse_dt(v)


class _DTOutMixin(BaseModel):
    """응답은 'YYYY-MM-DD HH:mm'로 직렬화 (None 안전)"""

    @field_serializer("start_date", "end_date", check_fields=False)
    def _s_fmt(self, v: Optional[datetime], _info):
        return v.strftime(OUT_FMT) if isinstance(v, datetime) else None


# ---------- 공통 ----------
class EventBase(_DTInMixin, _DTOutMixin):
    project_id: int
    title: str
    description: Optional[str] = None
    start_date: datetime
    end_date: datetime
    model_config = ConfigDict(from_attributes=True)


# ---------- 요청 ----------
class EventCreate(EventBase):
    pass


class EventUpdate(_DTInMixin):
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


# ---------- 응답 ----------
class EventOut(EventBase):
    id: int


# ---------- 검색 ----------
class EventSearch(_DTInMixin):
    project_id: int
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    keyword: Optional[str] = None
