## ADDED Requirements

### Requirement: Health status endpoint
The API SHALL provide a `GET /api/v1/status` endpoint that returns the application status and version.

#### Scenario: Successful health check
- **WHEN** a client sends `GET /api/v1/status`
- **THEN** the response SHALL be HTTP 200 with JSON body `{ "status": "ok", "version": "<semver>" }`
- **AND** the version SHALL match the installed package version from `pyproject.toml`

#### Scenario: No authentication required
- **WHEN** a client sends `GET /api/v1/status` without credentials
- **THEN** the endpoint SHALL respond with 200 (no auth required)
