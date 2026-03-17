import os
from functools import cache
from typing import Annotated
import httpx
from fastapi import Request, Depends

SITE_URL = "https://friendsseminary.instructure.com"
API_URL = f"{SITE_URL}/api/v1"

async def get_client(request: Request) -> httpx.AsyncClient:
    return request.state.http_client

type HTTPClient = Annotated[httpx.AsyncClient, Depends(get_client)]

@cache
def canvas_auth(): # temporary until OAuth2
    return {"Authorization": f"Bearer {os.environ['CANVAS_API_KEY']}"}
