## MODIFIED Requirements

### Requirement: AppBar with navigation
The app SHALL display a Skeleton `AppBar` at the top of every page. The AppBar SHALL contain the app title in the lead slot, navigation links in the center, and an avatar button plus a help button in the trail slot. Navigation links SHALL be: Overview, Compare, Details. The help button SHALL use a `CircleHelp` icon and be placed before the avatar button.

#### Scenario: AppBar visible on all routes
- **WHEN** the user navigates to any route (`/`, `/compare`, `/details`, `/settings`)
- **THEN** the AppBar is visible with the title "Retirement Simulator", navigation links (Overview, Compare, Details), help button, and avatar button

#### Scenario: Active navigation link
- **WHEN** the user is on the `/compare` route
- **THEN** the "Compare" navigation link is visually marked as active

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
Clicking the avatar button SHALL open a small dropdown menu anchored to the avatar. The dropdown contains the avatar image, name(s) below it, a divider, and a "Settings" link that navigates to `/settings`. Clicking outside the dropdown closes it. On the `/settings` route, the avatar click does nothing (already on settings).

#### Scenario: Dropdown contents
- **WHEN** the avatar dropdown is open with primaryName "Mike" and spouseName "Karen"
- **THEN** it displays the avatar image, "Mike & Karen" text, a divider, and a "Settings" link

#### Scenario: Dropdown Settings link
- **WHEN** the user clicks "Settings" in the dropdown
- **THEN** the app navigates to `/settings` and the dropdown closes

#### Scenario: Dropdown closes on outside click
- **WHEN** the dropdown is open and the user clicks outside it
- **THEN** the dropdown closes

#### Scenario: Avatar on settings page
- **WHEN** the user is on the `/settings` route and clicks the avatar
- **THEN** nothing happens (no dropdown opens)

### Requirement: Dark mode toggle location
The dark/light mode toggle SHALL be accessible from the settings page, not from the AppBar or a profile drawer.

#### Scenario: No toggle in AppBar
- **WHEN** the user views the AppBar
- **THEN** no dark/light mode toggle is visible in the bar itself

### Requirement: Route definitions
The app SHALL define the following routes:
- `/` — Overview page (simulation controls, results, accounts, income)
- `/compare` — Snapshot comparison
- `/details` — Year-by-year simulation details
- `/settings` — Settings page with Basic Info, Load/Save, Advanced Settings

#### Scenario: Navigate to Settings
- **WHEN** the user clicks "Settings" in the avatar dropdown
- **THEN** the browser URL changes to `/settings` and the settings page is displayed

## REMOVED Requirements

### Requirement: Avatar button with initials
(Replaced by DiceBear-generated avatar image)

### Requirement: Profile drawer
(Replaced by avatar dropdown menu + settings page)

### Requirement: ProfileDrawer includes Advanced settings
(Moved to settings page Advanced Settings panel)
