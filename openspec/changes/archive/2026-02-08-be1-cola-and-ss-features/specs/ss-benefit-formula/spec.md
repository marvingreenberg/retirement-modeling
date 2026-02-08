## ADDED Requirements

### Requirement: SS Actuarial Benefit Calculation

The system SHALL compute an adjusted Social Security annual benefit based on claiming age relative to Full Retirement Age (FRA).

#### Scenario: Claiming at FRA
- **WHEN** `claiming_age` equals `fra_age`
- **THEN** the adjusted benefit SHALL equal the `fra_amount` (no reduction or credit)

#### Scenario: Claiming before FRA within 36 months
- **WHEN** `claiming_age` is less than `fra_age`
- **AND** the difference is 36 months or fewer
- **THEN** the benefit SHALL be reduced by 5/9 of 1% per month early (6.67% per year)

#### Scenario: Claiming before FRA beyond 36 months
- **WHEN** `claiming_age` is less than `fra_age`
- **AND** the difference exceeds 36 months
- **THEN** the first 36 months of reduction SHALL use 5/9 of 1% per month
- **AND** additional months SHALL use 5/12 of 1% per month

#### Scenario: Claiming after FRA
- **WHEN** `claiming_age` is greater than `fra_age`
- **AND** `claiming_age` is 70 or less
- **THEN** the benefit SHALL increase by 2/3 of 1% per month delayed (8% per year)

#### Scenario: Claiming after age 70
- **WHEN** `claiming_age` exceeds 70
- **THEN** the benefit SHALL be capped at the age-70 amount (no additional delayed credits)

#### Scenario: FRA default
- **WHEN** `fra_age` is not specified
- **THEN** it SHALL default to 67

### Requirement: SS Auto-Generation from Profile

The system SHALL optionally auto-generate Social Security income streams from a profile configuration.

#### Scenario: SS auto config fields
- **WHEN** `ss_auto` is provided on `SimulationConfig`
- **THEN** it SHALL have: `primary_fra_amount` (float >= 0), `primary_start_age` (int 62-70), `spouse_fra_amount` (float >= 0, optional), `spouse_start_age` (int 62-70, optional), `fra_age` (int, default 67)

#### Scenario: Generate primary SS stream
- **WHEN** `ss_auto` is configured with `primary_fra_amount` and `primary_start_age`
- **THEN** the system SHALL generate an `IncomeStream` with:
  - `name`: "Social Security (primary)"
  - `amount`: actuarially adjusted annual benefit for `primary_start_age`
  - `start_age`: `primary_start_age`
  - `end_age`: None (lifetime)
  - `taxable_pct`: 0.85

#### Scenario: Generate spouse SS stream
- **WHEN** `ss_auto` includes `spouse_fra_amount` and `spouse_start_age`
- **THEN** the system SHALL generate an additional `IncomeStream` with:
  - `name`: "Social Security (spouse)"
  - `amount`: actuarially adjusted annual benefit for `spouse_start_age`
  - `start_age`: `spouse_start_age`
  - `end_age`: None
  - `taxable_pct`: 0.85

#### Scenario: No ss_auto configured
- **WHEN** `ss_auto` is None
- **THEN** the system SHALL not generate any SS income streams (existing `social_security` config is used as-is)

#### Scenario: ss_auto with existing social_security
- **WHEN** both `ss_auto` and `social_security` are provided
- **THEN** `ss_auto`-generated streams SHALL be used
- **AND** the legacy `social_security` SS income SHALL be skipped to avoid double-counting
