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
The system SHALL execute Required Minimum Distributions regardless of other withdrawal needs.

#### Scenario: RMD before voluntary withdrawals
- WHEN the account owner has reached RMD age (73+)
- THEN RMDs are calculated and withdrawn BEFORE determining other spending needs
- AND RMD amount is added to AGI

#### Scenario: RMD satisfies spending
- WHEN RMD plus Social Security exceeds spending needs
- THEN surplus cash is reinvested in brokerage accounts

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

## Tax Impact Summary

| Account Type | Tax Treatment | Best Use Case |
|--------------|---------------|---------------|
| Brokerage | Gains taxed at 0%/15%/20% | First choice for spending |
| Roth | Completely tax-free | Second choice, preserves growth |
| Pre-tax | 100% taxed as ordinary income | Last resort for spending |
