## MODIFIED Requirements

### Requirement: Route definitions
The app SHALL define the following routes:
- `/` — Overview page (portfolio editor with simulation controls, results)
- `/compare` — Snapshot comparison
- `/details` — Year-by-year simulation details

Budget configuration is inline in the PortfolioEditor left panel, not a separate route.

#### Scenario: Overview route
- **WHEN** the user navigates to `/`
- **THEN** the Overview page content is displayed

### Requirement: Route-based page navigation
The app SHALL use SvelteKit routes for page navigation. Clicking a navigation link in the AppBar SHALL navigate to the corresponding route without a full page reload.

#### Scenario: Navigate to Compare
- **WHEN** the user clicks the "Compare" link in the AppBar
- **THEN** the browser URL changes to `/compare` and the compare view is displayed

#### Scenario: Navigate to Overview
- **WHEN** the user clicks the "Overview" link or the app title in the AppBar
- **THEN** the browser URL changes to `/` and the Overview page content is displayed

### Requirement: AppBar with navigation
The app SHALL display a Skeleton `AppBar` at the top of every page. The AppBar SHALL contain the app title in the lead slot, navigation links in the center, and an avatar button in the trail slot. Navigation links SHALL be: Overview, Compare, Details. Each nav tab SHALL support a `data-tour` attribute for tooltip anchoring.

#### Scenario: AppBar visible on all routes
- **WHEN** the user navigates to any route (`/`, `/compare`, `/details`)
- **THEN** the AppBar is visible with the title "Retirement Simulator", navigation links (Overview, Compare, Details), and avatar button
