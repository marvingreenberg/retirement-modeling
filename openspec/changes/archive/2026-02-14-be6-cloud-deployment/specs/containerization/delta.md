## MODIFIED Requirements

### Requirement: Single Combined Dockerfile
A single multi-stage Dockerfile SHALL build and run both the API and the static frontend.

#### Scenario: Build combined image
- **WHEN** a developer runs `docker build -t retirement-app .`
- **THEN** stage 1 (node) SHALL install pnpm dependencies and run `pnpm build` to produce static assets
- **AND** stage 2 (python) SHALL copy the build output into `src/retirement_model/static/`
- **AND** stage 2 SHALL install the Python package via pip

#### Scenario: Run combined container
- **WHEN** the combined container starts
- **THEN** uvicorn SHALL serve the FastAPI app on port 8000
- **AND** API routes SHALL be available at `/api/v1/*`
- **AND** the SvelteKit SPA SHALL be served at `/`

### Requirement: Makefile Development Workflow
The Makefile SHALL provide targets for local development and Docker integration testing.

#### Scenario: Local development
- **WHEN** a developer runs `make dev`
- **THEN** uvicorn SHALL start with `--reload` for the API on port 8000
- **AND** `pnpm dev` SHALL start for the SvelteKit frontend
- **AND** both processes SHALL be killed on Ctrl+C

#### Scenario: Docker integration test
- **WHEN** a developer runs `make docker-run`
- **THEN** the combined Docker image SHALL be built
- **AND** a container SHALL run on port 8000
- **AND** the developer can browse `localhost:8000` for the full integrated app

## REMOVED Requirements

### Requirement: API service Dockerfile
**Reason**: Replaced by single combined Dockerfile
**Migration**: Use `docker build .` instead of `docker build -f Dockerfile.api .`

### Requirement: UI service Dockerfile
**Reason**: Replaced by single combined Dockerfile; `pnpm dev` runs natively via `make dev`
**Migration**: Use `make dev` for local development, `make docker-run` for integration testing

### Requirement: Compose orchestration
**Reason**: Two-container compose replaced by single combined image and `make dev`
**Migration**: Use `make dev` (local) or `make docker-run` (Docker)

### Requirement: Makefile targets for container workflows
**Reason**: `compose-up`/`compose-down` replaced by `dev`/`docker-run`
**Migration**: `make dev` replaces `make compose-up`; `make docker-run` for Docker testing
