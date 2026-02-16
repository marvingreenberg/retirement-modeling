# testing-docs Specification

## Purpose
TBD - created by archiving change fe-2-e2e-testing. Update Purpose after archive.
## Requirements
### Requirement: TESTING.md documentation
A `TESTING.md` file at the project root SHALL document the full testing strategy.

#### Scenario: Describes all test layers
- **WHEN** a developer reads TESTING.md
- **THEN** the document describes three layers: backend unit tests (pytest), frontend unit/component tests (Vitest), and E2E tests (Playwright)

#### Scenario: Includes run commands
- **WHEN** a developer wants to run tests
- **THEN** TESTING.md lists the commands for each layer: `make test-api`, `make test-ui`, `make e2e`

#### Scenario: Explains E2E approach
- **WHEN** a developer reads the E2E section
- **THEN** it explains the full-stack mode (tests hit real API) and the test file organization by feature area

### Requirement: Makefile e2e target
The Makefile `e2e` target SHALL run Playwright E2E tests.

#### Scenario: Running make e2e
- **WHEN** a developer runs `make e2e`
- **THEN** the backend API starts, Playwright tests run against a preview build, and results are reported
- **AND** both servers are cleaned up after tests complete

#### Scenario: Help text includes e2e
- **WHEN** a developer runs `make help`
- **THEN** the `e2e` target is listed with a description of running E2E tests

