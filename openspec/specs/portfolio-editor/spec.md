## Purpose
Editable form for managing retirement accounts, budget, income streams, and portfolio import with collapsible sections.
## Requirements
### Requirement: Collapsible form sections
The portfolio editor SHALL organize fields into collapsible sections: Accounts, Budget, and Income. Each section SHALL be independently expandable/collapsible. The Budget section contains the full spending editor with annual spending input and planned expenses table.

#### Scenario: Sections start collapsed
- **WHEN** the user opens the portfolio editor
- **THEN** Accounts, Budget, and Income sections are collapsed

#### Scenario: Toggle section
- **WHEN** the user clicks a collapsed section header
- **THEN** that section expands to show its fields

### Requirement: People & Timeline fields
The editor SHALL provide inputs for primary age, spouse age, simulation years, and start year with numeric validation matching the backend constraints (ages 0-120, years 1-100, start year 2000-2100).

#### Scenario: Valid ages entered
- **WHEN** the user enters age 65 for primary and 62 for spouse
- **THEN** the values are accepted without error

#### Scenario: Invalid age rejected
- **WHEN** the user enters age 150 for primary
- **THEN** a validation error is displayed indicating the maximum is 120

### Requirement: Accounts editor
The editor SHALL allow adding, editing, and removing accounts. Each account has fields for name, type (pretax/roth/brokerage), balance, owner (primary/spouse/joint), cost basis ratio, and available-at-age. At least one account is required.

#### Scenario: Add an account
- **WHEN** the user clicks "Add Account"
- **THEN** a new account row appears with default values (type: brokerage, balance: 0, owner: primary)

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

### Requirement: Tax section
The editor SHALL provide fields for state tax rate, capital gains rate, RMD start age, and IRMAA tier 1 limit.

#### Scenario: Tax defaults populated
- **WHEN** the user opens a new portfolio editor
- **THEN** tax fields show defaults: state rate 5.75%, capital gains 15%, RMD age 73, IRMAA limit $206,000

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

### Requirement: JSON file import
The editor SHALL provide a "Load" button that opens a file picker for JSON files. Loading a valid portfolio JSON SHALL populate all form fields.

#### Scenario: Load valid portfolio file
- **WHEN** the user selects a valid portfolio JSON file
- **THEN** all form fields are populated with the file's values

#### Scenario: Load invalid file
- **WHEN** the user selects a file that fails Zod validation
- **THEN** an error message is displayed describing what's wrong

### Requirement: JSON file export
The editor SHALL provide a "Save" button that downloads the current portfolio state as a JSON file compatible with the CLI tool.

#### Scenario: Save portfolio
- **WHEN** the user clicks "Save" with a valid portfolio
- **THEN** a JSON file is downloaded containing the portfolio data in the CLI-compatible format

### Requirement: Compact budget section
The PortfolioEditor SHALL include a Budget collapsible section containing the full SpendingEditor component: annual spending input with monthly equivalent detail, and a planned expenses table with add/remove controls.

#### Scenario: Budget section with planned expenses
- **WHEN** user has 3 planned expenses totaling $55,000 and annual spending of $120,000
- **THEN** the Budget section shows the annual spending input, monthly detail "$10,000/mo", and a planned expenses table listing all 3 expenses

#### Scenario: Budget section without planned expenses
- **WHEN** user has annual spending of $120,000 and no planned expenses
- **THEN** the Budget section shows the annual spending input, monthly detail, and an "Add Expense" button

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

### Requirement: Stacked area balance chart
The single-run balance chart SHALL use a stacked area chart with three series: Pre-tax, Roth, and Brokerage. The Total line is removed since the stack top implicitly shows the total.

#### Scenario: Chart renders stacked areas
- **WHEN** single-run results are displayed
- **THEN** the chart shows three filled, stacked areas for pre-tax (bottom), roth (middle), brokerage (top)
- **AND** no separate "Total" line is displayed

#### Scenario: Chart tooltip shows all values
- **WHEN** the user hovers over the chart
- **THEN** the tooltip shows the value for each account type and the total

