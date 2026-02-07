## MODIFIED Requirements

### Requirement: Simulation Configuration
The system SHALL process simulation configuration assembled from both Portfolio and Simulate tab inputs.

#### Scenario: Portfolio tab provides base data
- GIVEN a simulation request
- THEN the Portfolio object includes:
  - People & Timeline fields (ages, years, start_year)
  - Account balances and types
  - Social Security configuration
  - Annual spending amount and planned expenses

#### Scenario: Simulate tab provides assumption overrides
- GIVEN a simulation request
- THEN the Portfolio config also includes assumption fields set from the Simulate tab:
  - inflation_rate
  - investment_growth_rate
  - spending_strategy (and conditional params: withdrawal_rate, guardrails_config)
  - strategy_target (conversion strategy)
  - tax_rate_state
  - tax_rate_capital_gains
  - rmd_start_age
  - irmaa_limit_tier_1

#### Scenario: API contract unchanged
- WHEN the UI submits a simulation request
- THEN the API receives the same `Portfolio` JSON structure as before
- AND no backend API changes are required
