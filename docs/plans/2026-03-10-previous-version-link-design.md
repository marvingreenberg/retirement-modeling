# Previous Version Link — Design Spec

## Goal

When a new minor version (e.g. 2.3) is deployed, the landing page's AppBar includes a
noticeable link to the previous minor version (e.g. 2.2), which is kept running as a
separate Cloud Run service. Only one previous version is kept at a time.

## Architecture

### Env Vars (runtime, not build-time)

Two new env vars control the feature:

| Var | Example | Effect |
|-----|---------|--------|
| `PREVIOUS_VERSION_URL` | `https://retirement-model-v2-prev-xxx.run.app` | URL the link navigates to |
| `PREVIOUS_VERSION` | `2.2` | Label shown in the link |

When both are empty/unset (the default), no link appears. This is the case for the
"prev" service itself, so it never shows a link to an even-older version.

### Backend Changes

**`src/retirement_model/api.py`** — `/api/v1/status` response adds two fields:

```python
import os

@router.get("/status")
async def status() -> dict[str, Any]:
    return {
        "status": "ok",
        "version": APP_VERSION,
        "previous_version_url": os.environ.get("PREVIOUS_VERSION_URL", ""),
        "previous_version": os.environ.get("PREVIOUS_VERSION", ""),
    }
```

No Dockerfile changes needed — the env vars are passed at Cloud Run deploy time via
`--set-env-vars`, not baked into the image.

### Frontend Changes

**`ui/src/lib/components/AppBar.svelte`** — In the `onMount` fetch of `/api/v1/status`,
also capture `previous_version_url` and `previous_version`. When both are non-empty,
render a link in the AppBar Lead area (next to the version text).

Visual treatment:
- Lucide `History` icon (or similar) + text "v2.2"
- Uses a contrasting style (e.g. `preset-tonal` button or a badge) so it's noticeable
  but not disruptive
- Tooltip: "Run previous version 2.2"
- Opens in a new tab (`target="_blank"`)
- Positioned after the "Retirement Planner / v2.3" title block

### Deployment Flow

**`.github/workflows/deploy.yml`** — new steps between "Build and push" and "Deploy to
Cloud Run":

1. **Find previous tag** — within the same major version:
   ```bash
   CURRENT_TAG="${GITHUB_REF#refs/tags/}"
   MAJOR=$(echo "$CURRENT_TAG" | sed 's/^v//' | cut -d. -f1)
   PREV_TAG=$(git tag --sort=-v:refname | grep "^v${MAJOR}\." | grep -v "^${CURRENT_TAG}$" | head -1)
   ```

2. **Deploy prev service** (only if PREV_TAG found):
   ```bash
   # Use the image already in the registry from the previous deploy
   PREV_VERSION=$(echo "$PREV_TAG" | sed 's/^v//')
   gcloud run deploy "${SERVICE_NAME}-v${MAJOR}-prev" \
     --image="${GCP_IMAGE}:${PREV_VERSION}" \
     --set-env-vars="PYTHONUNBUFFERED=1,PREVIOUS_VERSION_URL=,PREVIOUS_VERSION=" \
     ...
   PREV_URL=$(gcloud run services describe "${SERVICE_NAME}-v${MAJOR}-prev" ...)
   ```

3. **Deploy current** with the prev URL:
   ```bash
   gcloud run deploy "${SERVICE_NAME}" \
     --set-env-vars="PYTHONUNBUFFERED=1,PREVIOUS_VERSION_URL=${PREV_URL},PREVIOUS_VERSION=${PREV_VERSION}" \
     ...
   ```
   Same for the `${SERVICE_NAME}-v${MAJOR}` service.

**`Makefile`** — update `DEPLOY_CMD` and `deploy` target to mirror this logic. The
`deploy` target finds the previous tag, deploys it to the prev service, captures the URL,
then deploys current with the env vars.

### Cloud Run Services (example for v2.3)

| Service | Image | PREVIOUS_VERSION_URL | Shows link? |
|---------|-------|---------------------|-------------|
| `retirement-model` | v2.3 | `https://...prev...` | Yes → v2.2 |
| `retirement-model-v2` | v2.3 | `https://...prev...` | Yes → v2.2 |
| `retirement-model-v2-prev` | v2.2 | (empty) | No |

### Edge Cases

- **First release in a major** (e.g. v3.0.0): No previous tag found → no prev service
  deployed, no env vars set, no link shown.
- **Pre-release tags** (e.g. v2.3-rc1): `IS_STABLE=false` so version services aren't
  deployed; prev logic only runs for stable releases.
- **Previous image missing from registry**: Deploy step will fail — acceptable since this
  means the previous version was never properly released.

## Files Changed

1. `src/retirement_model/api.py` — add fields to `/status` response
2. `ui/src/lib/components/AppBar.svelte` — show previous version link
3. `.github/workflows/deploy.yml` — prev tag discovery + prev service deploy + env vars
4. `Makefile` — mirror deploy workflow changes
5. Tests for the status endpoint update
