import asyncio
import logging
from collections.abc import Iterator
from typing import Any

import httpx
from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field, TypeAdapter

from ..dependencies import HTTPClient, canvas_auth
from ..parsers.base import PlannerNote

router = APIRouter(prefix="/courses")
logger = logging.getLogger(__name__)

class Course(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: int
    name: str
    course_code: str

 # MAYBE: sort by date modified in future?(might add too many api calls)
class CourseFile(BaseModel):
    model_config = ConfigDict(extra="allow")

    file_id: int = Field(validation_alias="content_id")
    item_id: int = Field(validation_alias="id") # might remove later if still not needed
    title: str

# MAYBE: include IDs later
class BulkDeleteResult(BaseModel):
    total: int
    deleted: int
    failed: int


@router.get("")
async def get_courses(client: HTTPClient, inactive: bool = False) -> list[Course]:
    params: dict[str, Any] = {"per_page": 100}
    if not inactive:
        params["enrollment_state"] = "active"
    courses_resp = await client.get("/courses", headers=canvas_auth(), params=params)
    courses_resp.raise_for_status()
    return courses_resp.json()

# Maybe add query parameter to limit to schedules
@router.get("/{course_id}/pdfs", summary="List course PDFs")
async def get_pdfs(client: HTTPClient, course_id: int) -> list[CourseFile]: # TODO: Strengthen include parameter
    # assumes filenames include .pdf, which is not always the case. Maybe use mime_class in future
    params: dict[str, Any] = {"include": ["items"], "per_page": 100, "search_term": ".pdf"}
    resp = await client.get(f"/courses/{course_id}/modules", headers=canvas_auth(), params=params)
    resp.raise_for_status()
    return [
        file
        for _, file in sorted(iter_files(resp.json()), key=lambda t: t[0])
    ]

def iter_files(modules: list[dict[str, Any]]) -> Iterator[tuple[tuple[int, int], CourseFile]]:
    for module in modules:
        for item in module["items"]:
            if item["type"] == "File":
                yield (module["position"], item["position"]), CourseFile.model_validate(item)


_planner_notes_adapter = TypeAdapter(list[PlannerNote])

async def delete_note(client: httpx.AsyncClient, note: PlannerNote) -> bool:
    try:
        resp = await client.delete(f"/planner_notes/{note.id}", headers=canvas_auth())
        resp.raise_for_status()
        logger.info("Deleted note: %s (%s)", note.title, note.todo_date)
        return True
    except httpx.HTTPError as e:
        logger.error("Failed to delete note: %s (%s): %s", note.title, note.todo_date, e)
        return False

# TODO: Add semaphore
@router.delete("/{course_id}/notes", summary="Delete all planner notes for a course") # might not be idiomatic for webapp
async def delete_notes(client: HTTPClient, course_id: int) -> BulkDeleteResult:
    params = {"context_codes[]": f"course_{course_id}", "per_page": 100}
    resp = await client.get("/planner_notes", params=params, headers=canvas_auth())
    resp.raise_for_status()
    # resp.content to use rust validate_json speedup(canvas api is utf-8)
    planner_notes: list[PlannerNote] = _planner_notes_adapter.validate_json(resp.content)
    results = await asyncio.gather(*(delete_note(client, note) for note in planner_notes))

    total = len(planner_notes)
    deleted = sum(results)
    return BulkDeleteResult(total=total, deleted=deleted, failed=total - deleted)
