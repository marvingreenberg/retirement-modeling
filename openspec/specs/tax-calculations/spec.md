# Tax Calculations Specification

## Purpose
Define how the simulation calculates various taxes including federal income tax, capital gains, IRMAA surcharges, and Required Minimum Distributions.
## Requirements
### Requirement: Federal Income Tax Brackets
The system SHALL calculate federal income tax using progressive brackets.

#### Scenario: Marginal rate lookup
- WHEN determining tax rate for a given income level
- THEN the system returns the marginal rate for that income
- AND brackets for MFJ (2024) are:
  - $0 - $23,200: 10%
  - $23,201 - $94,300: 12%
  - $94,301 - $201,050: 22%
  - $201,051 - $383,900: 24%
  - $383,901 - $487,450: 32%
  - $487,451 - $731,200: 35%
  - $731,201+: 37%

#### Scenario: Progressive tax calculation
- WHEN calculating total tax on taxable income
- THEN each bracket is applied only to income within that bracket
- EXAMPLE: $100,000 taxable income = $2,320 (10%) + $8,532 (12%) + $1,254 (22%) = $12,106

---

### Requirement: Capital Gains Tax
The system SHALL apply tiered long-term capital gains rates.

#### Scenario: 0% capital gains rate
- WHEN total income is below $89,250 (MFJ)
- THEN capital gains are taxed at 0%

#### Scenario: 15% capital gains rate
- WHEN total income is between $89,250 and $553,850 (MFJ)
- THEN capital gains are taxed at 15%

#### Scenario: 20% capital gains rate
- WHEN total income exceeds $553,850 (MFJ)
- THEN capital gains are taxed at 20%

#### Scenario: Flat rate override
- WHEN a flat `tax_rate_capital_gains` is configured
- THEN that rate is used instead of tiered calculation
- NOTE: Default flat rate is 15%

---

### Requirement: IRMAA Medicare Surcharges
The system SHALL calculate IRMAA costs based on AGI thresholds.

#### Scenario: Below IRMAA threshold
- WHEN AGI is $206,000 or less (MFJ)
- THEN IRMAA cost is $0

#### Scenario: IRMAA tier thresholds
- WHEN AGI exceeds thresholds
- THEN annual IRMAA costs are:
  - $206,001 - $258,000: $1,600/year
  - $258,001 - $322,000: $4,000/year
  - $322,001 - $386,000: $6,400/year
  - $386,001 - $750,000: $8,800/year
  - $750,001+: $11,200/year

#### Scenario: IRMAA lookback
- WHEN calculating IRMAA
- NOTE: In practice, IRMAA uses income from 2 years prior
- NOTE: The simulation uses current-year AGI as a simplification

---

### Requirement: Required Minimum Distributions
The system SHALL calculate RMDs using the IRS Uniform Lifetime Table.

#### Scenario: Before RMD age
- WHEN owner age is less than `rmd_start_age` (default 73)
- THEN RMD amount is $0

#### Scenario: Calculate RMD amount
- WHEN owner age is `rmd_start_age` or older
- THEN RMD = pretax_balance / divisor_for_age
- AND divisors from IRS table include:
  - Age 73: 26.5 → ~3.77%
  - Age 75: 24.6 → ~4.07%
  - Age 80: 20.2 → ~4.95%
  - Age 85: 16.0 → ~6.25%
  - Age 90: 12.2 → ~8.20%
  - Age 95: 8.9 → ~11.24%

#### Scenario: RMD for each spouse
- WHEN both primary and spouse have pre-tax accounts
- THEN RMDs are calculated separately for each
- AND total RMD = primary_rmd + spouse_rmd

---

### Requirement: Social Security Taxability
The system SHALL apply 85% taxability to Social Security income.

#### Scenario: SS income in AGI
- WHEN Social Security benefits are received
- THEN 85% of benefits are included in AGI
- NOTE: This is a simplification; actual rules have 0%/50%/85% tiers

#### Scenario: Full taxability calculation (future enhancement)
- WHEN combined income ≤ $32,000 (MFJ)
- THEN 0% of SS is taxable
- WHEN combined income $32,001 - $44,000
- THEN up to 50% is taxable
- WHEN combined income > $44,000
- THEN up to 85% is taxable

#### Scenario: Income streams in AGI
- WHEN income streams are active
- THEN `amount * taxable_pct` for each stream is added to AGI
- AND this is added alongside SS taxable income before RMD and other components

### Requirement: State Tax
The system SHALL apply a flat state tax rate.

#### Scenario: State tax calculation
- WHEN calculating total tax
- THEN state_tax = taxable_income × state_rate
- AND default state_rate is 5.75%

---

### Requirement: Inflation-Indexed Tax Thresholds
All dollar-denominated tax thresholds SHALL be adjusted by cumulative inflation each simulation year.

#### Scenario: Federal bracket limits indexed
- WHEN computing federal income tax in simulation year N
- THEN each bracket limit SHALL be `base_limit * cumulative_inflation_factor`
- AND base limits are the 2024 MFJ constants
- AND rates are unchanged (only limits are indexed)

#### Scenario: IRMAA tier thresholds indexed
- WHEN computing IRMAA cost in simulation year N
- THEN each tier limit SHALL be `base_limit * cumulative_inflation_factor`

#### Scenario: Capital gains bracket thresholds indexed
- WHEN computing capital gains tax in simulation year N
- THEN each bracket limit SHALL be `base_limit * cumulative_inflation_factor`

#### Scenario: Standard deduction indexed
- WHEN computing taxable income in simulation year N
- THEN the standard deduction SHALL be `STANDARD_DEDUCTION_MFJ * cumulative_inflation_factor`

#### Scenario: Year 0 unchanged
- WHEN it is the first simulation year (cumulative_inflation_factor = 1.0)
- THEN all thresholds equal the base 2024 values (no change from current behavior)

---

### Requirement: Threshold Inflation Utility
A utility function SHALL scale threshold structures by an inflation factor.

#### Scenario: Inflate bracket-style list
- WHEN `inflate_brackets(brackets, factor)` is called
- THEN each entry's `limit` field SHALL be multiplied by `factor`
- AND non-limit fields (rate, cost) SHALL be unchanged
- AND `float("inf")` limits SHALL remain `float("inf")`

---

## Tax Calculation Sequence

For each simulation year:
1. Start with Social Security income × 0.85
2. Add RMD amounts
3. Add voluntary pre-tax withdrawals
4. Add capital gains from brokerage withdrawals
5. Add Roth conversion amounts
6. Subtract standard deduction ($29,200 MFJ)
7. Calculate federal + state income tax
8. Calculate capital gains tax separately
9. Calculate IRMAA surcharge
10. Total tax = income_tax + capital_gains_tax + irmaa
