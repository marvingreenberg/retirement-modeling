# Previous Version Link — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a noticeable "previous version" link in the AppBar when a newer minor version is deployed, powered by env vars set at deploy time.

**Architecture:** Backend `/api/v1/status` exposes two new env-var-driven fields (`previous_version_url`, `previous_version`). Frontend AppBar conditionally renders a History icon + version link. Deploy workflow finds the previous tag, deploys its image to a `-prev` service, then passes the URL to the current deployment.

**Tech Stack:** Python/FastAPI, SvelteKit/Svelte 5, GitHub Actions, Cloud Run, Make

---

## Chunk 1: Backend + Tests

### Task 1: Backend — Add previous version fields to `/api/v1/status`

**Files:**
- Modify: `src/retirement_model/api.py:1-11` (add `os` import)
- Modify: `src/retirement_model/api.py:68-71` (expand status response)
- Test: `tests/test_api.py:58-64`

- [ ] **Step 1: Write the failing tests**

Add two tests to `tests/test_api.py` in the `TestStatusEndpoint` class:

```python
def test_status_includes_previous_version_fields(self, client: TestClient):
    """Status includes previous_version fields (empty by default)."""
    response = client.get("/api/v1/status")
    data = response.json()
    assert data["previous_version_url"] == ""
    assert data["previous_version"] == ""

def test_status_reflects_previous_version_env_vars(
    self, client: TestClient, monkeypatch: pytest.MonkeyPatch
):
    """Status reflects PREVIOUS_VERSION_* env vars when set."""
    monkeypatch.setenv("PREVIOUS_VERSION_URL", "https://example.com/prev")
    monkeypatch.setenv("PREVIOUS_VERSION", "2.1")
    response = client.get("/api/v1/status")
    data = response.json()
    assert data["previous_version_url"] == "https://example.com/prev"
    assert data["previous_version"] == "2.1"
```

Note: `pytest` import and `monkeypatch` fixture may already be available. Check existing test imports — add `import pytest` if not present.

- [ ] **Step 2: Run tests to verify they fail**

Run: `do_cmd -w .worktrees/multi-deploy -p .,dev -- pytest tests/test_api.py::TestStatusEndpoint -v`
Expected: 2 FAIL — `KeyError: 'previous_version_url'`

- [ ] **Step 3: Implement — add `os` import and expand status endpoint**

In `src/retirement_model/api.py`:

Add `import os` to the imports (line 9, after `import logging`):
```python
import os
```

