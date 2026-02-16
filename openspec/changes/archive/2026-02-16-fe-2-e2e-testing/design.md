## Context

The project has three testing layers: pytest for backend (16 test files, good coverage), Vitest + @testing-library/svelte for frontend unit/component tests (19 files), and Playwright for E2E. The E2E layer currently has one outdated test referencing pre-FE-1 UI elements. After the UX refactoring, routes changed from tab-based to SvelteKit file-based routing (`/`, `/spending`, `/compare`, `/details`), and the setup flow is now a separate view.

The app serves a static SvelteKit build from FastAPI in production (Docker). For development, `pnpm preview` serves the built SvelteKit app and proxies `/api/v1/` to the backend.

## Goals / Non-Goals

**Goals:**
- Comprehensive E2E coverage of all user-facing flows (setup, navigation, simulation, spending, compare, details)
- Both full-stack tests (hitting real API) and mock-based tests (for edge cases and UI-only verification)
- Working `make e2e` target that runs without Docker
- TESTING.md describing the complete testing strategy

**Non-Goals:**
- Performance/load testing
- Visual regression testing
- Cross-browser testing beyond Chromium
- Backend API-level integration tests (already covered by pytest)

## Decisions

**Decision: Use `pnpm build && pnpm preview` for E2E server, not Docker**
Playwright's `webServer` directive builds and serves the SvelteKit preview. This is faster than Docker builds and doesn't require Docker to be installed. The preview server proxies API calls to a running backend.

Alternative: Docker-based E2E (closer to production). Rejected because it's slower and adds a Docker dependency for testing.

**Decision: Separate test files by feature area**
One spec file per page/flow: `setup.spec.ts`, `navigation.spec.ts`, `simulate.spec.ts`, `spending.spec.ts`, `compare.spec.ts`, `details.spec.ts`. Each is independent and can run in parallel.

Alternative: Single large spec file. Rejected for maintainability.

**Decision: Full-stack tests as primary, mocks for edge cases**
Most tests hit the real API via the preview server proxy. Mock tests use `page.route()` to intercept `/api/v1/*` for testing error states, loading states, and edge cases that are hard to reproduce with real data.

**Decision: `skipSetup` helper loads sample data**
A shared helper navigates to `/`, clicks "Load Sample Data", and dismisses the tour. This provides consistent state for all non-setup tests without manual form filling.

## Risks / Trade-offs

- [Full-stack tests require running backend] → The `make e2e` target starts the API server; Playwright config uses `webServer` to start preview. Tests that need real API will fail if backend isn't available — these are skipped in `pnpm e2e` and only run via `make e2e`.
- [Sample data coupling] → Tests depend on the shape of `samplePortfolio`. If sample data changes, tests may break. Mitigation: assert on structure (elements exist) not exact values.
- [Simulation timing] → API simulation calls take variable time. Mitigation: use generous `timeout` on result assertions (15s for simulation results).
