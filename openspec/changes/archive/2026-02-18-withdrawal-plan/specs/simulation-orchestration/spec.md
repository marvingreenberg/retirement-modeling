## MODIFIED Requirements

### Requirement: YearResult includes withdrawal details
`YearResult` SHALL include a `withdrawal_details` list of per-account withdrawal records, each containing account_id, account_name, amount, and purpose ("rmd", "spending", or "conversion").

#### Scenario: Year with RMD and spending withdrawals
- **WHEN** a year includes $20K RMD from IRA and $30K spending from brokerage
- **THEN** `withdrawal_details` SHALL contain two entries: one with purpose "rmd" and one with purpose "spending"

#### Scenario: Year with Roth conversion
- **WHEN** $50K is converted from IRA to Roth
- **THEN** `withdrawal_details` SHALL include an entry with purpose "conversion", account_id of the source IRA, and amount $50K
