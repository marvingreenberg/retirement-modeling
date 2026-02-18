## MODIFIED Requirements

### Requirement: Backend readiness check
The E2E test helper SHALL poll `GET /api/v1/status` to determine backend readiness before running tests.

#### Scenario: Backend ready
- **WHEN** the E2E helper polls the backend
- **THEN** it SHALL request `GET /api/v1/status`
- **AND** consider the backend ready when a 200 response is received

#### Scenario: Backend not yet ready
- **WHEN** the E2E helper polls and receives a connection error
- **THEN** it SHALL retry with backoff until the backend responds or timeout is reached
