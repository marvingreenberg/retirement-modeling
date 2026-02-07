## Context

The retirement model has a Python/FastAPI backend and a SvelteKit frontend. Both must be running for E2E tests. Currently developers start services manually. There are no Dockerfiles, no Compose configuration, and no E2E test infrastructure (Playwright is not yet installed).

## Goals / Non-Goals

**Goals:**
- Containerize API and UI services so the full stack starts with one command
- Add Playwright E2E tests that run against the containerized stack
- Work with both Docker Compose and Podman Compose (standard Compose spec)
- Add Makefile targets for common container and E2E workflows

**Non-Goals:**
- Production deployment (this is dev/test infrastructure)
- Container registry publishing
- CI/CD pipeline configuration (future change)
- Comprehensive E2E test coverage (just the simulate flow for now)

## Decisions

### Compose spec, not Docker-specific
**Choice**: Use `compose.yaml` (standard Compose specification) rather than `docker-compose.yml`.

**Rationale**: The Compose spec is vendor-neutral — `docker compose`, `podman compose`, and `nerdctl compose` all support it. Avoids locking into Docker.

### Separate Dockerfiles per service
**Choice**: `Dockerfile.api` and `Dockerfile.ui` at the repo root.

**Rationale**: Each service has different base images and build steps. Keeping them at the root (not nested) makes compose context simpler.

### Playwright runs on the host, not in a container
**Choice**: Run Playwright from the host machine (or CI runner), not inside a container.

**Rationale**: Playwright in containers requires browser binaries and Xvfb/headless config, adding complexity. Running on the host is simpler for dev. For CI, Playwright provides official Docker images that can be used later. The Compose stack just needs to expose ports.

### Minimal E2E scope
**Choice**: One E2E test file covering the simulate flow (load app → run simulation → verify results appear).

**Rationale**: The UI is still evolving. A single smoke test proves the full stack connects without creating a maintenance burden. More tests can be added as the UI stabilizes.

### Dev mode for UI container
**Choice**: The UI container runs `vite dev` (not a production build), with the proxy configured to reach the API container.

**Rationale**: Matches the development workflow. The proxy in vite.config.ts already handles `/api` → FastAPI. The container just needs to point at the API service hostname instead of localhost.

## Architecture

```
┌─────────────────────────────────────────────────┐
│  compose.yaml                                   │
│                                                 │
│  ┌──────────────┐    ┌───────────────────┐     │
│  │  ui           │    │  api              │     │
│  │  SvelteKit    │───▶│  FastAPI          │     │
│  │  :5173        │    │  :8000            │     │
│  │  (Dockerfile  │    │  (Dockerfile.api) │     │
│  │   .ui)        │    │                   │     │
│  └──────┬───────┘    └───────────────────┘     │
│         │ exposed                               │
└─────────┼───────────────────────────────────────┘
          │
   ┌──────▼───────┐
   │  Playwright   │  (host machine)
   │  e2e tests    │  hits http://localhost:5173
   └──────────────┘
```

## Risks / Trade-offs

- **Hot reload in container**: Vite dev in a container needs volume mounts for HMR. The compose file mounts `ui/src` so file changes reflect immediately, but filesystem watching may be slower on Docker for Mac.
- **Port conflicts**: Services expose 5173 and 8000. If the developer is already running those locally, compose will fail. Can be mitigated with configurable ports via env vars, but not worth the complexity yet.
- **Playwright browser install**: First run requires `npx playwright install` to download browsers. This is a one-time setup step.
