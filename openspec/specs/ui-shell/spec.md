## Requirements

### Requirement: SvelteKit project structure
The UI SHALL be a SvelteKit project in the `ui/` directory at the repository root, with TypeScript enabled and static adapter configured for SPA output.

#### Scenario: Project initializes and builds
- **WHEN** a developer runs `npm install && npm run build` in the `ui/` directory
- **THEN** the project builds successfully and outputs static files to `ui/build/`

#### Scenario: Dev server starts
- **WHEN** a developer runs `npm run dev` in the `ui/` directory
- **THEN** the SvelteKit dev server starts on port 5173

### Requirement: Tab navigation
The UI SHALL display a tab bar with three tabs: Portfolio, Simulate, and Compare. Clicking a tab SHALL display the corresponding view content.

#### Scenario: Default tab on load
- **WHEN** the user opens the application
- **THEN** the Portfolio tab is active and the portfolio editor is displayed

#### Scenario: Switch between tabs
- **WHEN** the user clicks the "Simulate" tab
- **THEN** the Simulate view is displayed and the tab is visually marked as active

#### Scenario: Portfolio state persists across tabs
- **WHEN** the user edits portfolio fields, switches to Simulate, then switches back to Portfolio
- **THEN** the previously entered values are preserved

### Requirement: API proxy configuration
The SvelteKit dev server SHALL proxy requests with path prefix `/api` to the FastAPI backend at `http://localhost:8000`, stripping the `/api` prefix.

#### Scenario: API request proxied in development
- **WHEN** the UI makes a fetch request to `/api/strategies`
- **THEN** the request is proxied to `http://localhost:8000/strategies` and the response is returned

### Requirement: Makefile targets
The project Makefile SHALL include targets for UI operations: `ui-setup` (install dependencies), `ui-dev` (start dev server), and `ui-build` (production build).

#### Scenario: UI setup via make
- **WHEN** a developer runs `make ui-setup`
- **THEN** npm dependencies are installed in the `ui/` directory

#### Scenario: UI dev via make
- **WHEN** a developer runs `make ui-dev`
- **THEN** the SvelteKit dev server starts
