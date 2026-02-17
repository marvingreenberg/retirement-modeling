## Purpose
Defines the AppBar, navigation, route structure, avatar with dropdown menu, and layout shell.
## Requirements
### Requirement: AppBar with navigation
The app SHALL display a Skeleton `AppBar` at the top of every page. The AppBar SHALL contain the app title in the lead slot, navigation links in the center, and an avatar button plus a help button in the trail slot. Navigation links SHALL be: Overview, Compare, Details. The help button SHALL use a `CircleHelp` icon and be placed before the avatar button.

#### Scenario: AppBar visible on all routes
- **WHEN** the user navigates to any route (`/`, `/compare`, `/details`, `/settings`)
- **THEN** the AppBar is visible with the title "Retirement Simulator", navigation links (Overview, Compare, Details), help button, and avatar button

#### Scenario: Active navigation link
- **WHEN** the user is on the `/compare` route
- **THEN** the "Compare" navigation link is visually marked as active

#### Scenario: Help button opens help drawer
- **WHEN** the user clicks the help button in the AppBar
- **THEN** the help drawer opens from the right side

### Requirement: Avatar button with generated image
The AppBar SHALL display an avatar button showing a DiceBear-generated image based on the user's primary name. The image URL uses the DiceBear HTTP API: `https://api.dicebear.com/9.x/thumbs/svg?seed={name}`. If the image fails to load or no name is set, a fallback lucide User icon is displayed. Clicking the avatar SHALL open a dropdown menu.

#### Scenario: Avatar shows generated image
- **WHEN** primaryName is "Mike"
- **THEN** the avatar displays a DiceBear-generated SVG image seeded with "Mike"

#### Scenario: Avatar fallback
- **WHEN** no name has been entered or the DiceBear image fails to load
- **THEN** the avatar displays a lucide User icon

#### Scenario: Avatar opens dropdown
- **WHEN** the user clicks the avatar button
- **THEN** a dropdown menu appears anchored to the avatar

### Requirement: Avatar dropdown menu
Clicking the avatar button SHALL open a dropdown menu anchored to the avatar. The dropdown contains the avatar image, name(s) below it, a divider, three settings section links (Basic Info, Load/Save, Advanced Settings) with icons, a second divider, and two checkbox toggles (Dark Mode, Auto-save). Clicking a section link navigates to `/settings?section=<id>` and closes the dropdown. Clicking outside the dropdown closes it. The avatar dropdown SHALL work on all routes including `/settings`.

#### Scenario: Dropdown contents
- **WHEN** the avatar dropdown is open with primaryName "Mike" and spouseName "Karen"
- **THEN** it displays the avatar image, "Mike & Karen" text, a divider, Basic Info / Load/Save / Advanced Settings links with icons, a second divider, and Dark Mode and Auto-save checkboxes

#### Scenario: Dropdown section link navigates to settings
- **WHEN** the user clicks "Basic Info" in the dropdown
- **THEN** the app navigates to `/settings?section=basic` and the dropdown closes

#### Scenario: Dropdown section link for Advanced Settings
- **WHEN** the user clicks "Advanced Settings" in the dropdown
- **THEN** the app navigates to `/settings?section=advanced` and the dropdown closes

#### Scenario: Dropdown dark mode toggle
- **WHEN** the user clicks the Dark Mode checkbox in the dropdown
- **THEN** the app theme switches between dark and light mode without closing the dropdown

#### Scenario: Dropdown auto-save toggle
- **WHEN** the user clicks the Auto-save checkbox in the dropdown
- **THEN** auto-save is toggled and localStorage preference is updated without closing the dropdown

#### Scenario: Dropdown closes on outside click
- **WHEN** the dropdown is open and the user clicks outside it
- **THEN** the dropdown closes

#### Scenario: Avatar works on settings page
- **WHEN** the user is on the `/settings` route and clicks the avatar
- **THEN** the dropdown opens normally

### Requirement: Dark mode toggle location
The dark/light mode toggle SHALL be accessible exclusively from the avatar dropdown on every page.

#### Scenario: No toggle in AppBar
- **WHEN** the user views the AppBar
- **THEN** no dark/light mode toggle is visible in the bar itself

#### Scenario: Toggle in dropdown
- **WHEN** the user opens the avatar dropdown
- **THEN** a dark/light mode toggle checkbox is visible below the section links

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
- `/compare` — Snapshot comparison
- `/details` — Year-by-year simulation details
- `/settings` — Settings page with Basic Info, Load/Save, Advanced Settings

#### Scenario: Navigate to Settings
- **WHEN** the user clicks "Settings" in the avatar dropdown
- **THEN** the browser URL changes to `/settings` and the settings page is displayed

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
