## Requirements

### Requirement: AppBar with navigation
The app SHALL display a Skeleton `AppBar` at the top of every page. The AppBar SHALL contain the app title in the lead slot, navigation links in the center, and a dark mode toggle and avatar in the trail slot.

#### Scenario: AppBar visible on all routes
- **WHEN** the user navigates to any route (`/`, `/spending`, `/compare`, `/details`)
- **THEN** the AppBar is visible with the title "Retirement Simulator", navigation links, dark mode toggle, and avatar

#### Scenario: Active navigation link
- **WHEN** the user is on the `/spending` route
- **THEN** the "Spending" navigation link is visually marked as active

### Requirement: Route-based page navigation
The app SHALL use SvelteKit routes for page navigation. Clicking a navigation link in the AppBar SHALL navigate to the corresponding route without a full page reload.

#### Scenario: Navigate to Spending
- **WHEN** the user clicks the "Spending" link in the AppBar
- **THEN** the browser URL changes to `/spending` and the spending page content is displayed

#### Scenario: Navigate to Compare
- **WHEN** the user clicks the "Compare" link in the AppBar
- **THEN** the browser URL changes to `/compare` and the compare view is displayed

#### Scenario: Navigate home
- **WHEN** the user clicks the "Home" link or the app title in the AppBar
- **THEN** the browser URL changes to `/` and the home page content is displayed

### Requirement: Route definitions
The app SHALL define the following routes:
- `/` — Home page (two-panel layout: portfolio editor with simulation controls on the left, results on the right)
- `/spending` — Spending strategies
- `/compare` — Snapshot comparison
- `/details` — Detailed results (placeholder)

#### Scenario: Home route content
- **WHEN** the user navigates to `/`
- **THEN** the two-panel landing page is displayed with the portfolio editor on the left and the results area on the right

#### Scenario: Spending route content
- **WHEN** the user navigates to `/spending`
- **THEN** a placeholder page is displayed (spending extraction deferred to ux-config-spending change)

#### Scenario: Compare route content
- **WHEN** the user navigates to `/compare`
- **THEN** the snapshot comparison view is displayed

#### Scenario: Details route placeholder
- **WHEN** the user navigates to `/details`
- **THEN** a placeholder page is displayed indicating detailed results will appear here

### Requirement: Avatar placeholder
The AppBar SHALL display an avatar icon in the trail slot. The avatar is a visual placeholder with no authentication functionality.

#### Scenario: Avatar displayed
- **WHEN** the app loads
- **THEN** a default avatar icon is visible in the AppBar trail area

### Requirement: Layout structure
The root layout SHALL render the AppBar above a content area. The content area SHALL render the current route's page component with consistent padding and max-width constraints.

#### Scenario: Content below AppBar
- **WHEN** any page loads
- **THEN** the page content appears below the AppBar within a centered, max-width container
