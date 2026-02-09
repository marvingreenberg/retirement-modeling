## ADDED Requirements

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
