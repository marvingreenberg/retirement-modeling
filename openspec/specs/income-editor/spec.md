## Requirements

### Requirement: Social Security auto-generation inputs
The income editor SHALL provide inputs for SS auto-generation: primary FRA benefit amount, primary claiming age, and optionally spouse FRA benefit and claiming age. These bind to the `ss_auto` config field.

#### Scenario: Primary SS fields visible
- **WHEN** the income editor is displayed
- **THEN** inputs for Primary FRA Benefit and Primary Start Age are visible

#### Scenario: Spouse SS fields visible when spouse exists
- **WHEN** the portfolio has a spouse (current_age_spouse > 0)
- **THEN** inputs for Spouse FRA Benefit and Spouse Start Age are visible

#### Scenario: Spouse SS fields hidden when no spouse
- **WHEN** the portfolio has no spouse (current_age_spouse === 0)
- **THEN** Spouse FRA Benefit and Spouse Start Age inputs are hidden

### Requirement: Income streams list
The income editor SHALL display a list of generic income streams with add/remove controls. Each stream has: name, amount, start age, optional end age, optional COLA rate, and taxable percentage.

#### Scenario: Add income stream
- **WHEN** the user clicks "Add Income"
- **THEN** a new income stream row appears with default values (amount 0, start age 65, taxable 100%)

#### Scenario: Remove income stream
- **WHEN** the user clicks remove on an income stream
- **THEN** that stream is removed from the list

#### Scenario: Income stream fields
- **WHEN** an income stream row is displayed
- **THEN** it shows editable fields for name, amount, start age, end age, COLA rate, and taxable %

### Requirement: Income data model
The frontend types SHALL include `IncomeStream` and `SSAutoConfig` interfaces matching the backend models, with corresponding Zod validation schemas.

#### Scenario: IncomeStream type matches backend
- **WHEN** an income stream is serialized to JSON
- **THEN** it contains name (string), amount (number >= 0), start_age (int >= 0), end_age (int | null), taxable_pct (0-1), cola_rate (number | null)

#### Scenario: SSAutoConfig type matches backend
- **WHEN** SS auto config is serialized to JSON
- **THEN** it contains primary_fra_amount (number >= 0), primary_start_age (int 62-70), optional spouse_fra_amount, optional spouse_start_age, fra_age (int 62-70, default 67)
