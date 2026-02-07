## Requirements

### Requirement: API service Dockerfile
A Dockerfile builds and runs the FastAPI backend service.

#### Scenario: Build API image
- **WHEN** a developer runs `docker build -f Dockerfile.api -t retirement-api .`
- **THEN** the image installs Python dependencies and the retirement_model package

#### Scenario: Run API container
- **WHEN** the API container starts
- **THEN** uvicorn serves the FastAPI app on port 8000
- **AND** the API accepts requests from other containers on the compose network

### Requirement: UI service Dockerfile
A Dockerfile runs the SvelteKit dev server with API proxy configured to reach the API container.

#### Scenario: Build UI image
- **WHEN** a developer runs `docker build -f Dockerfile.ui -t retirement-ui .`
- **THEN** the image installs pnpm dependencies for the ui/ directory

#### Scenario: Run UI container
- **WHEN** the UI container starts
- **THEN** vite dev serves on port 5173
- **AND** the `/api` proxy forwards to the API service on the compose network

### Requirement: Compose orchestration
A `compose.yaml` file defines both services and a shared network, compatible with Docker Compose and Podman Compose.

#### Scenario: Start full stack
- **WHEN** a developer runs `docker compose up` (or `podman compose up`)
- **THEN** both api and ui services start
- **AND** the UI is accessible at http://localhost:5173
- **AND** the API is accessible at http://localhost:8000

#### Scenario: Stop full stack
- **WHEN** a developer runs `docker compose down`
- **THEN** both services stop and containers are removed

#### Scenario: UI source mounts for development
- **WHEN** the compose stack is running
- **THEN** the ui/src directory is volume-mounted into the UI container
- **AND** file changes on the host trigger vite HMR in the container

### Requirement: Makefile targets for container workflows
The Makefile includes targets for common container operations.

#### Scenario: Start containers
- **WHEN** a developer runs `make compose-up`
- **THEN** `docker compose up -d` (or equivalent) starts both services in detached mode

#### Scenario: Stop containers
- **WHEN** a developer runs `make compose-down`
- **THEN** `docker compose down` stops and removes containers

#### Scenario: Run E2E tests
- **WHEN** a developer runs `make e2e`
- **THEN** the compose stack is started, Playwright tests run against it, and the stack is torn down
