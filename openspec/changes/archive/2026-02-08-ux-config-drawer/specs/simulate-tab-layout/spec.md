## MODIFIED Requirements

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
