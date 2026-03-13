[parallel]
dev: backend frontend

[parallel]
install: backend-install frontend-install

backend:
  cd backend && uv run fastapi dev

frontend:
  cd frontend && pnpm run dev

backend-install:
  cd backend && uv sync

frontend-install:
  cd frontend && pnpm i
