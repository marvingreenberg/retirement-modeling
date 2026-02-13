## MODIFIED Requirements

### Requirement: Simulation settings panel
The simulation settings panel SHALL provide input controls for simulation assumption parameters. Primary assumptions (Inflation Rate, Investment Growth Rate, Conversion Strategy) SHALL be visible by default. Withdrawal Strategy and its conditional parameters SHALL appear between the primary assumptions and the Advanced section. Advanced settings (State Tax Rate, Capital Gains Rate, RMD Start Age, IRMAA Tier 1 Limit) SHALL be in a collapsible "Advanced" section that defaults to collapsed.

#### Scenario: Primary inputs visible
- **WHEN** the user views the simulation settings panel
- **THEN** Inflation Rate, Investment Growth Rate, and Conversion Strategy inputs are visible

#### Scenario: Withdrawal strategy visible
- **WHEN** the user views the simulation settings panel
- **THEN** a Withdrawal Strategy dropdown is visible between the primary assumptions and the Advanced toggle
- **AND** the dropdown shows strategy name and a shorthand value (e.g., "Fixed/$120K", "4.0%/POP")

#### Scenario: Conditional params for percent_of_portfolio
- **WHEN** the user selects "% of Portfolio" strategy
- **THEN** a Withdrawal Rate input appears inline

#### Scenario: Conditional params for guardrails
- **WHEN** the user selects "Guardrails" strategy
- **THEN** Init. WD Rate, Floor %, Ceiling %, and Adjust % inputs appear inline

#### Scenario: No extra params for fixed_dollar or rmd_based
- **WHEN** the user selects "Fixed Dollar" or "RMD-Based" strategy
- **THEN** no additional inputs appear for the strategy

#### Scenario: Advanced section collapsed by default
- **WHEN** the settings panel is first displayed
- **THEN** the advanced settings (State Tax %, Cap Gains %, RMD Age, IRMAA Limit) are hidden
- **AND** an "Advanced" toggle is visible

#### Scenario: Collapsed summary includes strategy
- **WHEN** the settings panel is collapsed after a simulation run
- **THEN** the summary text includes withdrawal strategy shorthand (e.g., "3.0% infl, 7.0% growth, IRMAA Tier 1, Fixed/$120K")

#### Scenario: Spending strategy not on budget page
- **WHEN** the user views the budget page
- **THEN** the spending strategy dropdown and its conditional parameters are NOT present
