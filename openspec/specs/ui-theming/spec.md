## Requirements

### Requirement: Skeleton and Tailwind integration
The UI SHALL use Skeleton v4 with Tailwind v4 as its design system. The global stylesheet SHALL import Tailwind, Skeleton core, Skeleton Svelte components, and a Skeleton theme.

#### Scenario: Theme loads on app start
- **WHEN** the application loads in a browser
- **THEN** the Skeleton theme is applied and all components render with themed colors, typography, and spacing

### Requirement: Theme configuration
The app SHALL use a Skeleton built-in theme (cerberus) configured via the `data-theme` attribute on the `<html>` element.

#### Scenario: Theme attribute set
- **WHEN** the app.html file is loaded
- **THEN** the `<html>` tag has `data-theme="cerberus"` set

### Requirement: Light/dark mode toggle
The UI SHALL display a light/dark mode toggle in the app header. The toggle SHALL switch between light and dark color schemes. The user's preference SHALL persist across page reloads via localStorage.

#### Scenario: Toggle to dark mode
- **WHEN** the user clicks the dark mode toggle while in light mode
- **THEN** the UI switches to dark color scheme and the preference is saved

#### Scenario: Preference persists
- **WHEN** the user reloads the page after selecting dark mode
- **THEN** the UI loads in dark mode

#### Scenario: System preference respected
- **WHEN** the user has not explicitly toggled the mode and their OS prefers dark mode
- **THEN** the UI defaults to dark mode