Replace the status endpoint (lines 68-71):
```python
@router.get("/status")
async def status() -> dict[str, Any]:
    """Health check endpoint."""
    return {
        "status": "ok",
        "version": APP_VERSION,
        "previous_version_url": os.environ.get("PREVIOUS_VERSION_URL", ""),
        "previous_version": os.environ.get("PREVIOUS_VERSION", ""),
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `do_cmd -w .worktrees/multi-deploy -p .,dev -- pytest tests/test_api.py::TestStatusEndpoint -v`
Expected: 3 PASS

- [ ] **Step 5: Run full backend test suite**

Run: `do_cmd -w .worktrees/multi-deploy -p .,dev -- pytest tests/ -q`
Expected: All pass (353+)

- [ ] **Step 6: Lint**

Run: `do_cmd -w .worktrees/multi-deploy -p .,dev -- make lint-api`
Expected: Clean

- [ ] **Step 7: Commit**

```bash
git add src/retirement_model/api.py tests/test_api.py
git commit -m "feat(api): add previous_version fields to /status endpoint"
```

---

## Chunk 2: Frontend — AppBar link

### Task 2: Frontend — Show previous version link in AppBar

**Files:**
- Modify: `ui/src/lib/components/AppBar.svelte`

- [ ] **Step 1: Update the `onMount` to capture previous version fields**

In `AppBar.svelte`, expand the state variables (after line 30):
```typescript
let previousVersionUrl = $state('');
let previousVersion = $state('');
```

Update the `onMount` fetch (lines 32-39) to also capture the new fields:
```typescript
onMount(async () => {
   try {
      const res = await fetch('/api/v1/status');
      if (res.ok) {
         const data = await res.json();
         appVersion = data.version ?? '';
         previousVersionUrl = data.previous_version_url ?? '';
         previousVersion = data.previous_version ?? '';
      }
   } catch {
      /* dev mode without backend */
   }
});
```

- [ ] **Step 2: Add `History` icon import**

Add `History` to the lucide-svelte import (line 14):
```typescript
import {
   LayoutDashboard,
   GitCompareArrows,
   Table,
   CircleHelp,
   LineChart,
   History,
} from 'lucide-svelte';
```

- [ ] **Step 3: Add the previous version link in the AppBar Lead area**

After the closing `</a>` of the title link (after line 53), add:
```svelte
{#if previousVersionUrl && previousVersion}
   <a
      href={previousVersionUrl}
      target="_blank"
      rel="noopener noreferrer"
      class="btn btn-sm preset-tonal flex items-center gap-1 ml-2"
      title="Run previous version {previousVersion}"
   >
      <History size={14} />
      <span class="text-xs">v{previousVersion}</span>
   </a>
{/if}
```

- [ ] **Step 4: Run frontend unit tests**

Run: `do_cmd -w .worktrees/multi-deploy -d ui -- pnpm exec vitest run`
Expected: All pass

- [ ] **Step 5: Run frontend lint**

Run: `do_cmd -w .worktrees/multi-deploy -- make lint-ui`
Expected: Clean

- [ ] **Step 6: Verify visually (manual)**

Run: `PREVIOUS_VERSION_URL=http://example.com PREVIOUS_VERSION=2.1 make dev`
Confirm: AppBar shows History icon + "v2.1" tonal button next to title. Hover shows tooltip.

- [ ] **Step 7: Commit**

```bash
git add ui/src/lib/components/AppBar.svelte
git commit -m "feat(ui): show previous version link in AppBar"
```

---

## Chunk 3: Deploy workflow + Makefile

### Task 3: GitHub Actions — previous version deploy logic

**Files:**
- Modify: `.github/workflows/deploy.yml:36-47` (classify step — add prev tag output)
- Modify: `.github/workflows/deploy.yml:93-126` (deploy steps — add prev deploy + env vars)

- [ ] **Step 1: Add previous tag discovery to the classify step**

In `.github/workflows/deploy.yml`, expand the "Classify release" step (lines 36-47) to also find the previous tag:

```yaml
      - name: Classify release
        id: classify
        run: |
          TAG="${GITHUB_REF#refs/tags/v}"
          MAJOR=$(echo "$TAG" | cut -d. -f1)
          if echo "$TAG" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
            STABLE=true
          else
            STABLE=false
          fi
          CURRENT_TAG="${GITHUB_REF#refs/tags/}"
          PREV_TAG=$(git tag --sort=-v:refname | grep -E "^v${MAJOR}\.[0-9]+\.[0-9]+$" | grep -v "^${CURRENT_TAG}$" | head -1)
          PREV_VERSION=$(echo "$PREV_TAG" | sed 's/^v//')
          echo "major=$MAJOR" >> "$GITHUB_OUTPUT"
          echo "stable=$STABLE" >> "$GITHUB_OUTPUT"
          echo "prev_tag=$PREV_TAG" >> "$GITHUB_OUTPUT"
          echo "prev_version=$PREV_VERSION" >> "$GITHUB_OUTPUT"
          echo "Major: $MAJOR, Stable: $STABLE, PrevTag: $PREV_TAG"
```

- [ ] **Step 2: Add "Deploy previous version" step**

Insert a new step after "Build and push" and before "Deploy to Cloud Run":

```yaml
      - name: Deploy previous version service
        if: steps.classify.outputs.stable == 'true' && steps.classify.outputs.prev_tag != ''
        env:
          GCP_PROJECT: ${{ secrets.GCP_PROJECT }}
        run: |
          MAJOR="${{ steps.classify.outputs.major }}"
          PREV_VERSION="${{ steps.classify.outputs.prev_version }}"
          GCP_IMAGE="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/${GCP_REPOSITORY}/${SERVICE_NAME}"
          gcloud run deploy "${SERVICE_NAME}-v${MAJOR}-prev" \
            --image="${GCP_IMAGE}:${PREV_VERSION}" \
            --platform=managed \
            --region="${GCP_REGION}" \
            --allow-unauthenticated \
            --port=8000 --memory=512Mi --cpu=1 \
            --min-instances=0 --max-instances=3 \
            --set-env-vars="PYTHONUNBUFFERED=1,PREVIOUS_VERSION_URL=,PREVIOUS_VERSION="
          PREV_URL=$(gcloud run services describe "${SERVICE_NAME}-v${MAJOR}-prev" --region="${GCP_REGION}" --format='value(status.url)')
          echo "prev_url=$PREV_URL" >> "$GITHUB_OUTPUT"
          echo "Previous version deployed: $PREV_URL"
        id: prev_deploy
```

- [ ] **Step 3: Update "Deploy to Cloud Run" to pass env vars**

Replace the existing deploy step (lines 93-107) to conditionally include prev URL:

```yaml
      - name: Deploy to Cloud Run
        env:
          VERSION: ${{ steps.version.outputs.version }}
          GCP_PROJECT: ${{ secrets.GCP_PROJECT }}
        run: |
          GCP_IMAGE="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/${GCP_REPOSITORY}/${SERVICE_NAME}"
          PREV_URL="${{ steps.prev_deploy.outputs.prev_url }}"
          PREV_VERSION="${{ steps.classify.outputs.prev_version }}"
          ENV_VARS="PYTHONUNBUFFERED=1"
          if [ -n "$PREV_URL" ]; then
            ENV_VARS="${ENV_VARS},PREVIOUS_VERSION_URL=${PREV_URL},PREVIOUS_VERSION=${PREV_VERSION}"
          fi
          gcloud run deploy "${SERVICE_NAME}" \
            --image="${GCP_IMAGE}:${VERSION}" \
            --platform=managed \
            --region="${GCP_REGION}" \
            --allow-unauthenticated \
            --port=8000 --memory=512Mi --cpu=1 \
            --min-instances=0 --max-instances=3 \
            --set-env-vars="${ENV_VARS}"
          echo "Deployed: $(gcloud run services describe ${SERVICE_NAME} --region=${GCP_REGION} --format='value(status.url)')"
```

- [ ] **Step 4: Update "Deploy major-version service" similarly**

```yaml
      - name: Deploy major-version service
        if: steps.classify.outputs.stable == 'true'
        env:
          VERSION: ${{ steps.version.outputs.version }}
          GCP_PROJECT: ${{ secrets.GCP_PROJECT }}
        run: |
          MAJOR="${{ steps.classify.outputs.major }}"
          GCP_IMAGE="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/${GCP_REPOSITORY}/${SERVICE_NAME}"
          PREV_URL="${{ steps.prev_deploy.outputs.prev_url }}"
          PREV_VERSION="${{ steps.classify.outputs.prev_version }}"
          ENV_VARS="PYTHONUNBUFFERED=1"
          if [ -n "$PREV_URL" ]; then
            ENV_VARS="${ENV_VARS},PREVIOUS_VERSION_URL=${PREV_URL},PREVIOUS_VERSION=${PREV_VERSION}"
          fi
          gcloud run deploy "${SERVICE_NAME}-v${MAJOR}" \
            --image="${GCP_IMAGE}:${VERSION}" \
            --platform=managed \
            --region="${GCP_REGION}" \
            --allow-unauthenticated \
            --port=8000 --memory=512Mi --cpu=1 \
            --min-instances=0 --max-instances=3 \
            --set-env-vars="${ENV_VARS}"
          echo "Deployed: $(gcloud run services describe ${SERVICE_NAME}-v${MAJOR} --region=${GCP_REGION} --format='value(status.url)')"
```

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat(deploy): deploy previous version service and pass URL to current"
```

### Task 4: Makefile — mirror deploy workflow

**Files:**
- Modify: `Makefile:6-8` (add PREV_VERSION variables)
- Modify: `Makefile:98-104` (DEPLOY_CMD — accept env vars parameter)
- Modify: `Makefile:106-117` (deploy target — add prev deploy logic)

- [ ] **Step 1: Add PREV_VERSION variable computation**

After line 8 (`IS_STABLE`), add:
```makefile
PREV_TAG := $(shell git tag --sort=-v:refname | grep -E '^v$(MAJOR_VERSION)\.[0-9]+\.[0-9]+$$' | grep -v '^v$(VERSION)$$' | head -1)
PREV_VERSION := $(shell echo $(PREV_TAG) | sed 's/^v//')
```

- [ ] **Step 2: Update DEPLOY_CMD to accept env vars**

Replace `DEPLOY_CMD` (lines 98-104):
```makefile
DEPLOY_CMD = gcloud run deploy $(1) \
	    --image=$(GCP_IMAGE):$(2) \
	    --platform=managed \
	    --allow-unauthenticated \
	    --port=8000 --memory=512Mi --cpu=1 \
	    --min-instances=0 --max-instances=3 \
	    --set-env-vars="$(3)"
```

Now it takes 3 args: `(service-name, image-version, env-vars-string)`.

- [ ] **Step 3: Update deploy target**

Replace the `deploy` target (lines 106-117):
```makefile
deploy: build-image
	@[ -n "$(GCP_PROJECT)" ] || { echo "Error: set GCP_PROJECT or run 'gcloud config set project <id>'"; exit 1; }
	docker buildx build --push --progress plain --build-arg VERSION=$(VERSION) \
	  -t $(GH_IMAGE):$(VERSION) \
	  -t $(GCP_IMAGE):$(VERSION) $(STABLE_TAGS) .
	$(eval PREV_ENV := PYTHONUNBUFFERED=1,PREVIOUS_VERSION_URL=,PREVIOUS_VERSION=)
	$(eval CURR_ENV := PYTHONUNBUFFERED=1)
	@if [ "$(IS_STABLE)" = "true" ] && [ -n "$(PREV_TAG)" ]; then \
	  echo "Deploying previous version $(PREV_VERSION) to $(SERVICE_NAME)-v$(MAJOR_VERSION)-prev..."; \
	  $(call DEPLOY_CMD,$(SERVICE_NAME)-v$(MAJOR_VERSION)-prev,$(PREV_VERSION),$(PREV_ENV)) && \
	  PREV_URL=$$(gcloud run services describe $(SERVICE_NAME)-v$(MAJOR_VERSION)-prev --format='value(status.url)') && \
	  echo "Previous version deployed: $$PREV_URL"; \
	fi
	$(eval CURR_ENV_FINAL := $(shell \
	  if [ "$(IS_STABLE)" = "true" ] && [ -n "$(PREV_TAG)" ]; then \
	    PREV_URL=$$(gcloud run services describe $(SERVICE_NAME)-v$(MAJOR_VERSION)-prev --format='value(status.url)'); \
	    echo "PYTHONUNBUFFERED=1,PREVIOUS_VERSION_URL=$$PREV_URL,PREVIOUS_VERSION=$(PREV_VERSION)"; \
	  else \
	    echo "PYTHONUNBUFFERED=1"; \
	  fi))
	$(call DEPLOY_CMD,$(SERVICE_NAME),$(VERSION),$(CURR_ENV_FINAL))
	@echo "Deployed: $$(gcloud run services describe $(SERVICE_NAME) --format='value(status.url)')"
	@if [ "$(IS_STABLE)" = "true" ]; then \
	  echo "Deploying major-version service $(SERVICE_NAME)-v$(MAJOR_VERSION)..."; \
	  $(call DEPLOY_CMD,$(SERVICE_NAME)-v$(MAJOR_VERSION),$(VERSION),$(CURR_ENV_FINAL)) && \
	  echo "Deployed: $$(gcloud run services describe $(SERVICE_NAME)-v$(MAJOR_VERSION) --format='value(status.url)')"; \
	fi
```

- [ ] **Step 4: Update deploy-version target**

Replace `deploy-version` (lines 119-123):
```makefile
deploy-version:
	@[ -n "$(GCP_PROJECT)" ] || { echo "Error: set GCP_PROJECT or run 'gcloud config set project <id>'"; exit 1; }
	@[ "$(IS_STABLE)" = "true" ] || { echo "Error: VERSION=$(VERSION) is not a stable release; skipping version deploy"; exit 1; }
	$(call DEPLOY_CMD,$(SERVICE_NAME)-v$(MAJOR_VERSION),$(VERSION),PYTHONUNBUFFERED=1)
	@echo "Deployed: $$(gcloud run services describe $(SERVICE_NAME)-v$(MAJOR_VERSION) --format='value(status.url)')"
```

- [ ] **Step 5: Commit**

```bash
git add Makefile
git commit -m "feat(makefile): add previous version deploy logic"
```

- [ ] **Step 6: Final lint check**

Run: `do_cmd -w .worktrees/multi-deploy -p .,dev -- make lint`
Expected: Clean
