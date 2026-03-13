set dotenv-load
set dotenv-required

_default:  
  just --list --unsorted

[group('dev')]
[parallel]
dev: backend frontend

[group('dev')]
backend:
  cd backend && uv run fastapi dev

[group('dev')]
frontend:
  cd frontend && pnpm run dev


[group('install')]
[parallel]
install: backend-install frontend-install
 
[group('install')]
backend-install:
  cd backend && uv sync

[group('install')]
frontend-install:
  cd frontend && pnpm install
