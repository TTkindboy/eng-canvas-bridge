from functools import cache
from pydantic import BaseModel
import os
from typing import Annotated, Any
import httpx
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Depends

API_URL = "https://friendsseminary.instructure.com/api/v1"
# TODO: Propagate Canvas API errors
# TODO: Implement pagination helper

class Course(BaseModel):
    model_config = {"extra": "allow"}

    id: int
    name: str
    course_code: str

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
