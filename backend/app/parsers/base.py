from __future__ import annotations
from pydantic import BaseModel
from abc import ABC, abstractmethod

class ScheduleParser(BaseModel, ABC):
    @classmethod
    @abstractmethod
    def from_pdf_text(cls, pdf_text: str, course_id: int | None = None) -> ScheduleParser:
        ...
    