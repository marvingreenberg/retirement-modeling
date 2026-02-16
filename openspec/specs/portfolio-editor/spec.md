## Purpose
Editable form for managing retirement accounts, budget, income streams, and portfolio import with collapsible sections.
## Requirements
### Requirement: Collapsible form sections
The portfolio editor SHALL organize fields into collapsible sections: Accounts, Budget, and Income. Each section SHALL be independently expandable/collapsible. The Budget section contains a compact annual spending input and link to the full spending page at `/spending`.

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
All portfolio fields SHALL be validated using Zod schemas that match the backend Pydantic model constraints. Validation errors SHALL be displayed inline next to the relevant field.

#### Scenario: Field-level error display
- **WHEN** the user enters a negative balance for an account
- **THEN** an error message appears next to the balance field

#### Scenario: Full portfolio validation on submit
- **WHEN** the user clicks a "Run" button on any analysis tab
- **THEN** the full portfolio is validated and all errors are displayed before the API call is made

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
The PortfolioEditor SHALL include a Budget collapsible section containing the annual spending input field, a count and total of planned expenses (if any), and a link to the full `/spending` page.

#### Scenario: Budget section with planned expenses
- **WHEN** user has 3 planned expenses totaling $55,000
- **THEN** the Budget section shows the annual spending input, "3 planned expenses ($55,000)", and a "Full spending plan" link to /spending

#### Scenario: Budget section without planned expenses
- **WHEN** user has no planned expenses
- **THEN** the Budget section shows only the annual spending input and the "Full spending plan" link

