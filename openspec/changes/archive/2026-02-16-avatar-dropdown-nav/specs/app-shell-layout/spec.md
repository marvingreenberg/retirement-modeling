## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Avatar on settings page does nothing
(Avatar dropdown now works on all routes including /settings)

## MODIFIED Requirements

### Requirement: Dark mode toggle location
The dark/light mode toggle SHALL be accessible from the avatar dropdown on every page and from the settings page left-nav footer.

#### Scenario: Toggle in dropdown
- **WHEN** the user opens the avatar dropdown
- **THEN** a dark/light mode toggle checkbox is visible below the section links
