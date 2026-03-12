import asyncio
import os
import httpx
from datetime import datetime, timedelta
from rich import print as rprint
from rich import print_json, prompt

API_URL = "https://friendsseminary.instructure.com/api/v1"
headers = {"Authorization": f"Bearer {os.environ['CANVAS_API_KEY']}"}

async def get_courses(client: httpx.AsyncClient) -> list[dict]:
    courses_resp = await client.get("/courses", params={"enrollment_state": "active"})
    courses_resp.raise_for_status()
    return courses_resp.json()


async def get_planner_items(client: httpx.AsyncClient, start_date: datetime, end_date: datetime, courses: list[dict] | None = None) -> list[dict]:
    if courses is None:
        courses = await get_courses(client)

    context_codes = [f"course_{c['id']}" for c in courses]
    planner_items_resp = await client.get(
        "/planner/items",
        params={
            "start_date": start_date.date().isoformat(),
            "end_date": end_date.date().isoformat(),
            "context_codes[]": context_codes,
            "per_page": 100,
        },
    )
    planner_items_resp.raise_for_status()
    return planner_items_resp.json()

async def main():
    from_ = datetime.now()
    to = from_ + timedelta(weeks=2)
    rprint(
        f"Getting events from {from_.date().isoformat()} to {to.date().isoformat()}..."
    )

    async with httpx.AsyncClient(base_url=API_URL, headers=headers) as client:
        items = await get_planner_items(client, from_, to)
    items = [item for item in items if item["plannable_type"] != "calendar_event"] # remove math team 💀
    for i, item in enumerate(items):
        rprint(f"Planner Item {i}: {item['plannable']['title']}")
    try:
        index = prompt.IntPrompt.ask("Which item do you want to view?")
        print_json(data=items[index])
    except IndexError:
        rprint("[red]Invalid index![/red]")




if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        rprint("\n[red]Exiting...[/red]")
