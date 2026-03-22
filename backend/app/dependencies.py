from functools import cache
from typing import Annotated

import httpx
from fastapi import Depends, Request
from pydantic import computed_field
from pydantic_settings import BaseSettings

async def get_client(request: Request) -> httpx.AsyncClient:
    return request.state.http_client

type HTTPClient = Annotated[httpx.AsyncClient, Depends(get_client)]


class Settings(BaseSettings):
    canvas_api_key: str
    site_url: str = "https://friendsseminary.instructure.com"

    @computed_field
    @property
    def api_url(self) -> str:
        return f"{self.site_url}/api/v1"

@cache
def get_settings() -> Settings:
    """Return the cached application settings instance."""
    return Settings()  # ty:ignore[missing-argument]

type SettingsDep = Annotated[Settings, Depends(get_settings)]


@cache # maybe remove cache in future bc get_settings() is already cached
def canvas_auth(): # temporary until OAuth2
    return {"Authorization": f"Bearer {get_settings().canvas_api_key}"}
