## MODIFIED Requirements

### Requirement: AppBar with navigation
The app SHALL display a Skeleton `AppBar` at the top of every page. The AppBar SHALL contain the app title in the lead slot, navigation links in the center, and an avatar button plus a help button in the trail slot. Navigation links SHALL be: Overview, Spending, Compare, Details. Each nav tab SHALL support a `data-tour` attribute for tooltip anchoring. The help button SHALL use a `CircleHelp` icon and be placed before the avatar button.

#### Scenario: AppBar visible on all routes
- **WHEN** the user navigates to any route (`/`, `/spending`, `/compare`, `/details`)
- **THEN** the AppBar is visible with the title "Retirement Simulator", navigation links (Overview, Spending, Compare, Details), help button, and avatar button

#### Scenario: Active navigation link
- **WHEN** the user is on the `/compare` route
- **THEN** the "Compare" navigation link is visually marked as active

#### Scenario: Help button opens help drawer
- **WHEN** the user clicks the help button in the AppBar
- **THEN** the help drawer opens from the right side
