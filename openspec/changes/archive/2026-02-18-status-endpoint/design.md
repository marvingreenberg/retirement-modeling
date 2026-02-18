## Context

E2E tests poll `GET /api/v1/strategies` to check backend readiness. This works but misuses a data endpoint. The API has no dedicated health check for monitoring or deployment probes.

## Goals / Non-Goals

**Goals:**
- Add a minimal health endpoint at `GET /api/v1/status`
- Return version from `pyproject.toml` (already available via `importlib.metadata`)
- Update E2E helper to use the new endpoint

**Non-Goals:**
- Database or dependency health checks (no database in this app)
- Authentication or rate limiting on the health endpoint
- Kubernetes-style liveness/readiness probe separation

## Decisions

**Endpoint path**: `/api/v1/status` — matches the existing API prefix convention. "status" over "health" since it returns version info, not just up/down.

**Version source**: Use `importlib.metadata.version("retirement-model")` to read from the installed package, keeping a single source of truth in `pyproject.toml`.

**Response shape**: `{ "status": "ok", "version": "0.11.0" }` — minimal, no unnecessary fields.

## Risks / Trade-offs

None significant. This is a small additive change with no impact on existing functionality.
