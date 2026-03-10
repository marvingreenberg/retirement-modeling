.PHONY: help check-tools setup build test e2e clean lint lint-api lint-ui \
       format format-api format-ui dev deploy deploy-version build-image \
       setup-api setup-ui build-api build-ui test-api test-ui \
       run-api run-cli run-ui dev docker-run

VERSION := $(shell git describe --tags --always 2>/dev/null | sed 's/^v//' || echo "0.0.0")
MAJOR_VERSION := $(shell echo $(VERSION) | cut -d. -f1)
IS_STABLE := $(shell echo $(VERSION) | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$$' && echo true || echo false)

PKG_NAME := retirement-model
ACTIVATE := if [ -f .venv/bin/activate ]; then . .venv/bin/activate; fi
FILE ?= input.json

REPO = ghcr.io
REPO_OWNER := marvingreenberg
REPO_PATH := $(REPO)/$(REPO_OWNER)
SERVICE_NAME := retirement-model

GCP_PROJECT ?= $(shell gcloud config get-value project 2>/dev/null)
GCP_REGION  ?= $(shell gcloud config get-value run/region 2>/dev/null)
GCP_REGION := $(if $(GCP_REGION),$(GCP_REGION),us-central1)
GH_IMAGE := ghcr.io/marvingreenberg/$(SERVICE_NAME)
PROJECT_REPOSITORY := container-images
GCP_IMAGE := $(GCP_REGION)-docker.pkg.dev/$(GCP_PROJECT)/$(PROJECT_REPOSITORY)/$(SERVICE_NAME)


# ── Standard targets ────────────────────────────────────────────

help:
	@echo "Standard targets:"
	@echo "  setup      - Install all dependencies (API + UI)"
	@echo "  build      - Build all packages (API + UI)"
	@echo "  test       - Run all tests (API + UI)"
	@echo "  dev        - Start API + UI dev servers, open browser, Ctrl-C stops both"
	@echo "  build-image- Build Docker image locally via buildx"
	@echo "  docker-run - Build (via buildx) and run Docker image on port 8000"
	@echo "  deploy     - Build, push, deploy to Cloud Run (+ version service if stable)"
	@echo "  deploy-version - Deploy only the major-version Cloud Run service"
	@echo "  e2e        - Run E2E tests (starts backend, builds UI, runs Playwright)"
	@echo "  clean      - Remove all build artifacts and generated files"
	@echo "  lint       - Run all linters (API + UI)"
	@echo "  format     - Auto-format all code (API + UI)"
	@echo ""
	@echo "Component targets: setup-api, setup-ui, build-api, build-ui,"
	@echo "  test-api, test-ui, run-api, run-ui, run-cli"

REQUIRED_TOOLS := gh gcloud docker keyring
check-tools:
	@missing=""; \
	  for cmd in $(REQUIRED_TOOLS); do \
	    command -v $$cmd >/dev/null 2>&1 || missing="$$missing $$cmd"; \
	  done; \
	  if [ -n "$$missing" ]; then \
	    echo "Missing required tools:$$missing"; \
	    echo "Install with: brew install$$missing"; \
	    exit 1; \
	  fi

setup: check-tools setup-ui setup-api
	keyring get $(REPO) $(REPO_OWNER) | docker login $(REPO) --username $(REPO_OWNER) --password-stdin
	./scripts/set-gcloud-creds-for-deploy

build: build-api build-ui

test: test-api test-ui

clean:
	@git stash --include-untracked
	@git clean -fdx -e .claude -e .gemini .
	@git stash pop


dev:
	@$(ACTIVATE) && pip install -q -e . 2>&1 | grep -v 'already satisfied' || true
	@cleanup() { kill 0 2>/dev/null; wait 2>/dev/null; }; \
	  trap cleanup INT TERM EXIT; \
	  $(ACTIVATE) && uvicorn retirement_model.api:app --reload & API_PID=$$!; \
	  sleep 1; \
	  kill -0 $$API_PID 2>/dev/null || { echo "ERROR: API server failed to start (port 8000 in use?)"; exit 1; }; \
	  VITE_PORT=$$(( (RANDOM % 16384) + 49152 )); \
	  (cd ui && npx vite dev --port $$VITE_PORT --strictPort) & \
	  for i in 1 2 3 4 5 6 7 8 9 10; do curl -s http://localhost:$$VITE_PORT >/dev/null && break; sleep 1; done; \
	  echo "Vite dev server on port $$VITE_PORT"; \
	  open http://localhost:$$VITE_PORT; \
	  wait

docker-run: build-image
	docker run --rm -p 8000:8000 $(GH_IMAGE):$(VERSION)

STABLE_TAGS := $(if $(filter true,$(IS_STABLE)),-t $(GH_IMAGE):latest -t $(GCP_IMAGE):latest -t $(GH_IMAGE):v$(MAJOR_VERSION) -t $(GCP_IMAGE):v$(MAJOR_VERSION))

build-image:
	@[ -n "$(GCP_PROJECT)" ] || { echo "Error: set GCP_PROJECT or run 'gcloud config set project <id>'"; exit 1; }
	docker buildx build --load --progress plain --build-arg VERSION=$(VERSION) \
	  -t $(GH_IMAGE):$(VERSION) \
	  -t $(GCP_IMAGE):$(VERSION) $(STABLE_TAGS) .

DEPLOY_CMD = gcloud run deploy $(1) \
	    --image=$(GCP_IMAGE):$(VERSION) \
	    --platform=managed \
	    --allow-unauthenticated \
	    --port=8000 --memory=512Mi --cpu=1 \
	    --min-instances=0 --max-instances=3 \
	    --set-env-vars="PYTHONUNBUFFERED=1"

deploy: build-image
	@[ -n "$(GCP_PROJECT)" ] || { echo "Error: set GCP_PROJECT or run 'gcloud config set project <id>'"; exit 1; }
	docker buildx build --push --progress plain --build-arg VERSION=$(VERSION) \
	  -t $(GH_IMAGE):$(VERSION) \
	  -t $(GCP_IMAGE):$(VERSION) $(STABLE_TAGS) . && \
	  $(call DEPLOY_CMD,$(SERVICE_NAME)) && \
	  echo "Deployed: $$(gcloud run services describe $(SERVICE_NAME) --format='value(status.url)')"
	@if [ "$(IS_STABLE)" = "true" ]; then \
	  echo "Deploying major-version service $(SERVICE_NAME)-v$(MAJOR_VERSION)..."; \
	  $(call DEPLOY_CMD,$(SERVICE_NAME)-v$(MAJOR_VERSION)) && \
	  echo "Deployed: $$(gcloud run services describe $(SERVICE_NAME)-v$(MAJOR_VERSION) --format='value(status.url)')"; \
	fi

deploy-version:
	@[ -n "$(GCP_PROJECT)" ] || { echo "Error: set GCP_PROJECT or run 'gcloud config set project <id>'"; exit 1; }
	@[ "$(IS_STABLE)" = "true" ] || { echo "Error: VERSION=$(VERSION) is not a stable release; skipping version deploy"; exit 1; }
	$(call DEPLOY_CMD,$(SERVICE_NAME)-v$(MAJOR_VERSION))
	@echo "Deployed: $$(gcloud run services describe $(SERVICE_NAME)-v$(MAJOR_VERSION) --format='value(status.url)')"

e2e:
	@cleanup() { kill 0 2>/dev/null; wait 2>/dev/null; }; \
	  trap cleanup INT TERM EXIT; \
	  $(ACTIVATE) && uvicorn retirement_model.api:app --port 8000 & API_PID=$$!; \
	  sleep 1; \
	  kill -0 $$API_PID 2>/dev/null || { echo "ERROR: API server failed to start (port 8000 in use?)"; exit 1; }; \
	  cd ui && npx playwright test; \
	  exit $$?

lint: lint-api lint-ui

format: format-api format-ui


# ── Component targets ───────────────────────────────────────────

setup-api:
	python3 -m venv .venv && \
	  $(ACTIVATE) && \
	  pip install -q -e ".[dev]"

setup-ui:
	cd ui && pnpm install

build-api:
	$(ACTIVATE) && python -m build

build-ui:
	cd ui && pnpm build

test-api:
	$(ACTIVATE) && pytest tests/ -v

test-ui:
	cd ui && pnpm test

run-api:
	$(ACTIVATE) && uvicorn retirement_model.api:app --reload

run-ui:
	cd ui && pnpm dev

run-cli:
	$(ACTIVATE) && retirement-model run $(FILE)


lint-api:
	$(ACTIVATE) && \
	  black --check src/ tests/ && \
	  isort --check-only src/ tests/ && \
	  mypy src/

lint-ui:
	cd ui && pnpm lint && pnpm format:check
format-api:
	$(ACTIVATE) && \
	  black src/ tests/ && \
	  isort src/ tests/

format-ui:
	cd ui && pnpm lint:fix && pnpm format
