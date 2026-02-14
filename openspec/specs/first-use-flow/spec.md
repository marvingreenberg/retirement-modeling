## Requirements

### Requirement: Setup detection
The app SHALL detect when a portfolio is unconfigured and display a setup form instead of the normal landing page. An unconfigured portfolio is one with no accounts and primary age of 0.

#### Scenario: First visit shows setup
- **WHEN** the user opens the app for the first time (empty portfolio state)
- **THEN** the landing page displays a centered setup form instead of the two-panel layout

#### Scenario: Configured portfolio skips setup
- **WHEN** the user opens the app and the portfolio has at least one account and a non-zero primary age
- **THEN** the normal two-panel landing page is displayed

#### Scenario: Loading a file bypasses setup
- **WHEN** the user loads a portfolio JSON file during setup
- **THEN** the setup form is replaced by the normal landing page with the loaded portfolio

#### Scenario: Loading sample data bypasses setup
- **WHEN** the user clicks "Load Sample Data" during setup
- **THEN** the setup form is replaced by the normal landing page with sample data populated

### Requirement: Setup form inputs
The setup form SHALL collect the minimum information needed to begin: primary person's name and age, and an optional spouse with name and age.

#### Scenario: Setup form fields
- **WHEN** the setup form is displayed
- **THEN** the form shows a primary name input, primary age input, a spouse toggle, and a [Get Started] button
- **AND** a [Load Sample Data] button is available as an alternative

#### Scenario: Spouse toggle reveals spouse fields
- **WHEN** the user enables the spouse toggle
- **THEN** spouse name and spouse age inputs appear

#### Scenario: Spouse toggle hides spouse fields
- **WHEN** the user disables the spouse toggle
- **THEN** the spouse name and age inputs are hidden and spouse values are cleared

### Requirement: Setup form submission
The setup form SHALL validate inputs and initialize the portfolio with entered ages, derived simulation years, and one empty starter account.

#### Scenario: Valid setup submission
- **WHEN** the user enters a valid name and primary age and clicks [Get Started]
- **THEN** the profile store is updated with the entered names, the portfolio is initialized with the entered ages, simulation_years set to (95 - primary_age), one empty brokerage account, and the landing page transitions to the normal two-panel layout

#### Scenario: Invalid age rejected
- **WHEN** the user enters an age below 20 or above 120 and clicks [Get Started]
- **THEN** the form displays a validation error and does not transition

### Requirement: Empty default portfolio
The app SHALL start with an empty portfolio state: primary age 0, spouse age 0, no accounts, zeroed income and spending. Sensible defaults are provided for simulation parameters (inflation, growth rate, tax rates).

#### Scenario: Initial portfolio state
- **WHEN** the app loads with no prior state
- **THEN** the portfolio store contains age 0, no accounts, $0 spending, and zeroed SS benefits
