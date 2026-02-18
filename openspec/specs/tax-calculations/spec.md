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
The system SHALL apply tiered long-term capital gains rates progressively, stacking gains on top of ordinary income.

#### Scenario: 0% capital gains rate
- WHEN total income (ordinary + gains) is below $89,250 (MFJ)
- THEN capital gains are taxed at 0%

#### Scenario: 15% capital gains rate
- WHEN total income is between $89,250 and $553,850 (MFJ)
- THEN capital gains in that range are taxed at 15%

#### Scenario: 20% capital gains rate
- WHEN total income exceeds $553,850 (MFJ)
- THEN capital gains in that range are taxed at 20%

#### Scenario: Progressive stacking across brackets
- WHEN ordinary income is $80,000 and capital gains are $50,000
- THEN gains from $80,000 to $89,250 ($9,250) are taxed at 0%
- AND gains from $89,250 to $130,000 ($40,750) are taxed at 15%
- AND total cap gains tax = $0 + $6,112.50 = $6,112.50

#### Scenario: No flat rate override
- WHEN calculating capital gains tax
- THEN the system SHALL always use tiered progressive brackets
- AND there is no flat rate override option

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
The system SHALL calculate the taxable portion of Social Security benefits using IRS provisional income rules.

#### Scenario: SS taxability based on combined income
- WHEN Social Security benefits are received
- THEN the taxable portion SHALL be computed using `calculate_ss_taxable_portion()`
- AND the calculation uses combined income (half SS + other income) against MFJ thresholds

#### Scenario: Low income — 0% taxable
- WHEN combined income is $32,000 or less (MFJ)
- THEN 0% of SS benefits are included in AGI

#### Scenario: Mid income — up to 50% taxable
- WHEN combined income is between $32,001 and $44,000 (MFJ)
- THEN up to 50% of SS benefits are included in AGI

#### Scenario: High income — up to 85% taxable
- WHEN combined income exceeds $44,000 (MFJ)
- THEN up to 85% of SS benefits are included in AGI

#### Scenario: Income streams in AGI
- WHEN income streams are active
- THEN `amount * taxable_pct` for each stream is added to AGI
- AND this is added alongside SS taxable income before RMD and other components

### Requirement: Bracket label accuracy
The system SHALL return the correct tax bracket label for all income levels, including the 10% bracket.

#### Scenario: Income in 10% bracket
- WHEN taxable income is between $0 and $23,200
- THEN the bracket label SHALL be "10%"

#### Scenario: Income in 12% bracket
- WHEN taxable income is between $23,201 and $94,300
- THEN the bracket label SHALL be "12%"

---

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

### Requirement: Cash/CD account tax treatment
Cash/CD accounts (`cash_cd` type) SHALL have 0% taxable withdrawals — withdrawals are return of principal with no income tax or capital gains tax impact. The `cost_basis_ratio` for cash_cd accounts is always 1.0.

#### Scenario: Cash withdrawal has no tax impact
- **WHEN** the user withdraws $50K from a cash_cd account
- **THEN** $0 is added to AGI and $0 capital gains tax is assessed

### Requirement: Account type to tax category mapping
All tax calculations SHALL use a `tax_category()` function to determine how an account type is taxed, rather than checking individual account type values. The mapping:
- **pretax**: `ira`, `sep_ira`, `simple_ira`, `401k`, `403b`, `457b` — withdrawals taxed as ordinary income
- **roth**: `roth_ira`, `roth_401k`, `roth_conversion` — qualified withdrawals tax-free
- **brokerage**: `brokerage` — gains taxed at capital gains rates
- **cash**: `cash_cd` — withdrawals tax-free (return of principal)

#### Scenario: IRA withdrawal taxed as ordinary income
- **WHEN** $40K is withdrawn from an IRA account
- **THEN** $40K is added to AGI as ordinary income

#### Scenario: Brokerage withdrawal taxed at capital gains rate
- **WHEN** $40K is withdrawn from a brokerage account with 40% cost basis
- **THEN** $24K gain is taxed at long-term capital gains rates (not ordinary income)

---

## Tax Calculation Sequence

For each simulation year:
1. Start with Social Security taxable portion (IRS tiered: 0%/50%/85%)
2. Add RMD amounts
3. Add voluntary pre-tax withdrawals
4. Add capital gains from brokerage withdrawals
5. Add Roth conversion amounts
6. Subtract standard deduction ($29,200 MFJ)
7. Calculate federal + state income tax
8. Calculate capital gains tax separately
9. Calculate IRMAA surcharge
10. Total tax = income_tax + capital_gains_tax + irmaa
