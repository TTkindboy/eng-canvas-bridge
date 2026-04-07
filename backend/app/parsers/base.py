from __future__ import annotations
import calendar
from abc import ABC, abstractmethod
from datetime import date, datetime
from math import inf
from typing import Annotated, Any

import pymupdf
from pydantic import BaseModel, BeforeValidator, Field, RootModel


def _parse_date(v: Any) -> date:
    if isinstance(v, str):
        return datetime.fromisoformat(v).date()
    if isinstance(v, datetime):
        return v.date()
    return v

type ParsedDate = Annotated[
    date,
    BeforeValidator(_parse_date)
]

class PlannerNote(BaseModel): # TODO: maybe move to separate file later
    id: int | None = None # ONLY POST CREATION
    title: str
    description: str | None = None
    user_id: int | None = None # ONLY POST CREATION
    course_id: int | None = None # you should have to explicitly set to None
    todo_date: ParsedDate | None # you should have to explicitly set to None # MAYBE: make AwareDateTime later
    # does not include linked object data or workflow state

WEEKDAY_MAP = { # TODO: ADD WEEKEND PARSING
    "M": calendar.MONDAY,
    "T": calendar.TUESDAY,
    "W": calendar.WEDNESDAY,
    "Th": calendar.THURSDAY,
    "TH": calendar.THURSDAY, # Capital
    "F": calendar.FRIDAY,
}

def nearest_matching_date(month: int, day: int, weekday: str | int | calendar.Day, base_date: date | None = None) -> date:
    if base_date is None:
        base_date = date.today()
    if isinstance(weekday, str):
        weekday = WEEKDAY_MAP[weekday]
    best = None
    best_distance = inf

    for year in range(base_date.year - 6, base_date.year + 7): # MAYBE: adjust bounds later
        try:
            d = date(year, month, day)
        except ValueError:
            continue
        if d.weekday() != weekday:
            continue
        distance = abs((d - base_date).days)
        if distance < best_distance:
            best = d
            best_distance = distance
    assert best is not None # TODO: migrate from assert
    return best

class TextPdfMixin:
    @staticmethod
    def extract_text_from_pdf(pdf_bytes: bytes) -> str:
        doc = pymupdf.Document(stream=pdf_bytes) # maybe use context manager 🤷
        assert doc.page_count == 1 # TODO: migrate from assert # TODO: Support multi page pdfs
        return doc.get_page_text(0)



class BaseSchedule(ABC):
    @classmethod
    @abstractmethod
    def from_pdf_bytes(cls, pdf_bytes: bytes, course_id: int | None = None) -> Schedule:
        ...

class DualSchedule(BaseModel, BaseSchedule, ABC):
    odd_days: list[PlannerNote] = Field(serialization_alias="odd")
    even_days: list[PlannerNote] = Field(serialization_alias="even")

class SingleSchedule(RootModel[list[PlannerNote]], BaseSchedule, ABC):
    ...

type Schedule = DualSchedule | SingleSchedule
