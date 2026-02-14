## MODIFIED Requirements

### Requirement: Collapsible withdrawal strategy section
The Withdrawal Strategy controls SHALL be in a collapsible subsection between the primary assumptions row and the Advanced section. The section SHALL show a succinct summary when collapsed.

#### Scenario: Strategy section collapsed by default
- **WHEN** the settings panel is expanded
- **THEN** the Withdrawal Strategy section is collapsed
- **AND** a summary line is visible (e.g., "Withdrawal Strategy — Fixed $140K")

#### Scenario: Strategy collapsed summary for fixed_dollar
- **WHEN** the spending strategy is fixed_dollar with annual spend of $140,000
- **THEN** the collapsed summary reads "Withdrawal Strategy — Fixed $140K"

#### Scenario: Strategy collapsed summary for percent_of_portfolio
- **WHEN** the spending strategy is percent_of_portfolio with withdrawal rate 0.04
- **THEN** the collapsed summary reads "Withdrawal Strategy — 4.0% of Portfolio"

#### Scenario: Strategy collapsed summary for guardrails
- **WHEN** the spending strategy is guardrails with initial rate 0.045, floor 0.80, ceiling 1.20
- **THEN** the collapsed summary reads "Withdrawal Strategy — Guardrails 4.5%, (80/120)"

#### Scenario: Strategy collapsed summary for rmd_based
- **WHEN** the spending strategy is rmd_based
- **THEN** the collapsed summary reads "Withdrawal Strategy — RMD-Based"

#### Scenario: Strategy section expanded
- **WHEN** the user clicks the collapsed strategy summary
- **THEN** the section expands showing the strategy dropdown and any conditional parameters
- **AND** fixed_dollar and rmd_based show only the dropdown
- **AND** percent_of_portfolio shows the dropdown and withdrawal rate on the same row
- **AND** guardrails shows the dropdown and init rate on row 1, floor/ceiling/adjust on row 2

### Requirement: Collapsible advanced section with summary
The Advanced section SHALL show a summary when collapsed indicating whether settings are default or customized.

#### Scenario: Advanced collapsed with defaults
- **WHEN** all advanced settings match default values
- **THEN** the collapsed summary reads "Advanced — defaults"

#### Scenario: Advanced collapsed with custom values
- **WHEN** any advanced setting differs from the default
- **THEN** the collapsed summary reads "Advanced — custom"
