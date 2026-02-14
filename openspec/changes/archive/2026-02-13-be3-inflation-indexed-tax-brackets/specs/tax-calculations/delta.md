## ADDED Requirements

### Requirement: Inflation-Indexed Tax Thresholds
All dollar-denominated tax thresholds SHALL be adjusted by cumulative inflation each simulation year.

#### Scenario: Federal bracket limits indexed
- **WHEN** computing federal income tax in simulation year N
- **THEN** each bracket limit SHALL be `base_limit * cumulative_inflation_factor`
- **AND** base limits are the 2024 MFJ constants
- **AND** rates are unchanged (only limits are indexed)

#### Scenario: IRMAA tier thresholds indexed
- **WHEN** computing IRMAA cost in simulation year N
- **THEN** each tier limit SHALL be `base_limit * cumulative_inflation_factor`

#### Scenario: Capital gains bracket thresholds indexed
- **WHEN** computing capital gains tax in simulation year N
- **THEN** each bracket limit SHALL be `base_limit * cumulative_inflation_factor`

#### Scenario: Standard deduction indexed
- **WHEN** computing taxable income in simulation year N
- **THEN** the standard deduction SHALL be `STANDARD_DEDUCTION_MFJ * cumulative_inflation_factor`

#### Scenario: Year 0 unchanged
- **WHEN** it is the first simulation year (cumulative_inflation_factor = 1.0)
- **THEN** all thresholds equal the base 2024 values (no change from current behavior)

### Requirement: Threshold Inflation Utility
A utility function SHALL scale threshold structures by an inflation factor.

#### Scenario: Inflate bracket-style list
- **WHEN** `inflate_brackets(brackets, factor)` is called
- **THEN** each entry's `limit` field SHALL be multiplied by `factor`
- **AND** non-limit fields (rate, cost) SHALL be unchanged
- **AND** `float("inf")` limits SHALL remain `float("inf")`
