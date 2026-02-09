# Spending Strategies Specification

## Purpose
Define how the simulation calculates annual spending targets based on portfolio value, age, and inflation.

## Requirements

### Requirement: Fixed Dollar Strategy
The system SHALL use a fixed inflation-adjusted spending amount when the spending strategy is `fixed_dollar`.

#### Scenario: First year spending
- WHEN spending strategy is `fixed_dollar`
- AND it is the first simulation year
- THEN the spending target equals the configured `annual_spend_net`

#### Scenario: Subsequent year inflation adjustment
- WHEN spending strategy is `fixed_dollar`
- AND it is not the first simulation year
- THEN the spending target equals previous year's spending multiplied by `(1 + inflation_rate)`

---

### Requirement: Percent of Portfolio Strategy
The system SHALL withdraw a fixed percentage of current portfolio value when the spending strategy is `percent_of_portfolio`.

#### Scenario: Calculate percent-based spending
- WHEN spending strategy is `percent_of_portfolio`
- THEN the spending target equals `total_balance * withdrawal_rate`
- AND `withdrawal_rate` comes from `SimulationConfig.withdrawal_rate` (NOT from `guardrails_config`)
- AND the default withdrawal_rate is 4% (0.04)

#### Scenario: Spending varies with portfolio
- WHEN spending strategy is `percent_of_portfolio`
- AND portfolio value decreases
- THEN spending target decreases proportionally

---

### Requirement: Guardrails Strategy (Guyton-Klinger)
The system SHALL adjust spending based on withdrawal rate thresholds when the spending strategy is `guardrails`.

#### Scenario: First year initialization
- WHEN spending strategy is `guardrails`
- AND it is the first simulation year
- THEN spending equals `total_balance * initial_withdrawal_rate`
- AND initial_withdrawal_rate defaults to 5% (0.05)

#### Scenario: Withdrawal rate exceeds ceiling
- WHEN spending strategy is `guardrails`
- AND current withdrawal rate exceeds `ceiling_percent * initial_withdrawal_rate`
- THEN spending is reduced by `adjustment_percent` (default 10%)
- NOTE: ceiling_percent defaults to 1.20 (120% of initial rate)

#### Scenario: Withdrawal rate below floor
- WHEN spending strategy is `guardrails`
- AND current withdrawal rate is below `floor_percent * initial_withdrawal_rate`
- THEN spending is increased by `adjustment_percent` (default 10%)
- NOTE: floor_percent defaults to 0.80 (80% of initial rate)

#### Scenario: Withdrawal rate within guardrails
- WHEN spending strategy is `guardrails`
- AND current withdrawal rate is between floor and ceiling
- THEN spending equals previous year's spending adjusted for inflation

---

### Requirement: RMD-Based Strategy
The system SHALL use IRS RMD divisors to determine spending when the spending strategy is `rmd_based`.

#### Scenario: Before RMD age
- WHEN spending strategy is `rmd_based`
- AND primary owner age is less than 72
- THEN withdrawal rate is `1/30` (approximately 3.33%)

#### Scenario: At RMD age and beyond
- WHEN spending strategy is `rmd_based`
- AND primary owner age is 72 or older
- THEN withdrawal rate equals `1 / IRS_divisor_for_age`
- AND divisors decrease with age (e.g., age 73: 26.5, age 85: 16.0)

---

## Configuration

### GuardrailsConfig defaults
| Parameter | Default | Valid Range |
|-----------|---------|-------------|
| initial_withdrawal_rate | 0.05 | 0.01 - 0.15 |
| floor_percent | 0.80 | 0.50 - 1.00 |
| ceiling_percent | 1.20 | 1.00 - 2.00 |
| adjustment_percent | 0.10 | 0.01 - 0.25 |

---

### Requirement: Strategy Field Usage Metadata
The `/strategies` endpoint SHALL include field-usage metadata for each spending strategy.

#### Scenario: Strategy field metadata
- WHEN the client requests `/strategies`
- THEN each spending strategy entry SHALL include `uses_fields` and `ignores_fields` arrays
- AND `fixed_dollar` uses_fields: `["annual_spend_net"]`, ignores_fields: `["withdrawal_rate", "guardrails_config"]`
- AND `percent_of_portfolio` uses_fields: `["withdrawal_rate"]`, ignores_fields: `["annual_spend_net", "guardrails_config"]`
- AND `guardrails` uses_fields: `["guardrails_config"]`, ignores_fields: `["annual_spend_net", "withdrawal_rate"]`
- AND `rmd_based` uses_fields: `[]`, ignores_fields: `["annual_spend_net", "withdrawal_rate", "guardrails_config"]`

---

### Requirement: Withdrawal Rate Propagation
The `calculate_spending_target` function SHALL accept `withdrawal_rate` as a parameter for `percent_of_portfolio`.

#### Scenario: Withdrawal rate passed through
- WHEN strategy is `percent_of_portfolio`
- THEN `withdrawal_rate` from `SimulationConfig` SHALL be passed to `calculate_spending_target`
- AND `_percent_of_portfolio_spending` SHALL use this rate instead of reading from `guardrails_config`
