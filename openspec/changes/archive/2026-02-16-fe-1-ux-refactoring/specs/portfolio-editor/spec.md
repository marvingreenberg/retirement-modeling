## ADDED Requirements

### Requirement: Compact budget section
The PortfolioEditor SHALL include a Budget collapsible section containing the annual spending input field, a count and total of planned expenses (if any), and a link to the full `/spending` page.

#### Scenario: Budget section with planned expenses
- **WHEN** user has 3 planned expenses totaling $55,000
- **THEN** the Budget section shows the annual spending input, "3 planned expenses ($55,000)", and a "Full spending plan" link to /spending

#### Scenario: Budget section without planned expenses
- **WHEN** user has no planned expenses
- **THEN** the Budget section shows only the annual spending input and the "Full spending plan" link

## MODIFIED Requirements

### Requirement: Collapsible form sections
The portfolio editor SHALL organize fields into collapsible sections: Accounts, Budget, and Income. Each section SHALL be independently expandable/collapsible. The Budget section contains a compact annual spending input and link to the full spending page at `/spending`.

#### Scenario: Sections start collapsed
- **WHEN** the user opens the portfolio editor
- **THEN** Accounts, Budget, and Income sections are collapsed

#### Scenario: Toggle section
- **WHEN** the user clicks a collapsed section header
- **THEN** that section expands to show its fields
