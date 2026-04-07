from __future__ import annotations
import asyncio
from typing import Literal

from fastapi import APIRouter

from ..dependencies import HTTPClient, canvas_auth, get_settings
from ..parsers.eng10 import Eng10Schedule
from ..parsers.base import PlannerNote

router = APIRouter(prefix="/pdfs")

@router.get("/{file_id}", summary="Get PDF content", response_model_exclude_none=True)
async def get_pdf_content(client: HTTPClient, file_id: int) -> Eng10Schedule:
    pdf_resp = await client.get(
        f"{get_settings().site_url}/files/{file_id}/download", # override baseurl bc no /api/v1
        headers=canvas_auth(),
        follow_redirects=True,
    )
    pdf_resp.raise_for_status()
    return Eng10Schedule.from_pdf_bytes(pdf_resp.content)

@router.post("/{file_id}", summary="Parse PDF and add to planner")
async def parse_pdf_to_planner(client: HTTPClient, file_id: int, day: Literal["odd", "even"], course_id: int | None = None) -> list[PlannerNote]:
    # DUPLICATED CODE with get_pdf_content, maybe refactor later or add session caching
    pdf_resp = await client.get(
        f"{get_settings().site_url}/files/{file_id}/download", # override baseurl bc no /api/v1
        headers=canvas_auth(),
        follow_redirects=True,
    )
    pdf_resp.raise_for_status()

    schedule = Eng10Schedule.from_pdf_bytes(pdf_resp.content, course_id=course_id)
    return await asyncio.gather(*(add_planner_note(client, note) for note in getattr(schedule, day + "_days"))) # maybe add helper function in main.py for this


async def add_planner_note(client: HTTPClient, note: PlannerNote) -> PlannerNote: # TODO: return status
    """Sends a single request to add a planner note"""
    resp = await client.post(
        "/planner_notes",
        headers=canvas_auth(),
        json=note.model_dump(mode="json", exclude={"id", "user_id"}, exclude_none=True) # Look at when have more time
    )
    resp.raise_for_status()
    return PlannerNote.model_validate(resp.json())
