import asyncio
import os
from contextlib import asynccontextmanager
from functools import cache
from typing import Annotated, Any, TypedDict
import logging

import httpx
from fastapi import Depends, FastAPI, Request
from pydantic import BaseModel

API_URL = "https://friendsseminary.instructure.com/api/v1"
# TODO: Propagate Canvas API errors
# TODO: Implement pagination helper

logger = logging.getLogger(__name__)

class Course(BaseModel):
    model_config = {"extra": "allow"}

    id: int
    name: str
    course_code: str

class PlannerNote(TypedDict):
    id: int
    title: str
    description: str
    user_id: int
    course_id: int | None
    todo_date: str | None # ISO8601 string
    # does not include linked object data or workflow state

# MAYBE: include IDs later
class BulkDeleteResult(BaseModel):
    total: int
    deleted: int
    failed: int

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with httpx.AsyncClient(base_url=API_URL) as client:
        yield {"http_client": client}

async def get_client(request: Request) -> httpx.AsyncClient:
    return request.state.http_client

type HTTPClient = Annotated[httpx.AsyncClient, Depends(get_client)]

app = FastAPI(lifespan=lifespan)

@cache
def canvas_auth(): # temparary until OAuth2
    return {"Authorization": f"Bearer {os.getenv('CANVAS_API_KEY')}"}

@app.get("/courses")
async def get_courses(client: HTTPClient, inactive: bool = False) -> list[Course]:
    params: dict[str, Any] = {"per_page": 100}
    if not inactive:
        params["enrollment_state"] = "active"
    courses_resp = await client.get("/courses", headers=canvas_auth(), params=params)
    courses_resp.raise_for_status()
    return courses_resp.json()

# Maybe add query parameter to limit to schedules
@app.get("/courses/{course_id}/pdfs", summary="List course PDFs")
async def get_pdfs(client: HTTPClient, course_id: int) -> list[dict]: # TODO: Strengthen include parameter 
    params: dict[str, Any] = {"include": ["items"], "per_page": 100, "search_term": ".pdf"} # assumes filenames include .pdf, which is not always the case
    files_resp = await client.get(f"/courses/{course_id}/modules", headers=canvas_auth(), params=params)
    files_resp.raise_for_status()
    return [
        item for module in files_resp.json()
        for item in module["items"]
        if item["type"] == "File" 
    ]

async def delete_note(client: httpx.AsyncClient, note: PlannerNote) -> bool:
    try:
        resp = await client.delete(f"/planner_notes/{note['id']}", headers=canvas_auth())
        resp.raise_for_status()
        logger.info("Deleted note: %s (%s)", note["title"], note["todo_date"])
        return True
    except httpx.HTTPError as e:
        logger.error("Failed to delete note: %s (%s): %s", note["title"], note["todo_date"], e)
        return False

# TODO: Add semaphore
@app.delete("/courses/{course_id}/notes", summary="Delete all planner notes for a course") # might not be idiomatic for webapp
async def delete_notes(client: HTTPClient, course_id: int) -> BulkDeleteResult:
    params = {"context_codes[]": f"course_{course_id}", "per_page": 100}
    resp = await client.get("/planner_notes", params=params, headers=canvas_auth())
    resp.raise_for_status()
    planner_notes: list[PlannerNote] = resp.json()
    results = await asyncio.gather(*(delete_note(client, note) for note in planner_notes))

    total = len(planner_notes)
    deleted = sum(results)
    return BulkDeleteResult(total=total, deleted=deleted, failed=total - deleted)

# MAYBE: Add method to preview current notes pre-deletion
