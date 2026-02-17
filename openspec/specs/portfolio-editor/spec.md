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
Planned expenses SHALL be displayed as card-style rows with background fill (`bg-surface-100`) and rounded corners, matching the Accounts editor visual style. Each expense row SHALL contain inline label+input pairs for Name, Amount, Type, When, Inflation checkbox, and a remove button. Column labels SHALL appear within each card row. The Annual Spending input SHALL appear above the expense cards.

#### Scenario: Card rows visible
- **WHEN** the user has one or more planned expenses in the Budget section
- **THEN** each expense displays as a rounded card row with background fill containing inline inputs

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
The Income editor SHALL display Social Security fields in a card-style block with `bg-surface-100` background and rounded corners. Other Income streams SHALL each display as individual card-style rows. A single "Other Income" heading SHALL appear above all income stream rows. Each stream card SHALL contain inline label+input pairs matching the Accounts editor pattern.

#### Scenario: Social Security card block
- **WHEN** the Income section is expanded
- **THEN** Social Security fields (Primary FRA Benefit, Primary Start Age, and optionally Spouse fields) appear inside a rounded card with background fill

#### Scenario: Other Income single header
- **WHEN** the user has 3 income streams
- **THEN** a single "Other Income" heading appears above the rows
- **AND** each stream appears as a card-style row with inline inputs (Name, Amount, Start Age, End Age, COLA %, Taxable)
- **AND** labels appear within each card row (not as a separate header row above)

### Requirement: Stacked area balance chart
The single-run balance chart SHALL use a stacked area chart with three series: Pre-tax, Roth, and Brokerage. The Total line is removed since the stack top implicitly shows the total.

#### Scenario: Chart renders stacked areas
- **WHEN** single-run results are displayed
- **THEN** the chart shows three filled, stacked areas for pre-tax (bottom), roth (middle), brokerage (top)
- **AND** no separate "Total" line is displayed

#### Scenario: Chart tooltip shows all values
- **WHEN** the user hovers over the chart
- **THEN** the tooltip shows the value for each account type and the total
