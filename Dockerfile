# Stage 1: Build SvelteKit static assets
FROM node:22-slim AS frontend

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY ui/package.json ui/pnpm-lock.yaml ui/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY ui/ .
RUN pnpm exec svelte-kit sync
RUN pnpm build

# Stage 2: Python API + static assets
FROM python:3.11-slim

ARG VERSION=0.0.0

WORKDIR /app

COPY pyproject.toml .
COPY src/ src/

# Copy built frontend into the static dir FastAPI expects
COPY --from=frontend /app/build/ src/retirement_model/static/

ENV SETUPTOOLS_SCM_PRETEND_VERSION=${VERSION}
RUN pip install --no-cache-dir .

EXPOSE 8000

CMD ["uvicorn", "retirement_model.api:app", "--host", "0.0.0.0", "--port", "8000"]
