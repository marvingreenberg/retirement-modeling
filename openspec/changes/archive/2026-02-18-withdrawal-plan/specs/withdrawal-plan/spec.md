## ADDED Requirements

### Requirement: Withdrawal plan display
The Details page SHALL show a "Withdrawal Plan" section displaying per-account withdrawal details for the first two simulation years.

#### Scenario: Two-year withdrawal plan displayed
- **WHEN** a single-run simulation result is available
- **THEN** the Details page shows a "Withdrawal Plan" section above the year-by-year table
- **AND** Year 1 and Year 2 are displayed as separate cards

#### Scenario: Year card contents
- **WHEN** a year card is displayed
- **THEN** it SHALL show:
  - Year and age
  - Spending target
  - Income sources (SS, income streams) with amounts
  - Withdrawals grouped by purpose (RMD, Spending) with per-account detail
  - Roth conversion amount and source (if any)
  - Estimated taxes: ordinary income tax, capital gains tax, IRMAA cost
  - Total outflow

#### Scenario: No simulation results
- **WHEN** no simulation has been run yet
- **THEN** the Withdrawal Plan section is not displayed

#### Scenario: Single year remaining
- **WHEN** the simulation has only 1 year of results
- **THEN** only one year card is displayed
