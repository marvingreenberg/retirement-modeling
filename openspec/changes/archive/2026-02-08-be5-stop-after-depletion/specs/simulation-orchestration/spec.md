## ADDED Requirements

### Requirement: Early Termination on Fund Exhaustion

The system SHALL stop the simulation loop after all account balances reach zero.

#### Scenario: Portfolio depletes mid-simulation
- **WHEN** total balance across all accounts is <= 0 after applying year-end growth
- **THEN** the system SHALL record the current year's results
- **AND** terminate the simulation loop (no further years processed)

#### Scenario: Portfolio never depletes
- **WHEN** total balance remains > 0 for all simulation years
- **THEN** the simulation SHALL run for the full `simulation_years` duration (no change)

#### Scenario: Result array length
- **WHEN** depletion occurs at year N of a simulation configured for M years
- **THEN** the results array SHALL contain N entries (fewer than M)
