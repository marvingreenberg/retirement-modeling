## MODIFIED Requirements

### Requirement: Setup form submission
The setup form SHALL validate inputs and initialize the portfolio with entered ages and derived simulation years. No default accounts are created. After successful initialization, the guided tour SHALL be triggered.

#### Scenario: Valid setup submission
- **WHEN** the user enters a valid name and primary age and clicks [Get Started]
- **THEN** the profile store is updated with the entered names, the portfolio is initialized with the entered ages, simulation_years set to (95 - primary_age), the landing page transitions to the normal two-panel layout, and the guided tour is activated

### Requirement: Setup detection
The app SHALL detect when a portfolio is unconfigured and display a setup form instead of the normal landing page. An unconfigured portfolio is one with primary age of 0.

#### Scenario: Loading sample data bypasses setup
- **WHEN** the user clicks "Load Sample Data" during setup
- **THEN** the setup form is replaced by the normal landing page with sample data populated and the guided tour is activated
