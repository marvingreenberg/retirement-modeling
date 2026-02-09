## Requirements

### Requirement: Simulation settings panel
The simulation settings panel SHALL provide input controls for simulation assumption parameters excluding spending configuration. Primary assumptions (Inflation Rate, Investment Growth Rate, Conversion Strategy) SHALL be visible by default. Advanced settings (State Tax Rate, Capital Gains Rate, RMD Start Age, IRMAA Tier 1 Limit) SHALL be in a collapsible "Advanced" section that defaults to collapsed.

#### Scenario: Primary inputs visible
- **WHEN** the user views the simulation settings panel
- **THEN** Inflation Rate, Investment Growth Rate, and Conversion Strategy inputs are visible

#### Scenario: Advanced section collapsed by default
- **WHEN** the settings panel is first displayed
- **THEN** the advanced settings (State Tax %, Cap Gains %, RMD Age, IRMAA Limit) are hidden
- **AND** an "Advanced" toggle is visible

#### Scenario: Toggle advanced section
- **WHEN** the user clicks the "Advanced" toggle
- **THEN** the advanced settings row expands showing State Tax %, Cap Gains %, RMD Age, IRMAA Limit

#### Scenario: Spending strategy not in settings panel
- **WHEN** the user views the simulation settings panel
- **THEN** the spending strategy dropdown, withdrawal rate, and guardrails parameters are NOT present

---

### Requirement: Run mode selection
The simulation settings panel SHALL provide a choice between single run and Monte Carlo modes.

#### Scenario: Run mode radio buttons
- **WHEN** the user views the simulation settings panel
- **THEN** two radio options are displayed: "Single run" and "Monte Carlo"
- **AND** Monte Carlo option includes an editable iteration count (default 1000)
- **AND** an (i) icon next to Monte Carlo explains what it does

#### Scenario: Single run selected
- **WHEN** the user selects "Single run" and clicks Simulate
- **THEN** the system runs a single deterministic simulation using the configured growth rate
- **AND** results display in the right panel as summary metrics and balance chart

#### Scenario: Monte Carlo selected
- **WHEN** the user selects "Monte Carlo" and clicks Simulate
- **THEN** the system runs N iterations with historically-sampled returns
- **AND** results display in the right panel as success rate, percentile bands, fan chart, and depletion analysis

---

### Requirement: Compact settings grid layout
The settings panel SHALL use a compact multi-column grid to minimize vertical space.

#### Scenario: Settings rendered in grid
- **WHEN** the settings panel is expanded
- **THEN** assumption inputs are arranged in 2-3 rows using horizontal grouping
- **AND** the Simulate button appears on the same row as the run mode selection
- **AND** total settings height is approximately 3-4 rows of content

---

### Requirement: Collapsible settings with summary
The settings panel SHALL auto-collapse to a summary line after a simulation run, and expand on click.

#### Scenario: Auto-collapse after run
- **WHEN** a simulation completes (single or Monte Carlo)
- **THEN** the settings panel collapses to a single summary line
- **AND** the summary line displays key assumptions (e.g., "3.0% infl, 7.0% growth, IRMAA Tier 1")
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
The settings panel SHALL have a single "Simulate" button that runs the currently selected mode.

#### Scenario: Button text
- **WHEN** the landing page is displayed
- **THEN** a single button labeled "Simulate" is shown
- **AND** during execution, the label changes to "Running..."
- **AND** the button is disabled during execution

---

### Requirement: Results display adapts to run mode
The results area in the right panel SHALL display appropriate content based on whether a single run or Monte Carlo was executed.

#### Scenario: Single run results
- **WHEN** a single run simulation completes
- **THEN** results show: summary metrics (final balance, total taxes, IRMAA, Roth conversions, years, strategy), balance chart
- **AND** an "Add to Comparison" button appears

#### Scenario: Monte Carlo results
- **WHEN** a Monte Carlo simulation completes
- **THEN** results show: success rate (color-coded), final balance percentiles, fan chart, depletion analysis
- **AND** an "Add to Comparison" button appears (captures median values + success rate)
