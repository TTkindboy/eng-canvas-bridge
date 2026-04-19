set dotenv-load

frontend_delay := '0.75'

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

# maybe separate to add frontend
alias test := test-backend

[group('test')]
[working-directory: 'backend']
test-backend *FLAGS='-v':
  uv run pytest {{ FLAGS }}

[group('test')]
[working-directory: 'backend']
snapshot:
  uv run pytest --inline-snapshot=fix
  uv run ruff format tests/test_pdf_parsing.py

alias gen := generate

[group('generate')]
generate: export-openapi generate-client generate-extension-client

[group('generate')]
[working-directory: 'backend']
export-openapi:
  uv run -m scripts.export_openapi

alias gen-api := generate-client

[group('generate')]
[working-directory: 'frontend']
generate-client:
  pnpm run openapi-ts

[group('generate')]
[working-directory: 'extension']
generate-extension-client:
  pnpm run openapi-ts
