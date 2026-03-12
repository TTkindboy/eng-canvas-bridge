import asyncio
import os
import time
from typing import TypedDict

from rich import print, prompt
import httpx

class PlannerNote(TypedDict):
    id: int
    title: str
    description: str
    user_id: int
    course_id: int | None
    todo_date: str | None # ISO8601 string
    # does not include linked object data or workflow state

COURSE_ID = 2897 # English 10

API_URL = "https://friendsseminary.instructure.com/api/v1"
headers = {"Authorization": f"Bearer {os.environ['CANVAS_API_KEY']}"}

def get_confirmation():
    confirm = prompt.Prompt.ask(
        "[bold red]Are you sure you want to delete all planner notes? This action cannot be undone![/bold red]",
        choices=["y", "N"],
        default="N",
        show_default=False,
        case_sensitive=False
    ) == "y"
    if not confirm:
        print("[bold yellow]Aborting deletion.[/bold yellow]")
        raise SystemExit

async def delete_note(client: httpx.AsyncClient, note: PlannerNote):
    resp = await client.delete(f"/planner_notes/{note['id']}")
    resp.status_code
    print(f"Deleting note: {note['title']} ({note['todo_date']})")


async def main():
    async with httpx.AsyncClient(base_url=API_URL, headers=headers) as client:
        resp = await client.get("/planner_notes", params={"context_codes[]": f"course_{COURSE_ID}", "per_page": 100}) # 100 is the max I think and I don't wanna deal with pagination
        resp.raise_for_status()
        planner_notes: list[PlannerNote] = resp.json()
        await asyncio.gather(*(delete_note(client, n) for n in planner_notes))

if __name__ == "__main__":
    get_confirmation()
    start = time.perf_counter()
    asyncio.run(main())
    end = time.perf_counter()
    print(f"Deleted all planner notes in {end - start:.2f} seconds")
