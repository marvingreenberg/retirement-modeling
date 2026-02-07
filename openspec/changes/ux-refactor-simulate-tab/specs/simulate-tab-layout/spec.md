## ADDED Requirements

### Requirement: Simulate tab contains simulation assumptions
The Simulate tab SHALL provide input controls for all simulation assumption parameters, organized in a compact grid layout.

#### Scenario: Assumption inputs present on Simulate tab
- **WHEN** user navigates to the Simulate tab
- **THEN** the following inputs are visible in the settings panel:
  - Inflation Rate (numeric, 0-50%, step 0.5%)
  - Investment Growth Rate (numeric, -50% to 50%, step 0.5%)
  - Spending Strategy (dropdown: Fixed Dollar, Percent of Portfolio, Guardrails, RMD-Based)
  - Conversion Strategy (dropdown: Standard, IRMAA Tier 1, 22% Bracket, 24% Bracket)
  - State Tax Rate (numeric, 0-20%)
  - Capital Gains Rate (numeric, 0-30%)
  - RMD Start Age (numeric, 70-80)
  - IRMAA Tier 1 Limit (currency)

#### Scenario: Conditional spending strategy parameters
- **WHEN** user selects "Percent of Portfolio" spending strategy
- **THEN** a Withdrawal Rate input appears
- **WHEN** user selects "Guardrails" spending strategy
- **THEN** Initial Withdrawal Rate, Floor %, Ceiling %, and Adjustment % inputs appear

---

### Requirement: Run mode selection
The Simulate tab SHALL provide a choice between single run and Monte Carlo modes.

#### Scenario: Run mode radio buttons
- **WHEN** user views the Simulate tab settings panel
- **THEN** two radio options are displayed: "Single run" and "Monte Carlo"
- **AND** Monte Carlo option includes an editable iteration count (default 1000)
- **AND** an (i) icon next to Monte Carlo explains what it does

#### Scenario: Single run selected
- **WHEN** user selects "Single run" and clicks Simulate
- **THEN** the system runs a single deterministic simulation using the configured growth rate
- **AND** results display as detailed year-by-year breakdown with balance chart

#### Scenario: Monte Carlo selected
- **WHEN** user selects "Monte Carlo" and clicks Simulate
- **THEN** the system runs N iterations with historically-sampled returns
- **AND** results display as success rate, percentile bands, fan chart, and depletion analysis

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
- **AND** the summary line displays key assumptions (e.g., "3% infl, 7% growth, Fixed Dollar, 22% Bracket")
- **AND** the Simulate button remains visible next to the summary

#### Scenario: Expand collapsed settings
- **WHEN** user clicks the collapsed summary line (or its expand indicator)
- **THEN** the full settings grid re-expands
- **AND** all previously entered values are preserved

#### Scenario: Settings expanded initially
- **WHEN** user first navigates to Simulate tab (no results yet)
- **THEN** the settings panel is expanded showing the full grid

---

### Requirement: Single Simulate button
The Simulate tab SHALL have a single "Simulate" button that runs the currently selected mode.

#### Scenario: Button text
- **WHEN** the Simulate tab is displayed
- **THEN** a single button labeled "Simulate" is shown
- **AND** during execution, the label changes to "Running..."
- **AND** the button is disabled during execution

---

### Requirement: Results display adapts to run mode
The results area SHALL display appropriate content based on whether a single run or Monte Carlo was executed.

#### Scenario: Single run results
- **WHEN** a single run simulation completes
- **THEN** results show: summary metrics (final balance, total taxes, IRMAA, Roth conversions, years, strategy), balance chart, collapsible year-by-year detail table
- **AND** an "Add to Comparison" button appears

#### Scenario: Monte Carlo results
- **WHEN** a Monte Carlo simulation completes
- **THEN** results show: success rate (color-coded), final balance percentiles, fan chart, depletion analysis
- **AND** an "Add to Comparison" button appears (captures median values + success rate)

---

### Requirement: Tab navigation reduces to 3 tabs
The application SHALL display exactly 3 tabs: Portfolio, Simulate, Compare.

#### Scenario: Tab bar content
- **WHEN** the application loads
- **THEN** the tab navigation shows "Portfolio", "Simulate", and "Compare"
- **AND** no "Monte Carlo" tab exists
