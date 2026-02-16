## Purpose
Defines the simulation settings panel layout, including primary assumptions, withdrawal strategy, advanced world parameters, run mode controls, and collapsible summary behavior.
## Requirements
### Requirement: Simulation settings panel
The simulation settings panel SHALL provide input controls for simulation assumption parameters. Primary assumptions (Inflation Rate, Investment Growth Rate, Conversion Strategy) SHALL be always visible. Withdrawal Strategy and Advanced settings SHALL each be independently collapsible subsections with summary text when collapsed.

#### Scenario: Primary inputs visible
- **WHEN** the user views the simulation settings panel
- **THEN** Inflation Rate, Investment Growth Rate, and Conversion Strategy inputs are visible

### Requirement: Collapsible withdrawal strategy section
The Withdrawal Strategy controls SHALL be in a collapsible subsection between the primary assumptions and the Advanced section. The section SHALL show a succinct summary when collapsed and default to collapsed.

#### Scenario: Strategy collapsed with summary
- **WHEN** the strategy section is collapsed
- **THEN** a summary line is visible (e.g., "Withdrawal Strategy — Fixed $140K", "Withdrawal Strategy — 4.0% of Portfolio", "Withdrawal Strategy — Guardrails 4.5%, (80/120)")

#### Scenario: Strategy expanded with inline params
- **WHEN** the user expands the strategy section
- **THEN** the strategy dropdown and conditional parameters appear
- **AND** percent_of_portfolio shows dropdown + withdrawal rate on the same row
- **AND** guardrails shows dropdown + init rate on row 1, floor/ceiling/adjust on row 2
- **AND** fixed_dollar and rmd_based show only the dropdown

### Requirement: Collapsible advanced section with summary
The Advanced section SHALL show a summary when collapsed indicating whether settings are default or customized.

#### Scenario: Advanced collapsed with defaults
- **WHEN** all advanced settings match default values
- **THEN** the collapsed summary reads "Advanced — defaults"

#### Scenario: Advanced collapsed with custom values
- **WHEN** any advanced setting differs from the default
- **THEN** the collapsed summary reads "Advanced — custom"

#### Scenario: Advanced expanded
- **WHEN** the user clicks the Advanced toggle
- **THEN** State Tax %, Cap Gains %, RMD Age, and IRMAA Limit inputs appear

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

### Requirement: Effective spending in results summary
The simulation results summary SHALL display the effective initial spending amount in both monthly and annual formats, using data from the API response.

#### Scenario: Single run spending display
- **WHEN** a single run simulation completes
- **THEN** the results summary includes a spending line showing monthly and annual amounts (e.g., "$10,000/mo ($120,000/yr)")

#### Scenario: No spending display for Monte Carlo
- **WHEN** a Monte Carlo simulation completes
- **THEN** the results summary does NOT display initial spending (the MC API response does not include spending fields)

