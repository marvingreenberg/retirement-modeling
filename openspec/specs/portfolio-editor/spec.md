## Purpose
Editable form for managing retirement accounts, budget, income streams with collapsible sections.
## Requirements
### Requirement: Collapsible form sections
The portfolio editor SHALL organize fields into collapsible sections: Accounts, Budget, and Income. Each section SHALL be independently expandable/collapsible. The Budget section contains the full spending editor with annual spending input and planned expenses table.

#### Scenario: Sections start collapsed
- **WHEN** the user opens the portfolio editor
- **THEN** Accounts, Budget, and Income sections are collapsed

#### Scenario: Toggle section
- **WHEN** the user clicks a collapsed section header
- **THEN** that section expands to show its fields

### Requirement: Accounts editor
The editor SHALL allow adding, editing, and removing accounts. Each account has fields for name, type (expanded to specific types: brokerage, cash_cd, roth_ira, roth_401k, 401k, 403b, 457b, ira, sep_ira, simple_ira), balance, owner (primary/spouse/joint), cost basis ratio, and available-at-age. At least one account is required. When the user selects an account type, cost_basis_ratio SHALL auto-fill to the type's default. For types with fixed cost basis (all except brokerage), the Cost Basis % input SHALL be disabled.

#### Scenario: Add an account
- **WHEN** the user clicks "Add Account"
- **THEN** a new account row appears with default values (type: brokerage, balance: 0, owner: primary, cost_basis_ratio: 0.40)

#### Scenario: Type change auto-fills cost basis
- **WHEN** the user changes an account type from brokerage to ira
- **THEN** cost_basis_ratio auto-fills to 0.00 and the Cost Basis % input becomes disabled

#### Scenario: Brokerage cost basis editable
- **WHEN** the user selects brokerage as account type
- **THEN** the Cost Basis % input is enabled and defaults to 40

