## Why

The existing E2E test suite has a single outdated test referencing UI elements that no longer exist (e.g., "Simulate tab"). After the FE-1 UX refactoring, we need comprehensive E2E coverage for the new route-based navigation, setup flow, simulation workflow, spending page, compare page, and details page. We also lack documentation describing the testing strategy and a working Makefile target.

## What Changes

- Rewrite the outdated `simulate.spec.ts` to match the current landing-page simulation flow
- Add E2E tests for: first-use setup flow, route navigation, spending page, compare page (via "Add to Comparison"), details page
- Support two modes: full-stack tests (FE → real BE API) and mock-based tests (Playwright route interception for edge cases)
- Update `playwright.config.ts` to use a preview build with webServer directive
- Create `TESTING.md` documenting the full testing strategy (unit, component, E2E)
- Update the Makefile `e2e` target to run Playwright against a preview build (not Docker)

## Capabilities

### New Capabilities
- `e2e-test-suites`: Comprehensive Playwright E2E test files covering setup, navigation, simulation, spending, compare, and details flows
- `testing-docs`: TESTING.md documentation describing the project's unit, component, and E2E testing approach, plus Makefile integration

### Modified Capabilities
- `e2e-testing`: Update existing spec to reflect new route-based navigation, multiple test files, full-stack and mock modes, and preview-server configuration

## Impact

- `ui/e2e/` — new and rewritten test files
- `ui/playwright.config.ts` — updated webServer config
- `Makefile` — updated `e2e` target
- `TESTING.md` — new file at project root
- No backend changes; tests exercise the existing API endpoints
