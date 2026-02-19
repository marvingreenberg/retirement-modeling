## MODIFIED Requirements

### Requirement: Setup detection
The app SHALL detect when a portfolio is unconfigured and redirect to the settings page. An unconfigured portfolio is one with primary age of 0. The redirect navigates to `/settings` with the Basic Info panel active.

#### Scenario: First visit redirects to settings
- **WHEN** the user opens the app for the first time (empty portfolio state)
- **THEN** the app redirects to `/settings` showing the Basic Info panel

#### Scenario: Configured portfolio skips redirect
- **WHEN** the user opens the app and the portfolio has a non-zero primary age
- **THEN** the normal Overview page is displayed

#### Scenario: Loading a file on settings page completes setup
- **WHEN** the user loads a portfolio JSON file via the Load/Save panel in settings
- **THEN** the portfolio state is populated and the user can navigate to Overview

#### Scenario: Loading sample data completes setup
- **WHEN** the user selects a sample scenario from the Load/Save panel
- **THEN** sample data is loaded and the app navigates to `/`

#### Scenario: Welcome banner references Load/Save
- **WHEN** the first-use banner is shown on Basic Info
- **THEN** the text SHALL read "Enter your info to get started, or use Load / Save to load previously saved data or sample data."
