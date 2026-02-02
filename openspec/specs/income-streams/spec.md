# income-streams Specification

## Purpose
TBD - created by archiving change add-income-streams. Update Purpose after archive.
## Requirements
### Requirement: Income Stream Model

The system SHALL support a list of generic income streams representing pensions, annuities, rental income, or other periodic income sources.

#### Scenario: Income stream fields
- **WHEN** an income stream is defined
- **THEN** it SHALL have: `name` (str), `amount` (float >= 0), `start_age` (int), `end_age` (int, optional), and `taxable_pct` (float 0.0-1.0, default 1.0)

#### Scenario: No income streams configured
- **WHEN** no income streams are provided
- **THEN** the simulation SHALL behave identically to current behavior

### Requirement: Income Stream Activation

The system SHALL activate each income stream based on age thresholds.

#### Scenario: Before start age
- **WHEN** primary owner age < stream's `start_age`
- **THEN** stream contributes $0

#### Scenario: Within age range
- **WHEN** primary owner age >= `start_age`
- **AND** `end_age` is not set or age <= `end_age`
- **THEN** stream contributes its full `amount`

#### Scenario: After end age
- **WHEN** `end_age` is set
- **AND** primary owner age > `end_age`
- **THEN** stream contributes $0

### Requirement: Income Stream Tax Treatment

The system SHALL include the taxable portion of income streams in AGI.

#### Scenario: Fully taxable stream
- **WHEN** `taxable_pct` is 1.0 (default)
- **THEN** 100% of the amount is added to AGI

#### Scenario: Partially taxable stream
- **WHEN** `taxable_pct` is between 0.0 and 1.0
- **THEN** `amount * taxable_pct` is added to AGI

