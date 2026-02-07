.PHONY: help setup build test e2e clean lint format \
       setup-api setup-ui build-api build-ui test-api test-ui \
       run-api run-cli run-ui compose-up compose-down

PKG_NAME := retirement-model
ACTIVATE := . .venv/bin/activate
GITCLN := git clean -fdx
FILE ?= input.json

# ── Standard targets ────────────────────────────────────────────

help:
	@echo "Standard targets:"
	@echo "  setup   - Install all dependencies (API + UI)"
	@echo "  build   - Build all packages (API + UI)"
	@echo "  test    - Run all tests (API + UI)"
	@echo "  e2e     - Run E2E tests against containerized stack"
	@echo "  clean   - Remove all build artifacts and generated files"
	@echo "  lint    - Run linters (black, isort, mypy)"
	@echo "  format  - Auto-format code (black, isort)"
	@echo ""
	@echo "Component targets: setup-api, setup-ui, build-api, build-ui,"
	@echo "  test-api, test-ui, run-api, run-ui, run-cli,"
	@echo "  compose-up, compose-down"

setup: setup-api setup-ui

build: build-api build-ui

test: test-api test-ui

clean:
	@[[ ! -e .venv ]] || ($(ACTIVATE); pip3 uninstall -q -y $(PKG_NAME) 2>/dev/null || true)
	@text=$$($(GITCLN) -n .); echo "$$text"; \
	  [[ -z "$$text" ]] || { read -p 'Delete? (y/N): ' -n1 -r YN; echo; \
	  [[ "$$YN" == y || "$$YN" == Y ]] && (set -x; $(GITCLN) .); }

e2e: compose-up
	cd ui && npx playwright test; \
	  status=$$?; \
	  cd .. && docker compose down; \
	  exit $$status

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

compose-up:
	docker compose up -d --build

compose-down:
	docker compose down
