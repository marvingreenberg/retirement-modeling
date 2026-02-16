## Purpose
Defines the AppBar, navigation, route structure, avatar with profile drawer, and layout shell.
## Requirements
### Requirement: AppBar with navigation
The app SHALL display a Skeleton `AppBar` at the top of every page. The AppBar SHALL contain the app title in the lead slot, navigation links in the center, and an avatar button in the trail slot. Navigation links SHALL be: Overview, Spending, Compare, Details. Each nav tab SHALL support a `data-tour` attribute for tooltip anchoring.

#### Scenario: AppBar visible on all routes
- **WHEN** the user navigates to any route (`/`, `/spending`, `/compare`, `/details`)
- **THEN** the AppBar is visible with the title "Retirement Simulator", navigation links (Overview, Spending, Compare, Details), and avatar button

#### Scenario: Active navigation link
- **WHEN** the user is on the `/compare` route
- **THEN** the "Compare" navigation link is visually marked as active

### Requirement: Avatar button with initials
The AppBar SHALL display an avatar button showing the user's initials. Clicking the avatar SHALL open the profile drawer.

#### Scenario: Avatar shows couple initials
- **WHEN** primaryName is "Mike" and spouseName is "Karen"
- **THEN** the avatar displays "M,K" in a circle

#### Scenario: Avatar shows single initial
- **WHEN** primaryName is "Mike" and spouseName is empty
- **THEN** the avatar displays "M" in a circle

#### Scenario: Avatar before setup
- **WHEN** no name has been entered (pre-setup state)
- **THEN** the avatar displays a generic person icon

#### Scenario: Avatar opens drawer
- **WHEN** the user clicks the avatar button
- **THEN** the profile drawer opens

### Requirement: Dark mode toggle location
The dark/light mode toggle SHALL be accessible from the profile drawer, not from the AppBar directly.

#### Scenario: No toggle in AppBar
- **WHEN** the user views the AppBar
- **THEN** no dark/light mode toggle is visible in the bar itself

### Requirement: Profile drawer
A slide-out drawer SHALL open from the right when the user clicks the avatar button. The drawer SHALL contain people/timeline settings and preferences.

#### Scenario: Drawer contents
- **WHEN** the profile drawer is open
- **THEN** it displays: primary name, spouse name (if applicable), primary age, spouse age (if applicable), simulation years, start year, and dark/light mode toggle

#### Scenario: Drawer edits update stores
- **WHEN** the user changes a name in the profile drawer
- **THEN** the profile store updates and the avatar initials reflect the new name

#### Scenario: Drawer closes
- **WHEN** the user clicks outside the drawer or clicks the close button
- **THEN** the drawer closes

### Requirement: Route-based page navigation
The app SHALL use SvelteKit routes for page navigation. Clicking a navigation link in the AppBar SHALL navigate to the corresponding route without a full page reload.

#### Scenario: Navigate to Compare
- **WHEN** the user clicks the "Compare" link in the AppBar
- **THEN** the browser URL changes to `/compare` and the compare view is displayed

#### Scenario: Navigate to Overview
- **WHEN** the user clicks the "Overview" link or the app title in the AppBar
- **THEN** the browser URL changes to `/` and the Overview page content is displayed

### Requirement: Route definitions
The app SHALL define the following routes:
- `/` — Overview page (simulation controls, results, accounts, income)
- `/spending` — Spending plan management
- `/compare` — Snapshot comparison
- `/details` — Year-by-year simulation details

#### Scenario: Navigate to Spending
- **WHEN** the user clicks the "Spending" link in the AppBar
- **THEN** the browser URL changes to `/spending` and the spending plan view is displayed

### Requirement: Layout structure
The root layout SHALL render the AppBar above a color accent bar, followed by a content area. The content area SHALL render the current route's page component with consistent padding and max-width constraints.

#### Scenario: Content below AppBar and color bar
- **WHEN** any page loads
- **THEN** the page content appears below the AppBar and color accent bar within a centered, max-width container

### Requirement: Color accent bar
The layout SHALL display a 4px gradient color bar between the AppBar and the main content area, using primary-500, tertiary-500, and success-500 colors.

#### Scenario: Color bar visible on all pages
- **WHEN** any page loads
- **THEN** a gradient color bar is visible immediately below the AppBar

