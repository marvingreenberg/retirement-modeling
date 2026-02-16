## Purpose
Displays year-by-year simulation detail tables for single runs and Monte Carlo percentile data.
## Requirements
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
The details page SHALL display a year-by-year table with columns: Year, Age, AGI, Bracket, RMD, Spending, Pre-tax WD, Roth WD, Brokerage WD, Roth Conv, Total Tax, IRMAA, Total Balance. The table SHALL stop displaying rows after the first year where total_balance reaches zero. The depleted row SHALL be styled with error-colored text. A depletion message SHALL appear below the table indicating the age at which depletion occurred.

#### Scenario: Portfolio depletes at age 85
- **WHEN** simulation results show total_balance <= 0 at age 85
- **THEN** the table shows rows up to and including age 85
- **AND** the depleted row is styled with error text color
- **AND** a message below the table reads "Portfolio depleted at age 85 — remaining years omitted"

#### Scenario: Portfolio never depletes
- **WHEN** simulation results never show total_balance <= 0
- **THEN** all rows are displayed normally with no depletion message

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

