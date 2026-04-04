# eng-canvas-bridge

Converts Friends Seminary English schedule PDFs into Canvas planner notes via the Canvas LMS API.

## PDF parsing

### 10th grade PDF schema

Single-page PDFs with `ODD DAYS` / `EVEN DAYS` section headers. Each entry matches:
```
<weekday> <M>/<D> - <assignment>
```
Weekdays: `M T W Th F`. Dates are year-less — resolves by finding the closest year where the given month/day falls on the expected weekday.

## Environment

```
CANVAS_API_KEY=<Canvas API token>
```

Optionally override the Canvas instance:

```
SITE_URL=https://yourschool.instructure.com  # default: friendsseminary.instructure.com
```

## Architecture

FastAPI backend + PyMuPDF. Frontend: React + Vite, with a type-safe API client generated from the backend's OpenAPI schema using [hey-api](https://heyapi.dev/).

## Development

**Prerequisites:** Python 3.13+, `uv`, Node.js 24+, `pnpm`, `just`

```sh
just install  # uv sync + pnpm install
just dev      # fastapi dev + vite dev
```

Backend: `localhost:8000` — Frontend: `localhost:5173`

## Code generation

Frontend API client is generated from the backend's OpenAPI schema.

```sh
just gen  # export schema + regenerate client
```

Run `just gen` after any backend route/model changes. (`prek` will handle automatically if installed)

## prek/pre-commit

Uses [prek](https://github.com/j178/prek/) for pre-commit hooks: `ruff`, `ty`, `uv-lock`, and API client regeneration on backend changes.

```sh
prek install
```

## CI

On push/PR to `main`: `ruff` lint + `ty` type check + `tsc` type check.
