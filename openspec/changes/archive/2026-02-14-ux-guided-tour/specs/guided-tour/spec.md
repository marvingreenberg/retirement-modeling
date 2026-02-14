## ADDED Requirements

### Requirement: Tour trigger
The guided tour SHALL start automatically after the user completes first-time setup (via Get Started or Load Sample Data). The tour SHALL run only once per session.

#### Scenario: Tour starts after Get Started
- **WHEN** the user completes the setup form and clicks Get Started
- **THEN** the guided tour begins, highlighting the first nav tab

#### Scenario: Tour starts after Load Sample Data
- **WHEN** the user clicks Load Sample Data on the setup form
- **THEN** the guided tour begins, highlighting the first nav tab

#### Scenario: Tour does not repeat
- **WHEN** the user has already seen the tour in this session
- **THEN** the tour does not start again, even if the app re-renders

### Requirement: Tour sequence
The guided tour SHALL display tooltip popovers in sequence, one per navigation element. Each tooltip SHALL appear below the target element with an upward-pointing caret. The tooltip SHALL be clamped to viewport edges so it never overflows off-screen.

#### Scenario: Tour step order
- **WHEN** the tour is active
- **THEN** tooltips appear in order: Overview tab, Compare tab, Details tab, then the avatar/profile button

#### Scenario: Tour step content
- **WHEN** the Overview tooltip is shown
- **THEN** it displays "Overview — Control simulations and view results"
- **WHEN** the Compare tooltip is shown
- **THEN** it displays "Compare — Save and compare simulation snapshots"
- **WHEN** the Details tooltip is shown
- **THEN** it displays "Details — View year-by-year simulation breakdown"
- **WHEN** the Profile tooltip is shown
- **THEN** it displays "Profile — Edit names, ages, and preferences"

### Requirement: Tour advancement
Each tour tooltip SHALL auto-advance after approximately 3 seconds, or be dismissed immediately by clicking anywhere.

#### Scenario: Auto-advance
- **WHEN** a tour tooltip has been visible for 3 seconds
- **THEN** it transitions to the next step or ends the tour if on the last step

#### Scenario: Click to advance
- **WHEN** the user clicks anywhere while a tour tooltip is visible
- **THEN** the tooltip advances to the next step immediately

#### Scenario: Tour completion
- **WHEN** the last tooltip has been shown and advances
- **THEN** the tour ends and the `tourActive` store is set to false
