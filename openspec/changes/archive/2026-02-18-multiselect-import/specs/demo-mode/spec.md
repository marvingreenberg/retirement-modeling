## ADDED Requirements

### Requirement: Randomize balances for demo
The app SHALL provide a "Randomize for Demo" action that anonymizes portfolio data for safe sharing or demonstration.

#### Scenario: Randomize balances
- **WHEN** the user clicks "Randomize for Demo"
- **AND** confirms the action
- **THEN** each account balance is multiplied by a random factor between 0.3 and 0.7
- **AND** balances are rounded to the nearest $1000

#### Scenario: Randomize names
- **WHEN** randomization is applied
- **THEN** profile names are replaced with generic placeholders ("Alex" and "Sam")

#### Scenario: Button location
- **WHEN** the ProfileDrawer is open
- **THEN** a "Randomize for Demo" button appears in the Advanced settings section

#### Scenario: Confirmation required
- **WHEN** the user clicks "Randomize for Demo"
- **THEN** a confirmation prompt appears before applying changes
