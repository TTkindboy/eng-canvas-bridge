from __future__ import annotations

import asyncio
import re
from typing import Annotated, Literal

import logfire
from fastapi import APIRouter, Form, HTTPException, Query, UploadFile
from pydantic import BaseModel, ConfigDict, Json, ValidationError, ValidatorFunctionWrapHandler, WrapValidator

from ..dependencies import HTTPClient, CanvasAuth, get_settings
from ..parsers.base import DualSchedule, PlannerNote, TextPdfMixin
from ..parsers.eng10 import Eng10Schedule
from ..parsers.eng11 import Eng11Schedule

router = APIRouter(prefix="/pdfs")


class ImportMetadata(BaseModel):
    """Client-reported diagnostics, never an authentication source."""

    model_config = ConfigDict(str_max_length=256)

    user_id: str | None = None
    user_name: str | None = None
    course_id: str | None = None
    course_name: str | None = None
    file_id: str | None = None
    extension_version: str | None = None


def ignore_invalid_metadata(value: object, handler: ValidatorFunctionWrapHandler) -> ImportMetadata | None:
    try:
        return handler(value)
    except ValidationError:
        return None


def parse_schedule(data: bytes) -> DualSchedule:
    if data.startswith(b"PK"):
        return Eng11Schedule.from_bytes(data)
    pdf_text = TextPdfMixin.extract_text_from_pdf(data)
    if re.search(r"\bEng(?:lish)?\.?\s*11\b", pdf_text, re.IGNORECASE):
        return Eng11Schedule.from_pdf_text(pdf_text)
    return Eng10Schedule.from_bytes(data)


@router.get("/{file_id}", summary="Preview schedule from PDF or DOCX", response_model_exclude_none=True)
async def preview_schedule(client: HTTPClient, auth: CanvasAuth, file_id: int) -> DualSchedule:
    pdf_resp = await client.get(
        f"{get_settings().site_url}/files/{file_id}/download", # override baseurl bc no /api/v1
        headers=auth,
        follow_redirects=True,
    )
    pdf_resp.raise_for_status()
    return parse_schedule(pdf_resp.content)

@router.post("/upload", description="Preview schedule from PDF or DOCX upload")
async def preview_uploaded_schedule(
    pdf: UploadFile,
    metadata: Annotated[
        Json[ImportMetadata] | None, WrapValidator(ignore_invalid_metadata), Form(),
    ] = None,
) -> DualSchedule:
    filename = (pdf.filename or "<unknown>").replace("\\", "/").rsplit("/", 1)[-1]
    with logfire.span(
        "parse uploaded schedule {filename}", filename=filename[:256],
        content_type=pdf.content_type,
        **(metadata.model_dump(exclude_none=True) if metadata else {}),
    ) as span:
        data = await pdf.read()
        span.set_attribute("file_size_bytes", len(data))
        span.set_attribute("file_format", "docx" if data.startswith(b"PK") else "pdf")
        schedule = parse_schedule(data)
        span.set_attribute("parser", type(schedule).__name__)
        span.set_attribute("odd_count", len(schedule.odd_days))
        span.set_attribute("even_count", len(schedule.even_days))
        return schedule


@router.post("/add", summary="Add Canvas PlannerNotes from parsed schedule")
async def add_schedule_to_canvas(
    client: HTTPClient,
    auth: CanvasAuth,
    schedule: DualSchedule,
    day: Literal["odd", "even"],
    course_id: Annotated[
        int | None,
        Query(description="Canvas course ID, fails if already set on input schedule"),
    ] = None,
) -> list[PlannerNote]:
    notes = getattr(schedule, day + "_days")
    for note in notes:
        if course_id is not None and note.course_id is not None and note.course_id != course_id:
            raise HTTPException(status_code=422, detail=f"Note {note.id} belongs to course {note.course_id}, not {course_id}")
        if course_id is not None:
            note.course_id = course_id
    return await asyncio.gather(*(add_planner_note(client, auth, note) for note in notes))  # TODO: Add semaphore


async def add_planner_note(client: HTTPClient, auth: CanvasAuth, note: PlannerNote) -> PlannerNote: # TODO: return status
    """Sends a single request to add a planner note"""
    resp = await client.post(
        "/planner_notes",
        headers=auth,
        json=note.model_dump(mode="json", exclude={"id", "user_id"}, exclude_none=True) # Look at when have more time
    )
    resp.raise_for_status()
    return PlannerNote.model_validate(resp.json())
