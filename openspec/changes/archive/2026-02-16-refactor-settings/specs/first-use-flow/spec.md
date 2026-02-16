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
- **THEN** the portfolio state is populated and the user can click Done to return to Overview

#### Scenario: Loading sample data completes setup
- **WHEN** the user clicks "Load Sample Data" on the settings Basic Info panel
- **THEN** sample data is loaded and the app navigates to `/`

### Requirement: Empty default portfolio
The app SHALL start with an empty portfolio state: primary age 0, spouse age 0, no accounts, zeroed income and spending. Sensible defaults are provided for simulation parameters (inflation, growth rate, tax rates).

#### Scenario: Initial portfolio state
- **WHEN** the app loads with no prior state
- **THEN** the portfolio store contains age 0, no accounts, $0 spending, and zeroed SS benefits

## REMOVED Requirements

### Requirement: Setup form inputs
(Replaced by settings page Basic Info panel)

### Requirement: Setup form submission
(Replaced by settings page Get Started button and Done navigation)
