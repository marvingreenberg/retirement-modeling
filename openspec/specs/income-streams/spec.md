# income-streams Specification

## Purpose
Define periodic income sources (pensions, annuities, rental income, Social Security) with age-based activation, partial taxability, and optional COLA growth.
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

### Requirement: Income Stream COLA Adjustment

The system SHALL support an optional cost-of-living adjustment (COLA) rate on each income stream.

#### Scenario: COLA field definition
- **WHEN** an income stream is defined
- **THEN** it MAY include `cola_rate` (float, optional, default None)
- **AND** None means no COLA (amount stays fixed)

#### Scenario: COLA applied during simulation
- **WHEN** an income stream has `cola_rate` set to a non-None value
- **AND** the stream is active (within start_age/end_age range)
- **THEN** the effective amount SHALL be `amount * (1 + cola_rate) ^ years_active`
- **AND** `years_active` is `current_age - start_age`

#### Scenario: First year of activation
- **WHEN** `current_age` equals `start_age`
- **THEN** `years_active` is 0
- **AND** the effective amount SHALL equal the base `amount` (no COLA applied)

#### Scenario: No COLA configured
- **WHEN** `cola_rate` is None (default)
- **THEN** the effective amount SHALL equal the base `amount` every year (backward compatible)

#### Scenario: Zero COLA rate
- **WHEN** `cola_rate` is 0.0
- **THEN** the effective amount SHALL equal the base `amount` every year (explicit no-growth)

