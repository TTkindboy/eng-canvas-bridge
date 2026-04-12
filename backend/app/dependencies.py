from functools import cache
from typing import Annotated

import httpx
from fastapi import Depends, HTTPException, Request
from pydantic import computed_field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    canvas_api_key: str | None = None  # fallback for local dev
    session_secret: str = "dev-session-secret"  # fallback for local tooling/dev
    site_url: str = "https://friendsseminary.instructure.com"
    cors_origins: list[str] = [] # TODO: Maybe find env var that marks fastapi cloud prod so inbound requests don't silently fail

    @computed_field
    @property
    def api_url(self) -> str:
        return f"{self.site_url}/api/v1"

@cache
def get_settings() -> Settings:
    """Return the cached application settings instance."""
    return Settings()

type SettingsDep = Annotated[Settings, Depends(get_settings)]


def get_canvas_creds(request: Request) -> dict[str, str]:
    api_key = request.session.get("canvas_api_key") or get_settings().canvas_api_key
    if not api_key:
        raise HTTPException(status_code=401)
    return {"Authorization": f"Bearer {api_key}"}

type CanvasAuth = Annotated[dict[str, str], Depends(get_canvas_creds)]


async def get_client(request: Request) -> httpx.AsyncClient:
    return request.state.http_client

type HTTPClient = Annotated[httpx.AsyncClient, Depends(get_client)]
