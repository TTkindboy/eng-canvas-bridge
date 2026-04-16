from contextlib import asynccontextmanager
from typing import Annotated

import httpx
import logfire
from fastapi import Body, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRoute
from starlette.middleware.sessions import SessionMiddleware

from .dependencies import get_settings
from .routers import courses, pdfs

# TODO: Propagate Canvas API errors
# TODO: Implement pagination helper

logfire.configure(
    send_to_logfire="if-token-present",
    environment=get_settings().app_env,
    distributed_tracing=False, # to stop FastAPI Cloud traceparent
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with httpx.AsyncClient(base_url=get_settings().api_url) as client:
        logfire.instrument_httpx(client)
        yield {"http_client": client}

def custom_generate_unique_id(route: APIRoute):
    return route.name # TODO: Add tags to id-gen after I implement them

_is_prod = get_settings().is_prod
app = FastAPI(
    lifespan=lifespan,
    generate_unique_id_function=custom_generate_unique_id,
    openapi_url=None if _is_prod else "/openapi.json",
    docs_url=None if _is_prod else "/docs",
    redoc_url=None if _is_prod else "/redoc",
)

logfire.instrument_fastapi(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware,
    secret_key=get_settings().session_secret,
    https_only=_is_prod,
    same_site="none" if _is_prod else "lax",
)

app.include_router(pdfs.router)
app.include_router(courses.router)

@app.post("/auth")
async def auth_via_api_key(request: Request, api_key: Annotated[str, Body(embed=True)]):
    if (key := get_settings().canvas_api_key) is not None:
        logfire.warning("Using dev API key, which is not secure for production use")
        api_key = key
    resp = await request.state.http_client.get("/users/self", headers={"Authorization": f"Bearer {api_key}"})
    if resp.status_code == 401:
        raise HTTPException(status_code=401, detail="Invalid Canvas API key")
    resp.raise_for_status()
    request.session["canvas_api_key"] = api_key
    data = resp.json()
    logfire.info("authenticated user {email}", email=data.get("primary_email"), name=data.get("name"))
    return Response(status_code=204)
