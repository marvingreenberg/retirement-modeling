## MODIFIED Requirements

### Requirement: Tab navigation
The UI previously used a tab bar component (`TabNav`) to switch between Portfolio, Simulate, and Compare views within a single page. This is replaced by route-based navigation in the AppBar. The `TabNav` component is removed.

#### Scenario: Default view on load
- **WHEN** the user opens the application at `/`
- **THEN** the home page is displayed with the portfolio editor and simulation controls

#### Scenario: Switch between views
- **WHEN** the user clicks "Compare" in the AppBar navigation
- **THEN** the browser navigates to `/compare` and the comparison view is displayed

#### Scenario: Portfolio state persists across navigation
- **WHEN** the user edits portfolio fields, navigates to `/compare`, then navigates back to `/`
- **THEN** the previously entered values are preserved (via Svelte stores)

## REMOVED Requirements

### Requirement: Tab navigation
**Reason**: Replaced by route-based navigation in the AppBar (see `app-shell-layout` spec).
**Migration**: Tab-based navigation code (`TabNav.svelte`) is removed. Navigation is handled by AppBar links and SvelteKit routes.
