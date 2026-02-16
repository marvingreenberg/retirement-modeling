## MODIFIED Requirements

### Requirement: Collapsible form sections
The portfolio editor SHALL organize fields into collapsible sections: Accounts, Budget, and Income. Each section SHALL be independently expandable/collapsible. The Budget section contains the full spending editor with annual spending input and planned expenses table.

#### Scenario: Sections start collapsed
- **WHEN** the user opens the portfolio editor
- **THEN** Accounts, Budget, and Income sections are collapsed

#### Scenario: Toggle section
- **WHEN** the user clicks a collapsed section header
- **THEN** that section expands to show its fields

### Requirement: Compact budget section
The PortfolioEditor SHALL include a Budget collapsible section containing the full SpendingEditor component: annual spending input with monthly equivalent detail, and a planned expenses table with add/remove controls.

#### Scenario: Budget section with planned expenses
- **WHEN** user has 3 planned expenses totaling $55,000 and annual spending of $120,000
- **THEN** the Budget section shows the annual spending input, monthly detail "$10,000/mo", and a planned expenses table listing all 3 expenses

#### Scenario: Budget section without planned expenses
- **WHEN** user has annual spending of $120,000 and no planned expenses
- **THEN** the Budget section shows the annual spending input, monthly detail, and an "Add Expense" button

## ADDED Requirements

### Requirement: Planned expenses table layout
Planned expenses SHALL be displayed in a table with columns: Name, Amount ($), Type, When, Infl., and a remove button column. Column headers SHALL appear once at the top of the table.

#### Scenario: Table columns visible
- **WHEN** the user has one or more planned expenses in the Budget section
- **THEN** a table displays with column headers: Name, Amount ($), Type, When, Infl., and a remove column

#### Scenario: One-time expense When column
- **WHEN** a planned expense has type "One-time" with year 2028
- **THEN** the When column displays a single year input showing 2028

#### Scenario: Recurring expense When column
- **WHEN** a planned expense has type "Recurring" with start year 2026 and end year 2035
- **THEN** the When column displays two year inputs showing 2026 and 2035 separated by a dash

#### Scenario: Add expense from table
- **WHEN** the user clicks "Add Expense" below the table
- **THEN** a new row appears in the table with default values

#### Scenario: Remove expense from table
- **WHEN** the user clicks the remove button on a table row
- **THEN** that expense row is removed from the table

## REMOVED Requirements

### Requirement: Budget configuration page
**Reason**: All spending functionality consolidated into the Budget collapsible section of the PortfolioEditor. The dedicated `/spending` route is no longer needed.
**Migration**: Use the Budget section in the PortfolioEditor on the Overview page.
