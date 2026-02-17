## MODIFIED Requirements

### Requirement: Withdrawal priority uses tax categories
The withdrawal ordering logic SHALL use `tax_category()` to group accounts rather than matching individual account type values. The priority order remains: brokerage-category first (includes `brokerage` and `cash_cd`), then roth-category (`roth_ira`, `roth_401k`, `roth_conversion`), then pretax-category (`ira`, `sep_ira`, `simple_ira`, `401k`, `403b`, `457b`). Cash/CD accounts within the brokerage category are withdrawn before brokerage accounts (no tax impact).

#### Scenario: Cash withdrawn before brokerage
- **WHEN** spending requires $80K and user has $50K cash_cd and $200K brokerage
- **THEN** the $50K cash_cd is fully withdrawn first (no tax), then $30K from brokerage (with capital gains)

#### Scenario: Multiple pre-tax types in withdrawal
- **WHEN** spending falls through to pre-tax and user has both IRA ($100K) and 401k ($200K)
- **THEN** both are eligible for withdrawal in the pretax category, drained sequentially

### Requirement: RMD from all pre-tax account types
Required Minimum Distributions SHALL be calculated from the aggregate balance of ALL pretax-category accounts (`ira`, `sep_ira`, `simple_ira`, `401k`, `403b`, `457b`), not just accounts with a specific type value.

#### Scenario: RMD includes 401k and IRA
- **WHEN** the user is age 73 with an IRA ($200K) and a 401k ($300K)
- **THEN** RMD is calculated on the combined $500K pretax balance
