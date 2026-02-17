## MODIFIED Requirements

### Requirement: Settings route with left-nav layout
The app SHALL provide a `/settings` route displaying a left-nav + content panel layout. The left nav lists section links: Basic Info, Load/Save, Advanced Settings. Clicking a section highlights it and displays its content panel. The page header shows the user's generated avatar and name(s). If the URL contains a `?section=basic|loadsave|advanced` query parameter, the corresponding section SHALL be pre-selected on page load.

#### Scenario: Settings page renders
- **WHEN** the user navigates to `/settings`
- **THEN** a left nav with three section links is displayed alongside a content panel showing the active section

#### Scenario: Section navigation
- **WHEN** the user clicks "Advanced Settings" in the left nav
- **THEN** the Advanced Settings panel is displayed and the nav item is highlighted

#### Scenario: Deep-link to section via query param
- **WHEN** the user navigates to `/settings?section=advanced`
- **THEN** the Advanced Settings panel is displayed and highlighted in the left nav

#### Scenario: Deep-link to Load/Save
- **WHEN** the user navigates to `/settings?section=loadsave`
- **THEN** the Load/Save panel is displayed

#### Scenario: Invalid or missing query param defaults to Basic Info
- **WHEN** the user navigates to `/settings` or `/settings?section=invalid`
- **THEN** the Basic Info panel is displayed
