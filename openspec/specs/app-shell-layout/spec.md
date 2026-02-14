## Purpose
Defines the AppBar, navigation, route structure, avatar with profile drawer, and layout shell.

## Requirements

### Requirement: AppBar with navigation
The app SHALL display a Skeleton `AppBar` at the top of every page. The AppBar SHALL contain the app title in the lead slot, navigation links in the center, and an avatar button in the trail slot.

#### Scenario: AppBar visible on all routes
- **WHEN** the user navigates to any route (`/`, `/budget`, `/compare`, `/details`)
- **THEN** the AppBar is visible with the title "Retirement Simulator", navigation links, and avatar button

#### Scenario: Active navigation link
- **WHEN** the user is on the `/budget` route
- **THEN** the "Budget" navigation link is visually marked as active

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
- **THEN** it displays: primary name, spouse name (if applicable), primary age, spouse age (if applicable), simulation years, and dark/light mode toggle

#### Scenario: Drawer edits update stores
- **WHEN** the user changes a name in the profile drawer
- **THEN** the profile store updates and the avatar initials reflect the new name

#### Scenario: Drawer closes
- **WHEN** the user clicks outside the drawer or clicks the close button
- **THEN** the drawer closes

### Requirement: Route-based page navigation
The app SHALL use SvelteKit routes for page navigation. Clicking a navigation link in the AppBar SHALL navigate to the corresponding route without a full page reload.

#### Scenario: Navigate to Budget
- **WHEN** the user clicks the "Budget" link in the AppBar
- **THEN** the browser URL changes to `/budget` and the budget page content is displayed

#### Scenario: Navigate to Compare
- **WHEN** the user clicks the "Compare" link in the AppBar
- **THEN** the browser URL changes to `/compare` and the compare view is displayed

#### Scenario: Navigate home
- **WHEN** the user clicks the "Home" link or the app title in the AppBar
- **THEN** the browser URL changes to `/` and the home page content is displayed

### Requirement: Route definitions
The app SHALL define the following routes:
- `/` — Home page (portfolio editor with simulation controls, results)
- `/budget` — Budget configuration (annual spending, planned expenses)
- `/compare` — Snapshot comparison
- `/details` — Year-by-year simulation details

### Requirement: Layout structure
The root layout SHALL render the AppBar above a content area. The content area SHALL render the current route's page component with consistent padding and max-width constraints.

#### Scenario: Content below AppBar
- **WHEN** any page loads
- **THEN** the page content appears below the AppBar within a centered, max-width container
