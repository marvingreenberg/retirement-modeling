## MODIFIED Requirements

### Requirement: Monte Carlo UI Integration
The Monte Carlo simulation SHALL always run the full simulation (with taxes, RMDs, conversions) when triggered from the API.

#### Scenario: Always-run behavior
- **WHEN** user clicks Simulate
- **THEN** Monte Carlo runs concurrently with the single simulation
- **AND** results appear on the Monte Carlo tab when ready

#### Scenario: API uses full Monte Carlo
- **WHEN** the `/api/v1/monte-carlo` endpoint is called
- **THEN** it SHALL use `run_full_monte_carlo` (complete simulation with taxes, RMDs, conversions)
- **AND** it SHALL NOT use the simplified `run_monte_carlo` / `run_single_simulation`

#### Scenario: MC iteration count location
- **WHEN** the user wants to configure Monte Carlo iterations
- **THEN** the setting is in the ProfileDrawer Tax & Advanced section
- **AND** a `numSimulations` store provides the value (default 1000)

#### Scenario: Growth rate and Monte Carlo
- **WHEN** the simulation settings panel is displayed
- **THEN** the Growth % input does not show an override indicator
- **AND** the tooltip mentions that Monte Carlo uses historically-sampled returns instead

#### Scenario: Monte Carlo results display
- **WHEN** Monte Carlo simulation completes
- **THEN** results are displayed on the "Monte Carlo" tab
- **AND** results include: warning text, success rate, final balance percentiles, fan chart, depletion analysis
