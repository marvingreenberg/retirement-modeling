## Context

The app is a two-tier system: Python/FastAPI backend and SvelteKit frontend. Currently deployed locally as two Docker containers via `compose.yaml`. The FE uses `adapter-static` (SPA mode with `fallback: 'index.html'`), and the vite dev server proxies `/api/*` to the backend, stripping the `/api` prefix.

The FE `api.ts` uses `BASE = '/api'` and calls `fetch('/api/simulate', ...)`. The vite proxy rewrites these to `http://localhost:8000/simulate`.

For Cloud Run, we need a single container. The FE build output is static HTML/JS/CSS that can be served by FastAPI's `StaticFiles`.

## Goals / Non-Goals

**Goals:**
- Single `Dockerfile` producing one image that serves both API and FE
- API routes versioned under `/api/v1/` prefix
- FE calls `/api/v1/simulate` directly (no proxy rewrite in production)
- `make dev` runs both uvicorn and pnpm dev in parallel for local development (hot reload preserved)
- `make docker-run` builds and runs the combined image for integration testing
- Remove `compose.yaml`, `Dockerfile.api`, `Dockerfile.ui`

**Non-Goals:**
- Cloud Run deployment configuration (service.yaml, IAM, etc.) — that's a separate concern
- Authentication/multi-user (BE-6 originally mentioned this; split out as a separate change)
- CDN or caching headers for static assets
- HTTPS termination (Cloud Run handles this)

## Decisions

1. **API route prefix: `/api/v1/`** — Use FastAPI's `APIRouter` with `prefix="/api/v1"`. All existing routes (`/simulate`, `/monte-carlo`, `/compare`, `/strategies`) move to the router. Root endpoint stays at `/` for health checks. The root endpoint also moves a copy to `/api/v1/` for API discovery.

   *Alternative considered*: Separate `v1` router file — rejected because there's only one version and the route count is small.

2. **Static file mount: conditional, last** — After all API routes are registered, check if `static/` directory exists relative to the package. If so, mount `StaticFiles(directory=static_dir, html=True)` at `/`. The `html=True` flag serves `index.html` for directory requests. Because FastAPI processes routes in order, explicit `/api/v1/*` routes take priority over the catch-all static mount.

   *Alternative considered*: Mounting static at a subpath like `/app/` — rejected because SPA routing expects to own `/` and Cloud Run should serve the app at the root URL.

3. **FE API base: `/api/v1`** — Change `api.ts` `BASE` from `'/api'` to `'/api/v1'`. FE calls become `fetch('/api/v1/simulate', ...)`. In Docker, FastAPI serves these directly. In dev, vite proxy forwards `/api/v1/*` to `http://localhost:8000/api/v1/*` with no path rewriting.

4. **Vite proxy: no rewrite** — Remove the `rewrite` function. The proxy simply forwards `/api/v1/*` to the backend. Backend routes now match the FE paths exactly.

   *Current*: `'/api' → target: 8000, rewrite: strip /api`
   *New*: `'/api/v1' → target: 8000, no rewrite`

5. **Multi-stage Dockerfile** — Stage 1 (node:22-slim): `pnpm install && pnpm build` produces `build/`. Stage 2 (python:3.11-slim): copies `build/` from stage 1 into `src/retirement_model/static/`, installs the Python package, exposes port 8000.

6. **`make dev`: parallel processes** — Runs `uvicorn --reload` and `pnpm dev` concurrently using a backgrounded process with `trap` for cleanup. Both processes are killed on Ctrl+C.

   *Alternative considered*: Using `concurrently` npm package — rejected to avoid an npm dependency in the Python project's dev workflow.

7. **`make docker-run`** — Builds the single image (`docker build -t retirement-app .`) and runs it on port 8000 (`docker run --rm -p 8000:8000 retirement-app`). User browses `localhost:8000` to see the full integrated app.

8. **Backward-compat redirect** — Add temporary redirects from old routes (`/simulate` → `/api/v1/simulate`, etc.) for any external consumers. These can be removed in a future version.

## Risks / Trade-offs

- **Breaking API change** — External consumers (if any) must update to `/api/v1/`. → Mitigation: Temporary redirect routes ease migration. No known external consumers currently.
- **Static dir detection at startup** — If `static/` is missing, the app silently runs API-only. → This is the desired behavior for dev mode, but could mask deployment misconfiguration. → Mitigation: Log a message at startup indicating whether static serving is active.
- **`make dev` process management** — Shell-based parallel process management is fragile (zombie processes on abnormal exit). → Mitigation: Use `trap` to kill child processes. Good enough for dev tooling.
- **Docker build time** — Multi-stage build installs both node and python dependencies. → Mitigation: Layer ordering (dependency install before source copy) enables Docker cache hits.
