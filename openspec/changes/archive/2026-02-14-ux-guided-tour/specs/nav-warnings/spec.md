## ADDED Requirements

### Requirement: Inline section warnings
The PortfolioEditor left panel SHALL display inline warning messages within collapsible sections when simulation prerequisites are missing.

#### Scenario: No accounts warning
- **WHEN** the portfolio has no accounts
- **THEN** the Accounts section displays a warning icon and "Add an account to allow simulation"

#### Scenario: No budget warning
- **WHEN** the portfolio has accounts but annual_spend_net is 0
- **THEN** the Budget section displays a warning icon and "Define expected annual spending to allow simulation"

#### Scenario: Warning clears when resolved
- **WHEN** the user adds an account or configures spending to a non-zero value
- **THEN** the corresponding warning disappears

### Requirement: Simulate blocking
Clicking Simulate SHALL be blocked when simulation prerequisites are missing. The app SHALL auto-expand the relevant section to draw attention to the warning.

#### Scenario: Simulate blocked with no accounts
- **WHEN** the user clicks Simulate with no accounts
- **THEN** the simulation does not run and the Accounts section expands to show the warning

#### Scenario: Simulate blocked with no budget
- **WHEN** the user clicks Simulate with accounts but $0 spending
- **THEN** the simulation does not run and the Budget section expands to show the warning

### Requirement: Warning source removal
The inline warning banners on the Overview page SHALL be removed. Nav-anchored warning indicators are not used; warnings are shown inline within PortfolioEditor sections.

#### Scenario: No inline warnings in results area
- **WHEN** the Overview page is displayed with $0 spending
- **THEN** no inline warning banner is shown in the results area
- **AND** the Budget section in PortfolioEditor shows a warning instead
