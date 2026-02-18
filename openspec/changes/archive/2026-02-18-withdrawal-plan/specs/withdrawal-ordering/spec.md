## MODIFIED Requirements

### Requirement: Per-account withdrawal tracking
`WithdrawalResult` SHALL include a `per_account` dict mapping account IDs to withdrawal amounts. This provides visibility into which specific accounts were used for each withdrawal call.

#### Scenario: Single account withdrawal
- **WHEN** $50K is withdrawn from a single IRA account
- **THEN** `per_account` SHALL contain `{"ira_1": 50000}`

#### Scenario: Multi-account withdrawal
- **WHEN** $80K is needed from brokerage and two brokerage accounts have $50K and $100K
- **THEN** the first account is drained ($50K) and $30K is taken from the second
- **AND** `per_account` SHALL contain `{"brok_1": 50000, "brok_2": 30000}`
