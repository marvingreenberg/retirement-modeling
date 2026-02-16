.PHONY: help setup build test e2e clean lint format dev deploy \
       setup-api setup-ui build-api build-ui test-api test-ui \
       run-api run-cli run-ui dev docker-run

PKG_NAME := retirement-model
ACTIVATE := . .venv/bin/activate
GITCLN := git clean -fdx
FILE ?= input.json

# ── Standard targets ────────────────────────────────────────────

help:
	@echo "Standard targets:"
	@echo "  setup      - Install all dependencies (API + UI)"
	@echo "  build      - Build all packages (API + UI)"
	@echo "  test       - Run all tests (API + UI)"
	@echo "  dev        - Start API + UI dev servers, open browser, Ctrl-C stops both"
	@echo "  docker-run - Build and run combined Docker image on port 8000"
	@echo "  deploy     - Build, push, and deploy to GCP Cloud Run"
	@echo "  e2e        - Run E2E tests (starts backend, builds UI, runs Playwright)"
	@echo "  clean      - Remove all build artifacts and generated files"
	@echo "  lint       - Run linters (black, isort, mypy)"
	@echo "  format     - Auto-format code (black, isort)"
	@echo ""
	@echo "Component targets: setup-api, setup-ui, build-api, build-ui,"
	@echo "  test-api, test-ui, run-api, run-ui, run-cli"

setup: setup-api setup-ui

build: build-api build-ui

test: test-api test-ui

clean:
	@[[ ! -e .venv ]] || ($(ACTIVATE); pip3 uninstall -q -y $(PKG_NAME) 2>/dev/null || true)
	@text=$$($(GITCLN) -n .); echo "$$text"; \
	  [[ -z "$$text" ]] || { read -p 'Delete? (y/N): ' -n1 -r YN; echo; \
	  [[ "$$YN" == y || "$$YN" == Y ]] && (set -x; $(GITCLN) .); }


dev:
	@trap 'kill 0' INT TERM; \
	  $(ACTIVATE) && uvicorn retirement_model.api:app --reload & \
	  (cd ui && npx vite dev) & \
	  sleep 2 && open http://localhost:5173; \
	  wait

docker-run:
	docker build -t retirement-app . && \
	  docker run --rm -p 8000:8000 retirement-app

GCP_PROJECT ?= $(shell gcloud config get-value project 2>/dev/null)
GCP_REGION  ?= $(shell gcloud config get-value run/region 2>/dev/null || echo us-central1)
SERVICE_NAME ?= retirement-sim
IMAGE := $(GCP_REGION)-docker.pkg.dev/$(GCP_PROJECT)/retirement-sim/$(SERVICE_NAME):latest

deploy:
	@[ -n "$(GCP_PROJECT)" ] || { echo "Error: set GCP_PROJECT or run 'gcloud config set project <id>'"; exit 1; }
	docker build -t $(IMAGE) . && \
	  docker push $(IMAGE) && \
	  gcloud run deploy $(SERVICE_NAME) \
	    --image=$(IMAGE) \
	    --platform=managed \
	    --allow-unauthenticated \
	    --port=8000 \
	    --memory=512Mi \
	    --cpu=1 \
	    --min-instances=0 \
	    --max-instances=3 \
	    --set-env-vars="PYTHONUNBUFFERED=1" && \
	  echo "Deployed: $$(gcloud run services describe $(SERVICE_NAME) --format='value(status.url)')"

e2e:
	@trap 'kill 0' INT TERM; \
	  $(ACTIVATE) && uvicorn retirement_model.api:app --port 8000 & \
	  sleep 2 && cd ui && npx playwright test; \
	  EXIT=$$?; kill 0 2>/dev/null; exit $$EXIT

lint:
	$(ACTIVATE) && \
	  black --check src/ tests/ && \
	  isort --check-only src/ tests/ && \
	  mypy src/

format:
	$(ACTIVATE) && \
	  black src/ tests/ && \
	  isort src/ tests/



# ── Component targets ───────────────────────────────────────────

setup-api:
	python3 -m venv .venv && \
	  $(ACTIVATE) && \
	  pip install -e ".[dev]"

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
