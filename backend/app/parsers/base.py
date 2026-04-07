from __future__ import annotations
from datetime import date
from math import inf
import calendar
from pydantic import BaseModel, RootModel
from abc import ABC, abstractmethod

from ..routers.pdfs import PlannerNote # TODO: maybe move here or something later if this gets too circular

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
    def extract_text_from_pdf(pdf_bytes: bytes) -> str: # maybe list[str] later
        pass


class BaseSchedule(ABC):
    @classmethod
    @abstractmethod
    def from_pdf_bytes(cls, pdf_bytes: bytes, course_id: int | None = None) -> Schedule:
        ...

class DualSchedule(BaseModel, BaseSchedule, ABC):
    odd_days: list[PlannerNote]
    even_days: list[PlannerNote]

class SingleSchedule(RootModel[list[PlannerNote]], BaseSchedule, ABC):
    ...

type Schedule = DualSchedule | SingleSchedule
