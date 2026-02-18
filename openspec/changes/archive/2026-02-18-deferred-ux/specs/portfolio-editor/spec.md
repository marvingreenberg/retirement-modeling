## MODIFIED Requirements

### Requirement: Account available_at_age displayed as year
The account editor SHALL display the `available_at_age` field as a calendar year with an "(age N)" hint.

#### Scenario: Available age shown as year
- **WHEN** an account has available_at_age 59.5 (rounded to 60) and the owner (primary) is 55 in 2026
- **THEN** the Avail. Year input SHALL show "2031" with hint "(age 60)"

#### Scenario: Zero available age
- **WHEN** an account has available_at_age 0
- **THEN** the input SHALL show the current start_year with hint "(now)"

### Requirement: AccountsEditor receives config
The AccountsEditor component SHALL accept a config prop to enable age-to-year conversion.

#### Scenario: Config passed from PortfolioEditor
- **WHEN** PortfolioEditor renders AccountsEditor
- **THEN** it SHALL pass the config object (or start_year and age values)
