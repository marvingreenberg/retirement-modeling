## MODIFIED Requirements

### Requirement: Run mode selection → Always-run-both with tabbed results

The simulation settings panel SHALL NOT provide a choice between single run and Monte Carlo modes. Clicking Simulate SHALL always run both simulations concurrently.

#### Scenario: No run mode radio buttons
- **WHEN** the user views the simulation settings panel
- **THEN** there are no radio buttons for "Single run" or "Monte Carlo"
- **AND** there is no inline Monte Carlo iteration count input

#### Scenario: Simulate triggers both runs
- **WHEN** the user clicks Simulate
- **THEN** both a single deterministic simulation and a Monte Carlo simulation are fired concurrently
- **AND** the single run result displays immediately when it resolves
- **AND** the Monte Carlo result displays when it resolves (may be later)

#### Scenario: MC iteration count in ProfileDrawer
- **WHEN** the user wants to change the number of Monte Carlo iterations
- **THEN** the setting is available in the ProfileDrawer's Tax & Advanced section
- **AND** the default is 1000 iterations

### Requirement: Results display adapts to run mode → Tabbed results display

The results area SHALL display both single run and Monte Carlo results in a tabbed interface.

#### Scenario: Tab bar with two tabs
- **WHEN** simulation results exist
- **THEN** a tab bar with "Simulation" and "Monte Carlo" tabs is displayed
- **AND** the "Simulation" tab is active by default

#### Scenario: Single run results on Simulation tab
- **WHEN** a single run simulation completes
- **THEN** the Simulation tab shows: summary metrics (final balance, total taxes, IRMAA, Roth conversions, years), balance chart
- **AND** an "Add to Comparison" button appears

#### Scenario: Monte Carlo results on Monte Carlo tab
- **WHEN** a Monte Carlo simulation completes
- **THEN** the Monte Carlo tab shows: warning text about historically-sampled returns, success rate (color-coded), final balance percentiles, fan chart, depletion analysis
- **AND** an "Add to Comparison (median)" button appears

#### Scenario: MC tab loading state
- **WHEN** the Monte Carlo simulation has not yet completed
- **THEN** the Monte Carlo tab shows a spinner with "Running Monte Carlo simulation..."
- **AND** a small spinner also appears inline on the Monte Carlo tab button

#### Scenario: Simulation tab loading state
- **WHEN** the single simulation has not yet completed
- **THEN** the Simulation tab shows a spinner with "Running simulation..."

#### Scenario: MC warning text
- **WHEN** Monte Carlo results are displayed
- **THEN** a small warning note is shown: "Monte Carlo uses historically-sampled returns and inflation, not the configured values above."

### Requirement: Details page tabbed view

The details page SHALL also use a tabbed interface matching the main results view.

#### Scenario: Details page tabs
- **WHEN** simulation results exist and user navigates to /details
- **THEN** a tab bar with "Simulation" and "Monte Carlo" tabs is displayed
- **AND** the Simulation tab shows the year-by-year detail table
- **AND** the Monte Carlo tab shows the yearly percentile table
