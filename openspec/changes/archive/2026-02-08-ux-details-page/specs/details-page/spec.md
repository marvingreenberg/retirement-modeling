## ADDED Requirements

### Requirement: Shared simulation results store
The application SHALL maintain a shared store for simulation results accessible from any page. The store SHALL hold the last single-run result, last Monte Carlo result, and the mode of the last run.

#### Scenario: Results written after simulation
- **WHEN** a simulation completes on the simulate tab
- **THEN** the results are written to the shared store
- **AND** they are available on the `/details` page without re-running

#### Scenario: Results cleared on new run
- **WHEN** the user starts a new simulation
- **THEN** previous results in the store are cleared before the API call

### Requirement: Details page year-by-year table
The `/details` page SHALL display a year-by-year detail table when single-run results exist. The table SHALL include columns: Year, Age, AGI, Bracket, RMD, Spending, Pre-tax WD, Roth WD, Brokerage WD, Roth Conv, Total Tax, IRMAA, Total Balance.

#### Scenario: Single run results displayed
- **WHEN** the user navigates to `/details` after a single-run simulation
- **THEN** the year-by-year table is displayed with all rows from the simulation result

#### Scenario: Table scrolls horizontally on small screens
- **WHEN** the table is wider than the viewport
- **THEN** the table scrolls horizontally within its container

### Requirement: Details page Monte Carlo view
The `/details` page SHALL display yearly percentile data in tabular form when Monte Carlo results exist.

#### Scenario: Monte Carlo results displayed
- **WHEN** the user navigates to `/details` after a Monte Carlo simulation
- **THEN** a table shows Age, 5th, 25th, Median, 75th, and 95th percentile balances per year

### Requirement: Details page empty state
The `/details` page SHALL display a prompt when no simulation results exist.

#### Scenario: No results yet
- **WHEN** the user navigates to `/details` before running any simulation
- **THEN** a message is displayed: "Run a simulation to see detailed results"
