## ADDED Requirements

### Requirement: Conversion strategy UI gating
The conversion strategy dropdown SHALL be disabled when the primary user's age is at or past the configured RMD start age. A tooltip SHALL explain that conversions only apply before RMD age.

#### Scenario: User before RMD age
- **WHEN** primary age is 65 and RMD start age is 73
- **THEN** the conversion strategy dropdown is enabled and selectable

#### Scenario: User at RMD age
- **WHEN** primary age is 73 and RMD start age is 73
- **THEN** the conversion strategy dropdown is disabled
- **AND** a tooltip or note reads "Conversions only apply before RMD age (73)"

#### Scenario: User past RMD age
- **WHEN** primary age is 80 and RMD start age is 73
- **THEN** the conversion strategy dropdown is disabled with the same explanatory note
