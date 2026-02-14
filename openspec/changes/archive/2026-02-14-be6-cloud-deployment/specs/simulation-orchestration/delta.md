## MODIFIED Requirements

### Requirement: API Version Alignment
The API SHALL be versioned under the `/api/v1/` prefix.

#### Scenario: Versioned route prefix
- **WHEN** the API starts
- **THEN** all simulation endpoints SHALL be available under `/api/v1/`
- **AND** `/api/v1/simulate`, `/api/v1/monte-carlo`, `/api/v1/compare`, `/api/v1/strategies` SHALL be the canonical routes

#### Scenario: Root health check
- **WHEN** a request hits `/`
- **THEN** if static assets are mounted, the SPA SHALL be served
- **AND** if no static assets, a JSON health/info response SHALL be returned

#### Scenario: Version is 0.9.0
- **WHEN** the `/api/v1/` root endpoint is called
- **THEN** the version field SHALL be `0.9.0`
- **AND** `pyproject.toml` version SHALL be `0.9.0`

#### Scenario: Backward-compatible redirects
- **WHEN** a request hits an old unversioned route (e.g., `/simulate`)
- **THEN** the API SHALL redirect to the versioned equivalent (`/api/v1/simulate`)
- **AND** these redirects are temporary and may be removed in future versions
