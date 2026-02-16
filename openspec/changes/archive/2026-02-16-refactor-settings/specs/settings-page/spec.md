## ADDED Requirements

### Requirement: Settings route with left-nav layout
The app SHALL provide a `/settings` route displaying a left-nav + content panel layout. The left nav lists section links: Basic Info, Load/Save, Advanced Settings. Clicking a section highlights it and displays its content panel. The page header shows the user's generated avatar and name(s).

#### Scenario: Settings page renders
- **WHEN** the user navigates to `/settings`
- **THEN** a left nav with three section links is displayed alongside a content panel showing the active section

#### Scenario: Section navigation
- **WHEN** the user clicks "Advanced Settings" in the left nav
- **THEN** the Advanced Settings panel is displayed and the nav item is highlighted

### Requirement: Basic Info panel
The Basic Info panel SHALL contain: Your Name (text), Your Age (number 20-120), spouse toggle with Spouse Name and Spouse Age, Simulation Years, and Start Year. When needs setup (age is 0), a context banner and [Get Started] button are shown. A [Load Sample Data] button is always available.

#### Scenario: Basic Info fields
- **WHEN** the Basic Info panel is active
- **THEN** name, age, spouse toggle, simulation years, and start year inputs are visible

#### Scenario: First-use context banner
- **WHEN** the user has not yet entered basic info (age is 0)
- **THEN** a banner reads "Enter your info to get started, or use Load/Save to load saved data"
- **AND** a [Get Started] button is visible

#### Scenario: Get Started completes setup
- **WHEN** the user enters valid name and age and clicks [Get Started]
- **THEN** the profile and portfolio stores are updated and the app navigates to `/`

#### Scenario: Load Sample Data
- **WHEN** the user clicks [Load Sample Data]
- **THEN** sample profile and portfolio data are loaded and the app navigates to `/`

### Requirement: Load/Save panel
The Load/Save panel SHALL contain: Load Portfolio (file picker for JSON), Save Portfolio (downloads JSON with portfolio + profile), and an Auto-save toggle. When auto-save is enabled, state persists to localStorage on changes.

#### Scenario: Save portfolio
- **WHEN** the user clicks Save Portfolio
- **THEN** a JSON file downloads containing the full portfolio and profile state

#### Scenario: Load portfolio
- **WHEN** the user selects a valid JSON file via Load Portfolio
- **THEN** the portfolio and profile stores are populated from the file

#### Scenario: Auto-save toggle
- **WHEN** the user enables auto-save
- **THEN** portfolio and profile state are written to localStorage on every change

#### Scenario: Auto-save restore on load
- **WHEN** the app starts and auto-save data exists in localStorage
- **THEN** the saved state is restored automatically

### Requirement: Advanced Settings panel
The Advanced Settings panel SHALL contain: State Tax %, Capital Gains %, RMD Age, IRMAA Limit, and MC Iterations inputs.

#### Scenario: Advanced settings fields
- **WHEN** the Advanced Settings panel is active
- **THEN** State Tax %, Cap Gains %, RMD Age, IRMAA Limit, and MC Iterations inputs are visible

### Requirement: Done button
The settings page SHALL display a [Done] button that navigates back to the Overview page (`/`).

#### Scenario: Done navigates home
- **WHEN** the user clicks [Done]
- **THEN** the app navigates to `/`

### Requirement: Dark mode toggle in settings
The settings page SHALL include a dark/light mode toggle in the left nav footer area.

#### Scenario: Dark mode toggle
- **WHEN** the user clicks the dark mode toggle on the settings page
- **THEN** the app theme switches between dark and light mode
- **AND** the preference is persisted to localStorage

### Requirement: Enter key triggers validation
Pressing Enter on any input within the settings page SHALL trigger validation and store updates, equivalent to a focusout event.

#### Scenario: Enter key on age input
- **WHEN** the user types an age and presses Enter
- **THEN** validation runs and any errors are displayed
