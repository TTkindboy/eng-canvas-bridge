set dotenv-load
set dotenv-required

frontend_delay := '0.5'

[private]
default:  
  @just --list --unsorted

[group('dev')]
[parallel]
dev: backend _frontend-delayed

[group('dev')]
[working-directory: 'backend']
backend:
  uv run fastapi dev

[group('dev')]
[working-directory: 'frontend']
frontend:
  pnpm run dev

[group('dev')]
_frontend-delayed: && frontend
  @sleep {{frontend_delay}}

[group('install')]
[parallel]
install: backend-install frontend-install
 
[group('install')]
[working-directory: 'backend']
backend-install:
  uv sync

[group('install')]
[working-directory: 'frontend']
frontend-install:
  pnpm install

alias gen := generate

[group('generate')]
generate: export-openapi generate-client

[group('generate')]
[working-directory: 'backend']
export-openapi:
  uv run -m scripts.export_openapi

alias gen-api := generate-client

[group('generate')]
[working-directory: 'frontend']
generate-client:
  pnpm run openapi-ts
