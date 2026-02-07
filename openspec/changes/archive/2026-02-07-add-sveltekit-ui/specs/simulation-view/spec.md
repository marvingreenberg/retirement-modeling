## ADDED Requirements

### Requirement: Run simulation
The Simulate view SHALL provide a "Run Simulation" button that sends the current portfolio to the `/simulate` endpoint and displays results.

#### Scenario: Successful simulation
- **WHEN** the user clicks "Run Simulation" with a valid portfolio
- **THEN** the API is called with the portfolio data and results are displayed

#### Scenario: Loading state
- **WHEN** the simulation is in progress
- **THEN** the button shows a loading indicator and is disabled

#### Scenario: API error displayed
- **WHEN** the API returns a 400 error
- **THEN** the error message from the API is displayed to the user

### Requirement: Balance chart
The Simulate view SHALL display a line chart showing account balances over time, with separate lines for pretax, roth, brokerage, and total balance, plotted by age.

#### Scenario: Chart renders with simulation data
- **WHEN** simulation results are available
- **THEN** a line chart displays with age on the x-axis and dollar amounts on the y-axis, with a line per account type and total

### Requirement: Summary statistics
The Simulate view SHALL display summary statistics: final total balance, total taxes paid, total IRMAA paid, total Roth conversions, simulation years, and strategies used.

#### Scenario: Summary displayed
- **WHEN** simulation results are available
- **THEN** summary statistics are displayed in a formatted panel above or beside the chart

### Requirement: Year-by-year detail table
The Simulate view SHALL display a table with one row per simulation year showing: year, ages, AGI, tax bracket, RMD, spending target, withdrawals by account type, Roth conversion, taxes, IRMAA, and balances by account type.

#### Scenario: Table renders with data
- **WHEN** simulation results are available
- **THEN** a scrollable table displays all year-by-year data

#### Scenario: Table is collapsible
- **WHEN** the user clicks to expand the detail table
- **THEN** the full year-by-year table is shown (collapsed by default to avoid overwhelming the view)
