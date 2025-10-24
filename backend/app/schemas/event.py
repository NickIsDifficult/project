# app/schemas/event.py
from typing import Optional, List
from pydantic import BaseModel


class EventBase(BaseModel):
    project_id: int
    title: str
    description: str = ""
    start_date: str  # "YYYY-MM-DD HH:mm"
    end_date: str


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class EventOut(BaseModel):
    id: int
    project_id: int
    title: str
    description: str
    start_date: str
    end_date: str


class EventSearch(BaseModel):
    project_id: int
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    keyword: Optional[str] = None
