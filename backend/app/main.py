from contextlib import asynccontextmanager
from typing import Annotated

import httpx
from fastapi import Body, FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRoute
from starlette.middleware.sessions import SessionMiddleware

from .dependencies import get_settings
from .routers import courses, pdfs

# TODO: Propagate Canvas API errors
# TODO: Implement pagination helper

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with httpx.AsyncClient(base_url=get_settings().api_url) as client:
        yield {"http_client": client}

def custom_generate_unique_id(route: APIRoute):
    return route.name # TODO: Add tags to id-gen after I implement them

app = FastAPI(lifespan=lifespan, generate_unique_id_function=custom_generate_unique_id)

app.add_middleware(
    CORSMiddleware,  # ty:ignore[invalid-argument-type]
    allow_origins=get_settings().cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware,  # ty:ignore[invalid-argument-type]
    secret_key=get_settings().session_secret,
    # https_only=True,
    same_site = "none", # this really feels hacky
)

app.include_router(pdfs.router)
app.include_router(courses.router)

@app.post("/auth")
def auth_via_api_key(request: Request, api_key: Annotated[str, Body(embed=True)]):
    request.session["canvas_api_key"] = api_key
    return Response(status_code=204)
