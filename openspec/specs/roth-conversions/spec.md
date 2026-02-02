# Roth Conversion Specification

## Purpose
Define when and how much to convert from pre-tax (Traditional IRA/401k) accounts to Roth accounts to optimize long-term tax efficiency.

## Requirements

### Requirement: Conversion Ceiling by Strategy
The system SHALL determine the maximum AGI target based on the selected conversion strategy.

#### Scenario: Standard strategy (no conversions)
- WHEN conversion strategy is `standard`
- THEN conversion ceiling is $0
- AND no voluntary Roth conversions occur

#### Scenario: IRMAA Tier 1 strategy
- WHEN conversion strategy is `irmaa_tier_1`
- THEN conversion ceiling is the IRMAA Tier 1 threshold
- AND default threshold is $206,000 (married filing jointly)
- NOTE: Staying below this avoids Medicare premium surcharges

#### Scenario: 22% bracket strategy
- WHEN conversion strategy is `22_percent_bracket`
- THEN conversion ceiling is $201,050
- NOTE: This is the top of the 22% federal bracket for MFJ (2024)

#### Scenario: 24% bracket strategy
- WHEN conversion strategy is `24_percent_bracket`
- THEN conversion ceiling is $383,900
- NOTE: This is the top of the 24% federal bracket for MFJ (2024)

---

### Requirement: Conversion Timing
The system SHALL only perform conversions before RMD age begins.

#### Scenario: Before RMD age
- WHEN primary owner age is less than `rmd_start_age` (default 73)
- AND conversion ceiling is greater than 0
- THEN conversions may be executed

#### Scenario: At or after RMD age
- WHEN primary owner age is `rmd_start_age` or older
- THEN voluntary conversions are NOT performed
- NOTE: At RMD age, mandatory distributions take priority

---

### Requirement: Conversion Amount Calculation
The system SHALL convert up to the AGI headroom available.

#### Scenario: Calculate AGI headroom
- WHEN a conversion is being considered
- THEN agi_headroom = conversion_ceiling - current_agi

#### Scenario: Minimum conversion threshold
- WHEN agi_headroom is $5,000 or less
- THEN no conversion is performed
- NOTE: Small conversions aren't worth the complexity

#### Scenario: Execute conversion
- WHEN agi_headroom exceeds $5,000
- THEN conversion_amount = min(agi_headroom, available_pretax_balance)

---

### Requirement: Conversion Tax Payment
The system SHALL pay taxes on conversions from brokerage accounts when possible.

#### Scenario: Tax payment from brokerage
- WHEN a conversion is executed
- THEN tax_bill = conversion_amount × estimated_tax_rate
- AND tax is withdrawn from brokerage accounts first

#### Scenario: Insufficient brokerage for tax
- WHEN brokerage balance cannot cover the full tax bill
- THEN the unpaid tax is netted from the Roth deposit
- AND net_deposit = conversion_amount - unpaid_tax

#### Scenario: Full conversion flow
- WHEN executing a $50,000 conversion at 24% rate
- THEN $12,000 tax is withdrawn from brokerage
- AND $50,000 is withdrawn from pre-tax
- AND $50,000 is deposited to Roth
- AND AGI increases by $50,000 (plus any gains on tax payment withdrawal)

---

### Requirement: Conversion Order in Simulation
The system SHALL execute conversions after spending withdrawals but before year-end growth.

#### Scenario: Year-end sequence
- GIVEN a simulation year
- THEN execution order is:
  1. Calculate Social Security income
  2. Execute mandatory RMDs
  3. Withdraw for spending needs
  4. Execute Roth conversions (if applicable)
  5. Apply investment growth

---

## Strategy Selection Guide

| Strategy | AGI Ceiling | Best For |
|----------|-------------|----------|
| standard | $0 | Already in high bracket; need cash |
| irmaa_tier_1 | ~$206K | On Medicare; avoid surcharges |
| 22_percent_bracket | ~$201K | Moderate conversion; 22% is historically low |
| 24_percent_bracket | ~$384K | Large IRA; avoid future 32%+ rates |
