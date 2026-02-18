# Add a dedicated health/status endpoint

## Problem

The E2E test helper (`ui/e2e/helpers.ts`) uses `GET /api/v1/strategies` as a proxy to check if the backend is running. This misuses a data endpoint for health checking — it returns unnecessary payload, could change behavior, and doesn't communicate intent.

## Fix

Add a lightweight `GET /api/v1/status` (or `/api/v1/health`) endpoint that returns minimal JSON:

```json
{ "status": "ok", "version": "0.10.0" }
```

Then update `ui/e2e/helpers.ts` to use it:

```typescript
const API_URL = 'http://localhost:8000/api/v1/status';
```

## Scope

- `src/retirement_model/api.py` — add the endpoint
- `ui/e2e/helpers.ts` — point to the new endpoint
- `tests/test_api.py` — test the endpoint returns 200 with expected shape
