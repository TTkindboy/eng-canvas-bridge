from __future__ import annotations
from functools import cache
from typing import Annotated, Literal

import httpx
from fastapi import Depends, HTTPException, Request
from pydantic import computed_field, model_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    canvas_api_key: str | None = None  # fallback for local dev
    session_secret: str = "dev-session-secret"  # fallback for local tooling/dev
    site_url: str = "https://friendsseminary.instructure.com"
    cors_origins: list[str] = [] # TODO: Maybe find env var that marks fastapi cloud prod so inbound requests don't silently fail
    app_env: Literal["prod", "dev"] = "dev"

    @property
    def is_prod(self) -> bool:
        return self.app_env == "prod"

    @model_validator(mode="after")
    def validate_prod_config(self) -> Settings:
        if not self.is_prod:
            return self
        if self.canvas_api_key is not None:
            raise ValueError("canvas_api_key must not be set in production.")
        if not self.cors_origins:
            raise ValueError("cors_origins must be set in production.")
        if self.session_secret == "dev-session-secret":
            raise ValueError("session_secret must be set to a non-default value in production.")
        return self

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