#### Scenario: Account type dropdown shows specific types
- **WHEN** the user opens the account Type dropdown
- **THEN** options include: Brokerage, Cash/CD, Roth IRA, Roth 401(k), 401(k), 403(b), 457(b), IRA, SEP IRA, SIMPLE IRA (roth_conversion is NOT shown — it's simulation-only)

#### Scenario: Remove an account
- **WHEN** the user clicks remove on an account and more than one account exists
- **THEN** that account is removed from the list

#### Scenario: Cannot remove last account
- **WHEN** only one account exists
- **THEN** the remove button is disabled or hidden

### Requirement: Income section
The editor SHALL provide the income editor component within the Income collapsible section. The income editor supports Social Security auto-generation and generic income streams (pensions, annuities, rental income, etc.).

#### Scenario: Income section content
- **WHEN** the user expands the Income section
- **THEN** the SS auto-generation inputs and income streams list are displayed

#### Scenario: Income data binding
- **WHEN** the user modifies SS or income stream values
- **THEN** the changes are reflected in the shared portfolio store

### Requirement: Strategy section
The editor SHALL provide a dropdown for conversion strategy selection from the available options (standard, irmaa_tier_1, 22_percent_bracket, 24_percent_bracket).

#### Scenario: Strategy selected
- **WHEN** the user selects "24_percent_bracket" from the conversion strategy dropdown
- **THEN** the value is stored in the portfolio state

### Requirement: Zod validation
All portfolio fields SHALL be validated using Zod schemas that match the backend Pydantic model constraints. Validation errors SHALL be displayed inline next to the relevant field. Simulation settings validation errors (inflation rate, growth rate) SHALL appear next to their respective inputs, not in the portfolio editor error banner.

#### Scenario: Field-level error display
- **WHEN** the user enters a negative balance for an account
- **THEN** an error message appears next to the balance field

#### Scenario: Full portfolio validation on submit
- **WHEN** the user clicks a "Run" button on any analysis tab
- **THEN** the full portfolio is validated and all errors are displayed before the API call is made

#### Scenario: Config validation error appears at input
- **WHEN** the user enters an out-of-range inflation rate (e.g., 103%)
- **THEN** the error message appears next to the inflation rate input, not in the portfolio error banner

### Requirement: Compact budget section
The PortfolioEditor SHALL include a Budget collapsible section containing the full SpendingEditor component: annual spending input with monthly equivalent detail, and a planned expenses table with add/remove controls.

#### Scenario: Budget section with planned expenses
- **WHEN** user has 3 planned expenses totaling $55,000 and annual spending of $120,000
- **THEN** the Budget section shows the annual spending input, monthly detail "$10,000/mo", and a planned expenses table listing all 3 expenses

#### Scenario: Budget section without planned expenses
- **WHEN** user has annual spending of $120,000 and no planned expenses
- **THEN** the Budget section shows the annual spending input, monthly detail, and an "Add Expense" button

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

### Requirement: Collapsed section summaries
Each collapsible section (Accounts, Budget, Income) SHALL display a summary when collapsed, showing key data inline with the section title.

#### Scenario: Accounts collapsed summary
- **WHEN** the Accounts section is collapsed and user has accounts totaling $1,350,000
- **THEN** the section header shows "Accounts — Total $1.35M"

#### Scenario: Accounts collapsed with no accounts
- **WHEN** the Accounts section is collapsed and user has no accounts
- **THEN** the section header shows "Accounts — No accounts"

#### Scenario: Budget collapsed summary
- **WHEN** the Budget section is collapsed and annual spending is $120,000
- **THEN** the section header shows "Budget — $120,000/yr"

#### Scenario: Budget collapsed with planned expenses
- **WHEN** the Budget section is collapsed with $120,000 annual and 2 planned expenses totaling $55,000
- **THEN** the section header shows "Budget — $120,000/yr + 2 expenses"

#### Scenario: Income collapsed summary with SS and pension
- **WHEN** the Income section is collapsed with SS starting at age 70 and a $24K/yr pension
- **THEN** the section header shows a summary like "Income — SS at 70, Pension $24K/yr"

#### Scenario: Income collapsed with no income
- **WHEN** the Income section is collapsed and no income streams or SS configured
- **THEN** the section header shows "Income — None configured"

### Requirement: Select-all-on-focus for editor inputs
All text and number `<input>` elements in the Accounts, Budget, and Income editors SHALL select their full contents when receiving focus. This allows users to type a replacement value immediately without manual selection.

#### Scenario: Focus selects existing value
- **WHEN** the user clicks or tabs into a number input containing "1000"
- **THEN** the text "1000" is fully selected
- **AND** typing "500" replaces the value to "500" (not "1000500")

#### Scenario: Works on text inputs
- **WHEN** the user clicks into an account Name input containing "401k"
- **THEN** the text "401k" is fully selected

### Requirement: Immediate type-change reactivity for expenses
When the user changes a planned expense's type between One-time and Recurring, the When field SHALL immediately switch between the single year input and the start/end year inputs without requiring the user to click away or close/reopen the section.

#### Scenario: Switch from one-time to recurring
- **WHEN** a planned expense has type "One-time" with year 2028
- **AND** the user changes the Type dropdown to "Recurring"
- **THEN** the When field immediately shows two year inputs (start year pre-filled with 2028, end year empty)

#### Scenario: Switch from recurring to one-time
- **WHEN** a planned expense has type "Recurring" with start year 2026 and end year 2035
- **AND** the user changes the Type dropdown to "One-time"
- **THEN** the When field immediately shows a single year input pre-filled with 2026

### Requirement: Income section card layout
The Income editor SHALL display Social Security fields in a card-style block with `bg-surface-100` background and rounded corners. Other Income streams SHALL each display as individual card-style rows with inputs aligned to a single header row above. A single "Other Income" heading SHALL appear above the header row. Each stream row SHALL contain inputs WITHOUT per-row labels.

#### Scenario: Social Security card block
- **WHEN** the Income section is expanded
- **THEN** Social Security fields appear inside a rounded card with background fill and inline labels

#### Scenario: Other Income single header
- **WHEN** the user has 1 or more income streams
- **THEN** a single "Other Income" heading appears, followed by a header row with column names, followed by data rows with inputs aligned to the header

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

### Requirement: Stacked area balance chart
The single-run balance chart SHALL use a stacked area chart with up to four series: Pre-tax (red), Roth Conversions (purple), Roth (green), Brokerage (gold). Series WHERE every year's balance is zero SHALL be excluded entirely (no line, no legend entry). Order bottom-to-top: Pre-tax, Roth Conversions, Roth, Brokerage.

#### Scenario: Chart renders 4 layers when all present
- **WHEN** single-run results include pre-tax, roth, roth_conversion, and brokerage balances
- **THEN** the chart shows four filled, stacked areas in order: pre-tax (bottom), roth conversions, roth, brokerage (top)

#### Scenario: Chart hides empty layers
- **WHEN** no conversions occurred (roth_conversion_balance is 0 every year)
- **THEN** the chart shows only three layers (pre-tax, roth, brokerage) with no "Roth Conversions" legend entry

#### Scenario: Chart tooltip shows all visible values
- **WHEN** the user hovers over the chart
- **THEN** the tooltip shows the value for each visible account type and the total

### Requirement: Invalid data handling
When loading portfolio data from localStorage or imported files, the system SHALL gracefully handle saved data that references removed fields. Unknown fields are silently stripped. Invalid account types cause failures.

#### Scenario: localStorage with unknown fields
- **WHEN** auto-save restores data containing removed fields (e.g., `tax_rate_capital_gains`)
- **THEN** the Zod schema SHALL strip unknown fields silently
- **AND** the portfolio SHALL load without the removed field

#### Scenario: Imported file with unknown fields
- **WHEN** a JSON file containing removed fields is imported
- **THEN** the Zod schema SHALL strip unknown fields
- **AND** the portfolio SHALL load successfully without the removed field

#### Scenario: Invalid localStorage ignored
- **WHEN** the app loads and localStorage contains accounts with type "pretax"
- **THEN** the invalid data is discarded and the app starts as if no saved data exists

#### Scenario: Invalid file import rejected
- **WHEN** the user imports a JSON file containing accounts with type "pretax"
- **THEN** an error message is displayed and the file is not loaded
