from __future__ import annotations
from math import inf
import calendar
from datetime import date
import re

import pymupdf
from fastapi import APIRouter
from pydantic import BaseModel, Field

from .dependencies import HTTPClient, canvas_auth, SITE_URL

router = APIRouter(prefix="/pdfs")

def nearest_matching_date(month: int, day: int, weekday: str | int | calendar.Day, base_date: date | None = None) -> date:
    if base_date is None:
        base_date = date.today()
    weekday_map = {
        "M": calendar.MONDAY,
        "T": calendar.TUESDAY,
        "W": calendar.WEDNESDAY,
        "Th": calendar.THURSDAY,
        "TH": calendar.THURSDAY, # Capital
        "F": calendar.FRIDAY,
    }
    if isinstance(weekday, str):
        weekday = weekday_map[weekday]
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
    assert best is not None
    return best


class PlannerNote(BaseModel):
    id: int | None = None # ONLY POST CREATION
    title: str
    description: str | None = None
    user_id: int | None = None # ONLY POST CREATION
    course_id: int | None # you should have to explicitly set to None
    todo_date: date | None # you should have to explicitly set to None
    # does not include linked object data or workflow state

def extract_lines_from_pdf(pdf_bytes: bytes) -> str: # maybe list[str] later
    doc = pymupdf.Document(stream=pdf_bytes)
    assert doc.page_count == 1
    return doc.get_page_text(0)

# MAYBE: abc later
class Eng10Schedule(BaseModel):
    odd_days: list[PlannerNote] = Field(serialization_alias="odd")
    even_days: list[PlannerNote] = Field(serialization_alias="even")

    @classmethod
    def from_pdf_text(cls, pdf_text: str) -> Eng10Schedule:
        matches = re.findall(
            r"^(ODD|EVEN) DAYS\s*$(.*?)(?=^(?:ODD|EVEN) DAYS\s*$|\Z)", # no (?ms) inline because defined down below
            pdf_text,
            re.MULTILINE | re.DOTALL
        )
        assert len({k for k, _ in matches}) == len(matches) # check no duplcate sections
        result: dict[str, str] = dict(matches)
        return cls._from_sections(result)

    @classmethod
    def _from_sections(cls, pdf_text: dict[str, str]) -> Eng10Schedule:
        return cls(
            odd_days=cls._parse_section(pdf_text["ODD"]),
            even_days=cls._parse_section(pdf_text["EVEN"])
        )
    
    @staticmethod
    def _parse_section(section_text: str) -> list[PlannerNote]:
        matches = re.findall(
            r"^(?P<weekday>Th|M|T|W|F)\s+(?P<month>[1-9]|1[0-2])/(?P<day>[1-9]|[12]\d|3[01])\s*[-–—]\s*(?P<assignment>.+?)\s*$", # no (?m) because mutliline defined below
            section_text,
            re.MULTILINE
        )
        assert len(matches) == sum(1 for line in section_text.splitlines() if line.strip())
        return [
            PlannerNote(todo_date=nearest_matching_date(int(month), int(day), weekday), title=assignment, description="", course_id=2897) # TODO: COMPLETE Parameters
            for weekday, month, day, assignment
            in matches
        ]
            
            

@router.get("/{file_id}", summary="Get PDF content", response_model_exclude_none=True)
async def get_pdf_content(client: HTTPClient, file_id: int) -> Eng10Schedule:
    pdf_resp = await client.get(
        f"{SITE_URL}/files/{file_id}/download", # override baseurl bc no /api/v1
        headers=canvas_auth(),
        follow_redirects=True,
    )
    pdf_resp.raise_for_status()
    return Eng10Schedule.from_pdf_text(extract_lines_from_pdf(pdf_resp.content))
