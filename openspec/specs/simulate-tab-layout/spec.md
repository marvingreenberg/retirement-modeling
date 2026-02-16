## Purpose
Defines the simulation settings panel layout, including primary assumptions, withdrawal strategy, run-both behavior with tabbed results, and collapsible summary behavior.
## Requirements
### Requirement: Simulation settings panel
The simulation settings panel SHALL provide input controls for simulation assumption parameters. Primary assumptions (Inflation Rate, Investment Growth Rate, Conversion Strategy) SHALL be on one compact row. The panel SHALL NOT contain an Advanced subsection — those settings are in the ProfileDrawer.

#### Scenario: No Advanced section in SimulateSettings
- **WHEN** the user views the simulation settings panel
- **THEN** there is no "Advanced" toggle or collapsible section
- **AND** Inflation %, Growth %, and Conversion are visible on one row

#### Scenario: Withdrawal Strategy remains
- **WHEN** the user views the simulation settings panel
- **THEN** the Withdrawal Strategy collapsible subsection is still present below the primary row

### Requirement: Collapsible withdrawal strategy section
The Withdrawal Strategy controls SHALL be in a collapsible subsection below the primary assumptions. The section SHALL show a succinct summary when collapsed and default to collapsed.

#### Scenario: Strategy collapsed with summary
- **WHEN** the strategy section is collapsed
- **THEN** a summary line is visible (e.g., "Withdrawal Strategy — Fixed $140K", "Withdrawal Strategy — 4.0% of Portfolio", "Withdrawal Strategy — Guardrails 4.5%, (80/120)")

#### Scenario: Strategy expanded with inline params
- **WHEN** the user expands the strategy section
- **THEN** the strategy dropdown and conditional parameters appear
- **AND** percent_of_portfolio shows dropdown + withdrawal rate on the same row
- **AND** guardrails shows dropdown + init rate on row 1, floor/ceiling/adjust on row 2
- **AND** fixed_dollar and rmd_based show only the dropdown

#### Scenario: Collapsed panel summary includes strategy
- **WHEN** the entire settings panel is collapsed after a simulation run
- **THEN** the summary text includes withdrawal strategy shorthand (e.g., "3.0% infl, 7.0% growth, IRMAA Tier 1, Fixed $120K")

#### Scenario: Spending strategy not on budget page
- **WHEN** the user views the budget page
- **THEN** the spending strategy dropdown and its conditional parameters are NOT present

### Requirement: Percentage input display
All percentage inputs in the simulation settings panel SHALL display values as human-readable percentages (e.g., 3.0 for 3%) rather than raw decimals (0.03). Values SHALL be converted to/from decimals for storage.

#### Scenario: Inflation rate display
- **WHEN** the inflation rate is 0.03 in the store
- **THEN** the input displays 3.0

#### Scenario: User edits percentage
- **WHEN** the user types 3.5 in the inflation rate input
- **THEN** the store value is set to 0.035

#### Scenario: All percentage inputs converted
- **WHEN** the settings panel is displayed
- **THEN** Inflation %, Growth %, State Tax %, Cap Gains %, Withdrawal Rate, and all guardrails percentage inputs display as human-readable percentages

---

### Requirement: Always-run-both with tabbed results
Clicking Simulate SHALL always run both a single deterministic simulation and a Monte Carlo simulation concurrently. Results are displayed in a tabbed interface.

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

---

### Requirement: Compact settings grid layout
The settings panel SHALL use a compact multi-column grid to minimize vertical space.

#### Scenario: Settings rendered in grid
- **WHEN** the settings panel is expanded
- **THEN** assumption inputs are arranged in 2-3 rows using horizontal grouping
- **AND** the Simulate button appears on its own row
- **AND** total settings height is approximately 3-4 rows of content

---

### Requirement: Collapsible settings with summary
The settings panel SHALL auto-collapse to a summary line after a simulation run, and expand on click.

#### Scenario: Auto-collapse after run
- **WHEN** a simulation completes (single or Monte Carlo)
- **THEN** the settings panel collapses to a single summary line
- **AND** the summary line displays key assumptions including withdrawal strategy shorthand (e.g., "3.0% infl, 7.0% growth, IRMAA Tier 1, Fixed/$120K")
- **AND** the Simulate button remains visible next to the summary

#### Scenario: Expand collapsed settings
- **WHEN** the user clicks the collapsed summary line (or its expand indicator)
- **THEN** the full settings grid re-expands
- **AND** all previously entered values are preserved

#### Scenario: Settings expanded initially
- **WHEN** no simulation has been run yet
- **THEN** the settings panel is expanded showing the full grid

---

### Requirement: Single Simulate button
The settings panel SHALL have a single "Simulate" button that triggers both simulation runs.

#### Scenario: Button text
- **WHEN** the landing page is displayed
- **THEN** a single button labeled "Simulate" is shown
- **AND** during execution, the label changes to "Running..."
- **AND** the button is disabled during execution

---

### Requirement: Effective spending in results summary
The simulation results summary SHALL display the effective initial spending amount in both monthly and annual formats, using data from the API response.

#### Scenario: Single run spending display
- **WHEN** a single run simulation completes
- **THEN** the results summary includes a spending line showing monthly and annual amounts (e.g., "$10,000/mo ($120,000/yr)")

#### Scenario: No spending display for Monte Carlo
- **WHEN** a Monte Carlo simulation completes
- **THEN** the results summary does NOT display initial spending (the MC API response does not include spending fields)

---

### Requirement: Details page tabbed view
The details page SHALL use a tabbed interface matching the main results view.

#### Scenario: Details page tabs
- **WHEN** simulation results exist and user navigates to /details
- **THEN** a tab bar with "Simulation" and "Monte Carlo" tabs is displayed
- **AND** the Simulation tab shows the year-by-year detail table
- **AND** the Monte Carlo tab shows the yearly percentile table
