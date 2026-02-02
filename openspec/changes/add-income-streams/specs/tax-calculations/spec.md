## MODIFIED Requirements

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
