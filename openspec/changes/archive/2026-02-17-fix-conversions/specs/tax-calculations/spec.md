## MODIFIED Requirements

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
