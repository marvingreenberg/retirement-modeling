## MODIFIED Requirements

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
When loading portfolio data from localStorage or imported files, if the data contains invalid account types (e.g., old `pretax`/`roth` values), the behavior SHALL be: localStorage data is silently ignored (app starts fresh with sample data); imported files fail with error message "Invalid, pre-version 0.10.0 data".

#### Scenario: Invalid localStorage ignored
- **WHEN** the app loads and localStorage contains accounts with type "pretax"
- **THEN** the invalid data is discarded and the app starts as if no saved data exists

#### Scenario: Invalid file import rejected
- **WHEN** the user imports a JSON file containing accounts with type "pretax"
- **THEN** an error message "Invalid, pre-version 0.10.0 data" is displayed and the file is not loaded
