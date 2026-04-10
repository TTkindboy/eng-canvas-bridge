from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRoute

from .dependencies import get_settings
from .routers import pdfs, courses

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

app.include_router(pdfs.router)
app.include_router(courses.router)
