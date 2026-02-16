## MODIFIED Requirements

### Requirement: Monte Carlo UI Integration

The Monte Carlo simulation SHALL always run alongside the single simulation, not as a separate mode selection.

#### Scenario: Always-run behavior
- **WHEN** user clicks Simulate
- **THEN** Monte Carlo runs concurrently with the single simulation
- **AND** results appear on the Monte Carlo tab when ready

#### Scenario: MC iteration count location
- **WHEN** the user wants to configure Monte Carlo iterations
- **THEN** the setting is in the ProfileDrawer Tax & Advanced section (not inline with a radio button)
- **AND** a `numSimulations` store provides the value (default 1000)

#### Scenario: Growth rate override indicator removed
- **WHEN** the simulation settings panel is displayed
- **THEN** the Growth % input does NOT show an "(overridden)" indicator or reduced opacity
- **AND** the tooltip mentions that Monte Carlo uses historically-sampled returns instead

#### Scenario: Monte Carlo results display
- **WHEN** Monte Carlo simulation completes
- **THEN** results are displayed on the "Monte Carlo" tab (not conditionally based on run mode)
- **AND** results include: warning text, success rate, final balance percentiles, fan chart, depletion analysis
