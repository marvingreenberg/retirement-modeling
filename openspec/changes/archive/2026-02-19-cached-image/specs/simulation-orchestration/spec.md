## ADDED Requirements

### Requirement: Clear cached results on portfolio change
The UI SHALL clear all cached simulation results when the portfolio store value changes, returning to the "Ready to simulate" state.

#### Scenario: User modifies an account balance
- **WHEN** the user changes any account balance while simulation results are displayed
- **THEN** the simulation results (charts, summary) SHALL be cleared
- **AND** the WelcomeState ("Ready to simulate") SHALL be displayed

#### Scenario: User loads a portfolio file
- **WHEN** the user loads a portfolio JSON file via Load/Save
- **THEN** any previously displayed simulation results SHALL be cleared

#### Scenario: User loads sample data
- **WHEN** the user loads a sample scenario
- **THEN** any previously displayed simulation results SHALL be cleared

#### Scenario: Running a simulation does not trigger clear
- **WHEN** the simulation itself completes and sets results
- **THEN** the clear logic SHALL NOT remove the results that were just computed

#### Scenario: Comparison snapshots also cleared
- **WHEN** portfolio inputs change
- **THEN** the comparison snapshots store SHALL also be cleared
