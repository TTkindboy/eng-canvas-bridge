from __future__ import annotations

import asyncio
from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Query, UploadFile

from ..dependencies import HTTPClient, canvas_auth, get_settings
from ..parsers.base import PlannerNote
from ..parsers.eng10 import Eng10Schedule

router = APIRouter(prefix="/pdfs")

@router.get("/{file_id}", summary="Preview schedule from PDF", response_model_exclude_none=True)
async def preview_schedule(client: HTTPClient, file_id: int) -> Eng10Schedule:
    pdf_resp = await client.get(
        f"{get_settings().site_url}/files/{file_id}/download", # override baseurl bc no /api/v1
        headers=canvas_auth(),
        follow_redirects=True,
    )
    pdf_resp.raise_for_status()
    return Eng10Schedule.from_pdf_bytes(pdf_resp.content)

@router.post("/upload", description="Preview schedule from PDF upload")
async def preview_uploaded_schedule(pdf: UploadFile) -> Eng10Schedule:
    return Eng10Schedule.from_pdf_bytes(await pdf.read())


@router.post("/add", summary="Add Canvas PlannerNotes from parsed schedule")
async def add_schedule_to_canvas(client: HTTPClient, schedule: Eng10Schedule, day: Literal["odd", "even"], course_id: Annotated[int | None, Query(description="Canvas course ID, fails if already set on input schedule")] | None = None) -> list[PlannerNote]:
    notes = getattr(schedule, day + "_days")
    for note in notes:
        if None not in (course_id, note.course_id) and note.course_id != course_id:
            raise HTTPException(status_code=422, detail=f"Note {note.id} belongs to course {note.course_id}, not {course_id}")
        note.course_id = course_id
    return await asyncio.gather(*(add_planner_note(client, note) for note in notes))  # TODO: Add semaphore


async def add_planner_note(client: HTTPClient, note: PlannerNote) -> PlannerNote: # TODO: return status
    """Sends a single request to add a planner note"""
    resp = await client.post(
        "/planner_notes",
        headers=canvas_auth(),
        json=note.model_dump(mode="json", exclude={"id", "user_id"}, exclude_none=True) # Look at when have more time
    )
    resp.raise_for_status()
    return PlannerNote.model_validate(resp.json())
