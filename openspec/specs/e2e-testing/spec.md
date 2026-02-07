## Requirements

### Requirement: Playwright test infrastructure
The UI project includes Playwright as a devDependency with a configuration file targeting the local or containerized dev server.

#### Scenario: Playwright configured
- **WHEN** a developer runs `npx playwright test` from the ui/ directory
- **THEN** Playwright runs E2E tests against http://localhost:5173

#### Scenario: Browser installation
- **WHEN** a developer runs `npx playwright install` for the first time
- **THEN** Chromium (at minimum) is downloaded for headless testing

### Requirement: Simulate flow E2E test
A Playwright test verifies the core simulate workflow end-to-end through the real API.

#### Scenario: Run single simulation
- **WHEN** the E2E test navigates to the app
- **AND** switches to the Simulate tab
- **AND** clicks the Simulate button with the default portfolio
- **THEN** simulation results appear (summary section with Final Balance, Total Taxes)
- **AND** no error messages are displayed

#### Scenario: Results contain expected structure
- **WHEN** simulation results are displayed
- **THEN** a balance chart canvas element is present
- **AND** summary statistics are visible (not asserting specific values)

### Requirement: E2E tests tolerate UI evolution
E2E tests use resilient locator strategies that survive layout changes.

#### Scenario: Locator strategy
- **WHEN** writing E2E test selectors
- **THEN** prefer accessible locators (role, label, text) over CSS selectors
- **AND** assert on user-visible outcomes (text appears, section visible) not DOM structure
