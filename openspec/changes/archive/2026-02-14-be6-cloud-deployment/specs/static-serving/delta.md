## ADDED Requirements

### Requirement: Static Asset Serving
The FastAPI application SHALL serve built SvelteKit static assets when available.

#### Scenario: Static directory exists
- **WHEN** the `static/` directory exists relative to the `api` module
- **THEN** FastAPI SHALL mount `StaticFiles(directory=static_dir, html=True)` at `/`
- **AND** requests not matching API routes SHALL serve static files
- **AND** the SPA fallback (`index.html`) SHALL handle client-side routing

#### Scenario: Static directory absent
- **WHEN** the `static/` directory does not exist (e.g., during local API-only development)
- **THEN** no static mount SHALL be registered
- **AND** API routes SHALL function normally without error

#### Scenario: API routes take priority
- **WHEN** a request matches both an API route and a potential static file path
- **THEN** the API route SHALL be served (explicit routes registered before static mount)

#### Scenario: Startup logging
- **WHEN** the application starts
- **THEN** it SHALL log whether static asset serving is active or inactive
