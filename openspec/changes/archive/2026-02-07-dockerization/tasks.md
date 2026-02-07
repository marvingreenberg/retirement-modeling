## 1. Container Infrastructure

- [x] 1.1 Create `Dockerfile.api` — Python 3.11 slim, install package with pip, run uvicorn on port 8000
- [x] 1.2 Create `Dockerfile.ui` — Node 22 slim, install pnpm, install deps, run vite dev on port 5173
- [x] 1.3 Create `compose.yaml` — api and ui services, shared network, ui/src volume mount, API proxy env var
- [x] 1.4 Configure vite proxy to use env var for API target (default localhost:8000, overridable for compose)
- [x] 1.5 Add `.dockerignore` files to exclude node_modules, .venv, build artifacts

## 2. Makefile Targets

- [x] 2.1 Add `compose-up` target (start services detached)
- [x] 2.2 Add `compose-down` target (stop and remove)
- [x] 2.3 Add `e2e` target (compose up, run playwright, compose down)

## 3. Playwright E2E Setup

- [x] 3.1 Install `@playwright/test` as ui devDependency
- [x] 3.2 Create `ui/playwright.config.ts` targeting http://localhost:5173
- [x] 3.3 Add `ui/e2e/simulate.spec.ts` — navigate to app, click Simulate, verify results appear
- [x] 3.4 Add npm scripts: `test:e2e` (run playwright), `test:e2e:install` (install browsers)

## 4. Verification

- [x] 4.1 Verify `docker compose up` starts both services and UI proxies to API
- [x] 4.2 Run Playwright E2E test against compose stack, confirm it passes
