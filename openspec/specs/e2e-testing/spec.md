## Purpose

End-to-end testing infrastructure using Playwright to verify user-facing flows through a real browser against the built application.
## Requirements
### Requirement: Backend readiness check
The E2E test helper SHALL poll `GET /api/v1/status` to determine backend readiness before running tests.

#### Scenario: Backend ready
- **WHEN** the E2E helper polls the backend
- **THEN** it SHALL request `GET /api/v1/status`
- **AND** consider the backend ready when a 200 response is received

#### Scenario: Backend not yet ready
- **WHEN** the E2E helper polls and receives a connection error
- **THEN** it SHALL retry with backoff until the backend responds or timeout is reached

### Requirement: Playwright test infrastructure
The UI project SHALL include Playwright as a devDependency with a configuration file. The webServer directive MUST build the SvelteKit app and run `pnpm preview` on port 4173. Tests run against the preview server.

#### Scenario: Playwright configured
- **WHEN** a developer runs `npx playwright test` from the ui/ directory
- **THEN** Playwright builds the app, starts a preview server, and runs E2E tests against http://localhost:4173

#### Scenario: Browser installation
- **WHEN** a developer runs `npx playwright install` for the first time
- **THEN** Chromium (at minimum) is downloaded for headless testing

### Requirement: Simulate flow E2E test
A Playwright test SHALL verify the core simulate workflow end-to-end using sample data on the landing page.

#### Scenario: Run single simulation
- **WHEN** the E2E test loads sample data via the setup flow
- **AND** clicks the Simulate button on the landing page
- **THEN** simulation results appear (summary section with Final Balance, Total Taxes)
- **AND** no error messages are displayed

#### Scenario: Results contain expected structure
- **WHEN** simulation results are displayed
- **THEN** a balance chart canvas element is present
- **AND** summary statistics are visible

### Requirement: E2E tests tolerate UI evolution
E2E tests MUST use resilient locator strategies that survive layout changes.

#### Scenario: Locator strategy
- **WHEN** writing E2E test selectors
- **THEN** prefer accessible locators (role, label, text) over CSS selectors
- **AND** assert on user-visible outcomes (text appears, section visible) not DOM structure

