## MODIFIED Requirements

### Requirement: Income section
The editor SHALL provide the income editor component within the Income collapsible section. The income editor supports Social Security auto-generation and generic income streams (pensions, annuities, rental income, etc.).

#### Scenario: Income section content
- **WHEN** the user expands the Income section
- **THEN** the SS auto-generation inputs and income streams list are displayed

#### Scenario: Income data binding
- **WHEN** the user modifies SS or income stream values
- **THEN** the changes are reflected in the shared portfolio store
