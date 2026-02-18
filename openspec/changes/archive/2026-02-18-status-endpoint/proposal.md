## Why

The E2E test helper uses `GET /api/v1/strategies` as a proxy health check for backend readiness. This misuses a data endpoint — it returns unnecessary payload, could change behavior, and doesn't communicate intent. A dedicated health endpoint is standard practice for both testing and deployment monitoring.

## What Changes

- Add `GET /api/v1/status` endpoint returning `{ "status": "ok", "version": "0.11.0" }`
- Update E2E test helper (`ui/e2e/helpers.ts`) to poll the new endpoint instead of `/api/v1/strategies`
- Add backend test for the endpoint

## Capabilities

### New Capabilities
- `health-endpoint`: Lightweight status/health check endpoint for the API

### Modified Capabilities
- `e2e-testing`: E2E helper updated to use dedicated health endpoint instead of strategies proxy

## Impact

- `src/retirement_model/api.py` — new endpoint
- `ui/e2e/helpers.ts` — URL change
- `tests/test_api.py` — new test
