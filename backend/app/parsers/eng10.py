from __future__ import annotations
from typing import override
import re
from .base import DualSchedule, TextPdfMixin, nearest_matching_date, PlannerNote


class Eng10Schedule(DualSchedule, TextPdfMixin):
    @classmethod
    @override
    def from_pdf_bytes(cls, pdf_bytes: bytes, course_id: int | None = None) -> Eng10Schedule:
        pdf_text = cls.extract_text_from_pdf(pdf_bytes)
        matches = re.findall(
            r"^(ODD|EVEN) DAYS\s*$(.*?)(?=^(?:ODD|EVEN) DAYS\s*$|\Z)", # no (?ms) inline because defined down below
            pdf_text,
            re.MULTILINE | re.DOTALL
        )
        assert len({k for k, _ in matches}) == len(matches) # check no duplicate sections # TODO: migrate from assert
        result: dict[str, str] = dict(matches)
        return cls._from_sections(result, course_id=course_id)

    @classmethod
    def _from_sections(cls, pdf_text: dict[str, str], course_id: int | None = None) -> Eng10Schedule:
        return cls(
            odd_days=cls._parse_section(pdf_text["ODD"], course_id=course_id),
            even_days=cls._parse_section(pdf_text["EVEN"], course_id=course_id)
        )

    @staticmethod
    def _parse_section(section_text: str, course_id: int | None = None) -> list[PlannerNote]: # maybe add a extra node section (separated by ; in the source)
        matches = re.findall(
            r"^(?P<weekday>Th|M|T|W|F)\s+(?P<month>[1-9]|1[0-2])/(?P<day>[1-9]|[12]\d|3[01])\s*(?:--|[-–—])\s*(?P<assignment>.+?)\s*$", # no (?m) because multiline defined below
            section_text,
            re.MULTILINE
        )
        assert len(matches) == sum( # TODO: migrate from assert
            1 for line in section_text.splitlines()
            if line.strip() and "NO CLASS" not in line # this seems really fragile and dangerous but i'm too lazy to make it better rn
        )
        return [
            PlannerNote(todo_date=nearest_matching_date(int(month), int(day), weekday), title=assignment, course_id=course_id) # TODO: COMPLETE Parameters
            for weekday, month, day, assignment
            in matches
        ]
