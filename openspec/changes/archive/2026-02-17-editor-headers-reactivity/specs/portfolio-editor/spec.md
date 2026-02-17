## ADDED Requirements

### Requirement: Add Income immediate reactivity
When the user clicks "Add Income", the new income stream row SHALL appear immediately without requiring the user to close and reopen the Income section.

#### Scenario: Add income stream appears immediately
- **WHEN** the user clicks "Add Income" in the Income section
- **THEN** a new income stream row appears immediately with default values

#### Scenario: Remove income stream disappears immediately
- **WHEN** the user clicks the remove button on an income stream
- **THEN** that row disappears immediately

### Requirement: Single header row for list editors
The Accounts, Other Income, and Planned Expenses editors SHALL display a single header row with column names above all data rows when items exist. Data rows SHALL NOT contain individual labels — inputs align to the header columns. When no items exist, the header row SHALL NOT be displayed.

#### Scenario: Accounts header row
- **WHEN** the user has 2 or more accounts
- **THEN** a single header row shows column names (Name, Type, Balance, Owner, Cost Basis %, Avail. Age) above both account rows

#### Scenario: No accounts hides header
- **WHEN** the user has no accounts
- **THEN** no header row is displayed (the "Add an account" warning still shows)

#### Scenario: Income streams header row
- **WHEN** the user has 1 or more income streams
- **THEN** a single header row shows column names (Name, Amount, Start Age, End Age, COLA %, Taxable) above all stream rows

#### Scenario: No income streams hides header
- **WHEN** the user has no income streams
- **THEN** no header row is displayed, just the "Add Income" button

#### Scenario: Expenses header row
- **WHEN** the user has 1 or more planned expenses
- **THEN** a single header row shows column names (Name, Amount, Type, When, Infl.) above all expense rows

#### Scenario: No expenses hides header
- **WHEN** the user has no planned expenses
- **THEN** no header row is displayed, just the "Add Expense" button

## MODIFIED Requirements

### Requirement: Planned expenses card layout
Planned expenses SHALL be displayed as card-style rows with background fill (`bg-surface-100`) and rounded corners. Each expense row SHALL contain inputs WITHOUT labels, aligned to a single header row above. Fixed column widths SHALL ensure the variable-width When column (single year vs start–end years) aligns consistently across rows. The Annual Spending input SHALL appear above the expense cards.

#### Scenario: Card rows visible
- **WHEN** the user has one or more planned expenses in the Budget section
- **THEN** a single header row appears with column names, and each expense displays as a rounded card row with background fill containing inputs aligned to the header

#### Scenario: One-time expense When field
- **WHEN** a planned expense has type "One-time" with year 2028
- **THEN** the When area displays a single year input showing 2028

#### Scenario: Recurring expense When field
- **WHEN** a planned expense has type "Recurring" with start year 2026 and end year 2035
- **THEN** the When area displays two year inputs showing 2026 and 2035 separated by a dash

#### Scenario: Add expense
- **WHEN** the user clicks "Add Expense" below the cards
- **THEN** a new card row appears with default values

#### Scenario: Remove expense
- **WHEN** the user clicks the remove button on a card row
- **THEN** that expense card is removed

### Requirement: Income section card layout
The Income editor SHALL display Social Security fields in a card-style block with `bg-surface-100` background and rounded corners. Other Income streams SHALL each display as individual card-style rows with inputs aligned to a single header row above. A single "Other Income" heading SHALL appear above the header row. Each stream row SHALL contain inputs WITHOUT per-row labels.

#### Scenario: Social Security card block
- **WHEN** the Income section is expanded
- **THEN** Social Security fields appear inside a rounded card with background fill and inline labels

#### Scenario: Other Income single header
- **WHEN** the user has 1 or more income streams
- **THEN** a single "Other Income" heading appears, followed by a header row with column names, followed by data rows with inputs aligned to the header
