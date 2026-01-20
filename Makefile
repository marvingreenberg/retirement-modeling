.PHONY: help setup test lint format build clean run

help:
	@echo "Available targets:"
	@echo "  setup   - Create venv and install dependencies"
	@echo "  test    - Run tests with coverage"
	@echo "  lint    - Run linters (black, isort, mypy)"
	@echo "  format  - Format code with black and isort"
	@echo "  build   - Build distribution packages"
	@echo "  clean   - Remove build artifacts"
	@echo "  run     - Run simulation with input.json"

setup:
	python3 -m venv .venv && \
	  . .venv/bin/activate && \
	  pip install -e ".[dev]"

test:
	. .venv/bin/activate && \
	  pytest tests/ -v

lint:
	. .venv/bin/activate && \
	  black --check src/ tests/ && \
	  isort --check-only src/ tests/ && \
	  mypy src/

format:
	. .venv/bin/activate && \
	  black src/ tests/ && \
	  isort src/ tests/

build:
	. .venv/bin/activate && \
	  python -m build

clean:
	rm -rf dist/ build/ *.egg-info src/*.egg-info .coverage htmlcov/ .pytest_cache/
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true

run:
	. .venv/bin/activate && \
	  retirement-model run input.json
