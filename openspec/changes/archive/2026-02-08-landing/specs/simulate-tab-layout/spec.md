## MODIFIED Requirements

### Requirement: Simulate tab contains simulation assumptions
The simulation settings panel SHALL provide input controls for all simulation assumption parameters. The settings panel is rendered in the left panel of the landing page below the portfolio editor, rather than within the results area.

#### Scenario: Assumption inputs present
- **WHEN** the user views the landing page
- **THEN** the simulation settings inputs are visible below the portfolio editor sections in the left panel

#### Scenario: Conditional spending strategy parameters
- **WHEN** the user selects "Percent of Portfolio" spending strategy
- **THEN** a Withdrawal Rate input appears
- **WHEN** the user selects "Guardrails" spending strategy
- **THEN** Initial Withdrawal Rate, Floor %, Ceiling %, and Adjustment % inputs appear

### Requirement: Results display adapts to run mode
The results area in the right panel SHALL display appropriate content based on whether a single run or Monte Carlo was executed.

#### Scenario: Single run results
- **WHEN** a single run simulation completes
- **THEN** results show: summary metrics (final balance, total taxes, IRMAA, Roth conversions, years, strategy), balance chart, collapsible year-by-year detail table
- **AND** an "Add to Comparison" button appears

#### Scenario: Monte Carlo results
- **WHEN** a Monte Carlo simulation completes
- **THEN** results show: success rate (color-coded), final balance percentiles, fan chart, depletion analysis
- **AND** an "Add to Comparison" button appears (captures median values + success rate)
