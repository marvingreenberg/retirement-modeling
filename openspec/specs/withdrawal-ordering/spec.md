# Withdrawal Ordering Specification

## Purpose
Define the priority order for withdrawing funds from different account types to meet spending needs while minimizing tax impact.

## Requirements

### Requirement: Standard Withdrawal Priority
The system SHALL withdraw from account types in a specific order to minimize taxes, using `tax_category()` to group accounts rather than matching individual account type values.

#### Scenario: Basic withdrawal order
- WHEN the user needs to withdraw funds for spending
- THEN the system withdraws in this order:
  1. Cash/CD accounts (tax-free, return of principal)
  2. Brokerage accounts (taxable gains only)
  3. Roth accounts (tax-free)
  4. Pre-tax accounts (fully taxable)

#### Scenario: Cash withdrawn before brokerage
- **WHEN** spending requires $80K and user has $50K cash_cd and $200K brokerage
- **THEN** the $50K cash_cd is fully withdrawn first (no tax), then $30K from brokerage (with capital gains)

#### Scenario: Multiple pre-tax types in withdrawal
- **WHEN** spending falls through to pre-tax and user has both IRA ($100K) and 401k ($200K)
- **THEN** both are eligible for withdrawal in the pretax category, drained sequentially

#### Scenario: Brokerage first rationale
- WHEN withdrawing from brokerage accounts
- THEN only capital gains are taxed (often at favorable 0%/15%/20% rates)
- AND cost basis is recovered tax-free

#### Scenario: Roth second rationale
- WHEN withdrawing from Roth accounts
- THEN withdrawals are completely tax-free
- BUT tax-free growth potential is sacrificed

#### Scenario: Pre-tax last rationale
- WHEN withdrawing from pre-tax accounts
- THEN entire withdrawal is taxed as ordinary income
- AND may push AGI into higher brackets or trigger IRMAA

---

### Requirement: AGI Headroom Constraint
The system SHALL limit brokerage withdrawals when Roth conversions are planned.

#### Scenario: Conversion strategy active
- WHEN a conversion strategy other than `standard` is active
- AND the conversion ceiling is not yet reached
- THEN brokerage withdrawals are limited to preserve AGI headroom
- AND the formula is: `max_brokerage = agi_headroom / 0.75`

#### Scenario: No conversion strategy
- WHEN conversion strategy is `standard`
- THEN brokerage withdrawals are not limited by AGI headroom

---

### Requirement: RMD Takes Priority
The system SHALL execute Required Minimum Distributions separately per account owner.

#### Scenario: RMD before voluntary withdrawals
- WHEN the account owner has reached RMD age (73+)
- THEN RMDs are calculated and withdrawn BEFORE determining other spending needs
- AND RMD amount is added to AGI

#### Scenario: RMD satisfies spending
- WHEN RMD plus Social Security exceeds spending needs
- THEN surplus cash is deposited to the excess_income brokerage account

#### Scenario: RMD separated by owner
- WHEN both primary and spouse have pre-tax accounts requiring RMDs
- THEN RMDs SHALL be withdrawn separately per owner
- AND primary's RMD SHALL only be withdrawn from primary's pre-tax accounts
- AND spouse's RMD SHALL only be withdrawn from spouse's pre-tax accounts

#### Scenario: No cross-owner RMD contamination
- WHEN primary has $500K pre-tax and spouse has $100K pre-tax
- AND primary's RMD is $18,868 and spouse's RMD is $3,774
- THEN primary's accounts are reduced by $18,868
- AND spouse's accounts are reduced by $3,774
- AND no withdrawal from spouse's accounts satisfies primary's RMD

---

### Requirement: Account Age Restrictions
The system SHALL respect account-level age restrictions on withdrawals.

#### Scenario: Account not yet available
- WHEN an account has `available_at_age` set
- AND the owner has not reached that age
- THEN the account is skipped in withdrawal ordering

#### Scenario: Account becomes available
- WHEN the owner reaches the account's `available_at_age`
- THEN the account becomes eligible for withdrawals

---

### Requirement: Multi-Account Withdrawal
The system SHALL withdraw proportionally from multiple accounts of the same type.

#### Scenario: Multiple brokerage accounts
- WHEN multiple brokerage accounts exist
- AND brokerage withdrawals are needed
- THEN accounts are drained sequentially until spending is met
- AND weighted average cost basis is tracked for tax purposes

---

### Requirement: RMD from all pre-tax account types
Required Minimum Distributions SHALL be calculated from the aggregate balance of ALL pretax-category accounts (`ira`, `sep_ira`, `simple_ira`, `401k`, `403b`, `457b`), not just accounts with a specific type value.

#### Scenario: RMD includes 401k and IRA
- **WHEN** the user is age 73 with an IRA ($200K) and a 401k ($300K)
- **THEN** RMD is calculated on the combined $500K pretax balance

---

### Requirement: Absolute cost basis tracking
The system SHALL track cost basis as an absolute dollar amount on brokerage accounts and update it on growth, deposits, and withdrawals.

#### Scenario: Cost basis initialization
- WHEN the simulation begins
- THEN each brokerage account's absolute cost basis SHALL be computed as `balance * cost_basis_ratio`

#### Scenario: Cost basis unchanged on growth
- WHEN a brokerage account grows from $100K to $110K
- AND cost basis was $40K
- THEN cost basis remains $40K
- AND effective ratio becomes $40K / $110K = 0.364

#### Scenario: Cost basis increases on deposit
- WHEN $20K surplus cash is deposited to a brokerage account with $100K balance and $40K basis
- THEN cost basis becomes $60K ($40K + $20K)
- AND balance becomes $120K
- AND effective ratio becomes $60K / $120K = 0.50

#### Scenario: Cost basis decreases proportionally on withdrawal
- WHEN $25K is withdrawn from a brokerage account with $100K balance and $40K basis
- THEN the ratio at withdrawal is 0.40
- AND basis decreases by $25K * 0.40 = $10K
- AND remaining basis = $30K on $75K balance

---

### Requirement: Cash/CD accounts skip growth
Cash/CD accounts SHALL NOT have investment growth applied. Their balance remains flat year over year.

#### Scenario: Cash account in growth step
- WHEN `apply_growth()` processes accounts
- AND an account has type `cash_cd`
- THEN that account's balance SHALL remain unchanged
- AND the growth rate SHALL NOT be applied

#### Scenario: Other accounts still grow
- WHEN `apply_growth()` processes accounts
- AND an account is not `cash_cd`
- THEN the growth rate SHALL be applied normally

---

### Requirement: Excess income account
Surplus cash (income exceeding spending) SHALL be deposited to a dedicated excess_income brokerage account with proper cost basis tracking.

#### Scenario: Surplus deposited to excess_income account
- WHEN income (SS + streams + RMD) exceeds spending target after estimated tax
- THEN the surplus SHALL be deposited to a brokerage account named "Excess Income"
- AND the account owner SHALL be JOINT if a spouse exists, PRIMARY otherwise
- AND the cost_basis_ratio SHALL be 1.0 (100% basis, since deposits are already-taxed income)

#### Scenario: Repeated surplus deposits
- WHEN surplus cash is deposited across multiple years
- THEN each deposit adds to the same excess_income account's balance and cost basis
- AND cost basis tracks correctly (each deposit is 100% basis)

---

## Tax Impact Summary

| Account Type | Tax Treatment | Best Use Case |
|--------------|---------------|---------------|
| Brokerage | Gains taxed at 0%/15%/20% | First choice for spending |
| Roth | Completely tax-free | Second choice, preserves growth |
| Pre-tax | 100% taxed as ordinary income | Last resort for spending |
