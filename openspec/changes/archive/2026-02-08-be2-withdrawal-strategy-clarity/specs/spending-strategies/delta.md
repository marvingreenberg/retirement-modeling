## MODIFIED Requirements

### Requirement: Percent of Portfolio Strategy (MODIFIED)

#### Scenario: Calculate percent-based spending (MODIFIED)
- **WHEN** spending strategy is `percent_of_portfolio`
- **THEN** the spending target equals `total_balance * withdrawal_rate`
- **AND** `withdrawal_rate` comes from `SimulationConfig.withdrawal_rate` (NOT from `guardrails_config`)
- **AND** the default `withdrawal_rate` is 4% (0.04)

---

## ADDED Requirements

### Requirement: Strategy Field Usage Metadata
The `/strategies` endpoint SHALL include field-usage metadata for each spending strategy.

#### Scenario: Strategy field metadata
- **WHEN** the client requests `/strategies`
- **THEN** each spending strategy entry SHALL include `uses_fields` and `ignores_fields` arrays
- **AND** `fixed_dollar` uses_fields: `["annual_spend_net"]`, ignores_fields: `["withdrawal_rate", "guardrails_config"]`
- **AND** `percent_of_portfolio` uses_fields: `["withdrawal_rate"]`, ignores_fields: `["annual_spend_net", "guardrails_config"]`
- **AND** `guardrails` uses_fields: `["guardrails_config"]`, ignores_fields: `["annual_spend_net", "withdrawal_rate"]`
- **AND** `rmd_based` uses_fields: `[]`, ignores_fields: `["annual_spend_net", "withdrawal_rate", "guardrails_config"]`

### Requirement: Withdrawal Rate Propagation
The `calculate_spending_target` function SHALL accept `withdrawal_rate` as a parameter for `percent_of_portfolio`.

#### Scenario: Withdrawal rate passed through
- **WHEN** strategy is `percent_of_portfolio`
- **THEN** `withdrawal_rate` from `SimulationConfig` SHALL be passed to `calculate_spending_target`
- **AND** `_percent_of_portfolio_spending` SHALL use this rate instead of reading from `guardrails_config`
