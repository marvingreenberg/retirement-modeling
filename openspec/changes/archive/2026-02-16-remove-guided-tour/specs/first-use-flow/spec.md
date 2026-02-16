## MODIFIED Requirements

### Requirement: Setup form submission
The setup form SHALL validate inputs and initialize the portfolio with entered ages and derived simulation years. No default accounts are created.

#### Scenario: Valid setup submission
- **WHEN** the user enters a valid name and primary age and clicks [Get Started]
- **THEN** the profile store is updated with the entered names, the portfolio is initialized with the entered ages, simulation_years set to (95 - primary_age), and the landing page transitions to the normal two-panel layout

#### Scenario: Invalid age rejected
- **WHEN** the user enters an age below 20 or above 120 and clicks [Get Started]
- **THEN** the form displays a validation error and does not transition

### Requirement: Setup detection
The app SHALL detect when a portfolio is unconfigured and display a setup form instead of the normal landing page. An unconfigured portfolio is one with primary age of 0.

#### Scenario: First visit shows setup
- **WHEN** the user opens the app for the first time (empty portfolio state)
- **THEN** the landing page displays a centered setup form instead of the two-panel layout

#### Scenario: Configured portfolio skips setup
- **WHEN** the user opens the app and the portfolio has a non-zero primary age
- **THEN** the normal two-panel landing page is displayed

#### Scenario: Loading a file bypasses setup
- **WHEN** the user loads a portfolio JSON file during setup
- **THEN** the setup form is replaced by the normal landing page with the loaded portfolio

#### Scenario: Loading sample data bypasses setup
- **WHEN** the user clicks "Load Sample Data" during setup
- **THEN** the setup form is replaced by the normal landing page with sample data populated
