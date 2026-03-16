from __future__ import annotations
from typing import TypedDict
import re

import pymupdf
from fastapi import APIRouter
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel

from .dependencies import HTTPClient, canvas_auth, SITE_URL

router = APIRouter(prefix="/pdfs")

class PlannerNote(TypedDict):
    id: int
    title: str
    description: str
    user_id: int
    course_id: int | None
    todo_date: str | None # ISO8601 string
    # does not include linked object data or workflow state

def extract_lines_from_pdf(pdf_bytes: bytes) -> str: # maybe list[str] later
    doc = pymupdf.Document(stream=pdf_bytes)
    assert doc.page_count == 1
    return doc.get_page_text(0)

# MAYBE: abc later
class Eng10Schedule(BaseModel):
    odd_days: list[PlannerNote]
    even_days: list[PlannerNote]

    @classmethod
    def from_pdf_text(cls, pdf_text: str) -> Eng10Schedule:
        matches = re.findall(
            r"^(ODD|EVEN) DAYS\s*$(.*?)(?=^(?:ODD|EVEN) DAYS\s*$|\Z)", # no (?ms) inline because is doen below
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
        print(section_text)
        return []

@router.get("/{file_id}", summary="Get PDF content as text", response_class=PlainTextResponse)
async def get_pdf_content(client: HTTPClient, file_id: int) -> str:
    pdf_resp = await client.get(
        f"{SITE_URL}/files/{file_id}/download", # override baseurl bc no /api/v1
        headers=canvas_auth(),
        follow_redirects=True,
    )
    pdf_resp.raise_for_status()
    return str(Eng10Schedule.from_pdf_text(extract_lines_from_pdf(pdf_resp.content)))
