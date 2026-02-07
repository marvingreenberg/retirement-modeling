## MODIFIED Requirements

### Requirement: Monte Carlo UI Integration
The Monte Carlo simulation SHALL be accessible as a run mode within the Simulate tab rather than a separate tab.

#### Scenario: Run mode selection replaces separate tab
- **WHEN** user wants to run Monte Carlo
- **THEN** they select the "Monte Carlo" radio option on the Simulate tab
- **AND** enter desired iteration count (default 1000)
- **AND** click the single "Simulate" button
- **AND** no separate Monte Carlo tab exists

#### Scenario: Monte Carlo ignores configured growth rate
- **WHEN** Monte Carlo mode is selected
- **THEN** the configured `investment_growth_rate` is not used for simulation
- **AND** returns are sampled from historical market data instead
- **AND** the growth rate input on the Simulate tab shows a visual indicator that it is overridden in MC mode

#### Scenario: Monte Carlo results display in Simulate tab
- **WHEN** Monte Carlo simulation completes
- **THEN** results are displayed in the Simulate tab results area (not a separate tab)
- **AND** results include: success rate, final balance percentiles, fan chart, depletion analysis
