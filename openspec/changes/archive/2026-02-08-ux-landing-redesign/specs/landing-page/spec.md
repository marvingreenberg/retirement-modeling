## ADDED Requirements

### Requirement: Portfolio summary in welcome state
The welcome state SHALL display a summary of the current portfolio: total account balance, annual spending, and estimated coverage years (balance / spending). The summary only appears when at least one account exists.

#### Scenario: Summary with configured portfolio
- **WHEN** the user has accounts and spending configured but has not run a simulation
- **THEN** the welcome state shows total balance, annual spending, and estimated years

#### Scenario: Summary with zero spending
- **WHEN** the user has accounts but $0 annual spending
- **THEN** the welcome state shows total balance and "$0" for spending, without a coverage estimate

### Requirement: Validation warning banner
The landing page SHALL display a warning banner above the results area when the portfolio has common configuration issues.

#### Scenario: No spending configured
- **WHEN** the portfolio has annual_spend_net of 0
- **THEN** a warning reads "Annual spending is $0 — configure spending on the Spending page"

#### Scenario: No warnings when portfolio is complete
- **WHEN** the portfolio has spending > 0 and at least one account
- **THEN** no warning banner is displayed

### Requirement: Results navigation hint
After simulation results appear, a link SHALL guide users to the Details page for the full year-by-year breakdown.

#### Scenario: View Details link after single run
- **WHEN** single-run results are displayed
- **THEN** a "View year-by-year details" link appears pointing to /details

#### Scenario: View Details link after Monte Carlo
- **WHEN** Monte Carlo results are displayed
- **THEN** a "View yearly percentiles" link appears pointing to /details

### Requirement: Loading indicator
The loading state SHALL display an animated spinner while a simulation is in progress.

#### Scenario: Loading state
- **WHEN** a simulation is running
- **THEN** an animated spinner is displayed with "Running simulation..." text
