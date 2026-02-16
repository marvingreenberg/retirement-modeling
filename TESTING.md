# Testing

Three test layers cover the retirement modeling application.

## Backend Unit Tests (pytest)

Tests for the simulation engine, tax calculations, withdrawal ordering, income streams, and API endpoints.

```bash
make test-api          # Run with coverage
```

- **Location**: `tests/`
- **Framework**: pytest with coverage, fixtures in `conftest.py`
- **Style**: Unit tests with mocked dependencies; parametrized tests for tax brackets and strategies

## Frontend Unit/Component Tests (Vitest)

Tests for Svelte components, stores, validation logic, and formatting utilities.

```bash
make test-ui           # Run with coverage
```

- **Location**: `ui/src/**/*.test.ts`
- **Framework**: Vitest + @testing-library/svelte + jsdom
- **Style**: Query by role/label, assert on rendered output. Svelte 5 runes with `$state`/`$derived`.

## E2E Tests (Playwright)

End-to-end tests that exercise the full app through a browser. Tests load sample data and interact with the real UI. When run via `make e2e`, they hit the real backend API (full-stack integration). When run via `pnpm e2e` in `ui/`, they only test UI behavior against the preview server (API calls will fail without a backend).

```bash
make e2e               # Full-stack: starts backend + preview server, runs Playwright
cd ui && pnpm e2e      # UI-only: runs against preview server (no backend)
```

- **Location**: `ui/e2e/`
- **Framework**: Playwright (Chromium, headless)
- **Server**: `pnpm build && pnpm preview --port 4173` via Playwright's `webServer` directive

### Test Files

| File | Coverage |
|------|----------|
| `setup.spec.ts` | First-use flow: name/age entry, validation, spouse toggle, sample data |
| `navigation.spec.ts` | Route navigation, AppBar links, color bar, profile drawer |
| `simulate.spec.ts` | Single + Monte Carlo simulation, results display, add-to-comparison |
| `spending.spec.ts` | Spending page load and content |
| `compare.spec.ts` | Empty state, snapshot after simulation |
| `details.spec.ts` | Pre-simulation prompt, year-by-year table after simulation |

### Locator Strategy

Tests use accessible locators (role, label, text) rather than CSS selectors. Assertions target user-visible outcomes, not DOM structure. This makes tests resilient to layout changes.

## Running All Tests

```bash
make test              # Backend + frontend unit tests
make e2e               # E2E tests (full-stack)
```
