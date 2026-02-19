## Purpose
Dedicated settings page with left-nav layout for managing profile, load/save, and advanced configuration.
## Requirements
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

### Requirement: Basic Info panel
The Basic Info panel SHALL contain: Your Name (text), Your Age (number 20-120), spouse toggle with Spouse Name and Spouse Age, Simulation Years, and Start Year. When needs setup (age is 0), a context banner and [Get Started] button are shown.

#### Scenario: Basic Info fields
- **WHEN** the Basic Info panel is active
- **THEN** name, age, spouse toggle, simulation years, and start year inputs are visible

#### Scenario: First-use context banner
- **WHEN** the user has not yet entered basic info (age is 0)
- **THEN** a banner reads "Enter your info to get started, or use Load / Save to load previously saved data or sample data."
- **AND** a [Get Started] button is visible

#### Scenario: Get Started completes setup
- **WHEN** the user enters valid name and age and clicks [Get Started]
- **THEN** the profile and portfolio stores are updated and the app navigates to `/`

#### Scenario: No sample data in Basic Info
- **WHEN** the Basic Info panel is displayed
- **THEN** there SHALL be no sample data dropdown (moved to Load/Save)

### Requirement: Load/Save panel
The Load/Save panel SHALL contain: Load Portfolio (file picker for JSON), Load Sample Data (scenario dropdown), and Save Portfolio (downloads JSON with portfolio + profile). The sample data dropdown SHALL appear between Load and Save, with a label "Load Sample Data".

#### Scenario: Save portfolio
- **WHEN** the user clicks Save Portfolio
- **THEN** a JSON file downloads containing the full portfolio and profile state

#### Scenario: Load portfolio
- **WHEN** the user selects a valid JSON file via Load Portfolio
- **THEN** the portfolio and profile stores are populated from the file

#### Scenario: Load sample data from Load/Save
- **WHEN** the user selects a scenario from the sample data dropdown in Load/Save
- **THEN** sample data is loaded and the app navigates to `/`

### Requirement: Advanced Settings panel
The Advanced Settings panel SHALL contain: State Tax %, Capital Gains %, RMD Age, IRMAA Limit, and MC Iterations inputs.

#### Scenario: Advanced settings fields
- **WHEN** the Advanced Settings panel is active
- **THEN** State Tax %, Cap Gains %, RMD Age, IRMAA Limit, and MC Iterations inputs are visible

### Requirement: Done button
The settings page footer SHALL display a navigation link styled as `<= Overview` (with LayoutDashboard icon) that navigates to `/`, replacing the previous filled "Done" button.

#### Scenario: Overview link navigates home
- **WHEN** the user clicks the Overview link in the settings footer
- **THEN** the app navigates to `/`

### Requirement: Enter key triggers validation
Pressing Enter on any input within the settings page SHALL trigger validation and store updates, equivalent to a focusout event.

#### Scenario: Enter key on age input
- **WHEN** the user types an age and presses Enter
- **THEN** validation runs and any errors are displayed
