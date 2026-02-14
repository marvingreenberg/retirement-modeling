## Why

The application currently runs as two separate containers (FastAPI API + SvelteKit dev server) orchestrated by docker-compose. For Cloud Run deployment, a single stateless container serving both the static FE and the API is needed. This also provides an opportunity to version the API routes under `/api/v1/`, which was a pending TODO item.

## What Changes

- **BREAKING**: All API routes move under `/api/v1/` prefix (`/simulate` → `/api/v1/simulate`, `/monte-carlo` → `/api/v1/monte-carlo`, etc.)
- FastAPI conditionally mounts `StaticFiles` to serve the built SvelteKit app when a `static/` directory exists alongside the package
- Single multi-stage `Dockerfile` replaces `Dockerfile.api` and `Dockerfile.ui` (node stage builds FE, python stage copies output + installs package)
- `compose.yaml`, `Dockerfile.api`, `Dockerfile.ui` deleted
- FE `api.ts` updates `BASE` from `/api` to `/api/v1`
- Vite proxy updated: forwards `/api/v1/*` to backend without path rewriting
- Makefile updated: `make dev` runs uvicorn + pnpm dev in parallel; `make docker-run` builds and runs the combined image; compose targets removed

## Capabilities

### New Capabilities
- `static-serving`: FastAPI serves built SvelteKit static assets when available

### Modified Capabilities
- `containerization`: Single multi-stage Dockerfile replaces two-container compose setup; new Makefile targets for dev and Docker workflows
- `simulation-orchestration`: API routes move under `/api/v1/` prefix (version alignment)

## Impact

- **Backend**: `api.py` gains route prefix and static mount; all API test routes update
- **Frontend**: `api.ts` BASE changes; vite proxy config changes; FE tests update mock URLs
- **Infrastructure**: Dockerfile, compose.yaml, Makefile all change
- **Clients**: Any external API consumers must update to `/api/v1/` routes (breaking)
