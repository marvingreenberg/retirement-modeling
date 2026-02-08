## Requirements

### Requirement: SvelteKit project structure
The UI SHALL be a SvelteKit project in the `ui/` directory at the repository root, with TypeScript enabled and static adapter configured for SPA output.

#### Scenario: Project initializes and builds
- **WHEN** a developer runs `npm install && npm run build` in the `ui/` directory
- **THEN** the project builds successfully and outputs static files to `ui/build/`

#### Scenario: Dev server starts
- **WHEN** a developer runs `npm run dev` in the `ui/` directory
- **THEN** the SvelteKit dev server starts on port 5173

### Requirement: Route-based navigation
The UI SHALL use route-based navigation via the AppBar. Navigating between routes SHALL preserve application state via Svelte stores.

#### Scenario: Default view on load
- **WHEN** the user opens the application at `/`
- **THEN** the home page is displayed with the portfolio editor and simulation controls

#### Scenario: Switch between views
- **WHEN** the user clicks "Compare" in the AppBar navigation
- **THEN** the browser navigates to `/compare` and the comparison view is displayed

#### Scenario: Portfolio state persists across navigation
- **WHEN** the user edits portfolio fields, navigates to `/compare`, then navigates back to `/`
- **THEN** the previously entered values are preserved (via Svelte stores)

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
