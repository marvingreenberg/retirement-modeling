## Why

The project has no containerization. Developers manually start the FastAPI backend and SvelteKit dev server, and E2E tests can't run without both. Beyond testing, containerization provides a foundation for deployment, quick demos (anyone can `docker compose up` without installing Python, Node, or pnpm), onboarding new contributors, and eventually CI/CD pipelines. A single `compose up` that runs the full stack is table stakes for a multi-service project.

## What Changes

- Add Dockerfiles for the FastAPI API service and SvelteKit UI dev server
- Add a Compose file (compatible with both Docker Compose and Podman Compose) to orchestrate services
- Add Playwright for browser-based E2E tests that run against the containerized stack
- Add a Playwright E2E test that exercises the simulate flow through the proxy
- Add Makefile targets for container-based workflows (`e2e`, `compose-up`, `compose-down`)

## Capabilities

### New Capabilities
- `containerization`: Dockerfiles, Compose configuration, and Makefile targets for running the full stack in containers
- `e2e-testing`: Playwright setup, E2E test infrastructure, and initial simulate-flow test

### Modified Capabilities

## Impact

- New files: `Dockerfile.api`, `Dockerfile.ui`, `compose.yaml`, `ui/playwright.config.ts`, `ui/e2e/`
- New dependencies: `@playwright/test` (ui devDependency)
- Makefile: new targets for container and E2E workflows
- No changes to existing application code or behavior
