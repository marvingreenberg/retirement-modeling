## MODIFIED Requirements

### Requirement: Cash Flow Reconciliation
The system SHALL reconcile income against spending needs, using the taxable portion for withholding estimates.

#### Scenario: Income exceeds spending
- WHEN (SS_income + income_streams + RMD) net of taxes > spending_target
- THEN surplus_cash = income - spending
- AND surplus is deposited to the excess_income brokerage account

#### Scenario: Spending exceeds income
- WHEN spending_target > available income
- THEN remaining_spend = spending_target - income
- AND withdrawals are executed per withdrawal ordering spec

#### Scenario: Stream withholding on taxable portion only
- WHEN calculating cash from income streams
- THEN estimated tax SHALL be applied only to the taxable portion (`stream_taxable`)
- AND `cash_from_streams = stream_income - (stream_taxable * est_tax_rate)`
- AND a stream with `taxable_pct=0.5` and `amount=$10,000` at 22% marginal rate yields $10,000 - ($5,000 * 0.22) = $8,900

---

### Requirement: Tax Estimation for Withholding
The system SHALL use progressive tax calculation for conversion tax estimates.

#### Scenario: Estimate tax rate
- WHEN determining how much to withdraw from pre-tax
- THEN estimate marginal rate = federal_rate + state_rate
- AND gross_withdrawal = net_need / (1 - estimated_rate)

#### Scenario: Conversion tax uses incremental progressive calculation
- WHEN calculating the tax cost of a Roth conversion
- THEN conversion tax SHALL be computed as `calculate_income_tax(agi + conversion) - calculate_income_tax(agi)`
- AND this correctly handles conversions that span bracket boundaries

---

### Requirement: Year-by-Year Processing Order
The system SHALL process each simulation year in a specific sequence, using progressive tax calculations.

#### Scenario: Annual simulation sequence
- GIVEN a simulation year
- THEN processing occurs in this order:
  1. Calculate ages (primary and spouse)
  2. Determine growth/inflation rates (from config or Monte Carlo sequence)
  3. Calculate spending target (via spending strategy)
  4. Add planned expenses for this year
  5. Calculate Social Security income (if age threshold met)
  6. Calculate income from additional income streams (if owner's age threshold met), applying per-stream COLA
  7. Calculate and execute RMDs separately per owner (if age threshold met)
  8. Determine cash available vs. spending needed
  9. Execute withdrawals to meet spending shortfall
  10. Execute Roth conversions (if pre-RMD age and strategy permits)
  11. Reinvest surplus cash to excess_income account (if any)
  12. Calculate all taxes using progressive brackets
  13. Apply investment growth to all accounts (skip cash/CD)
  14. Record year results

#### Scenario: Tax thresholds adjusted each year
- WHEN processing a simulation year
- THEN the simulation SHALL compute `inflation_factor = cumulative_inflation` for that year
- AND pass inflation-adjusted brackets, IRMAA tiers, capital gains brackets, and standard deduction to all tax functions

#### Scenario: Tax regime override per year
- **WHEN** a `tax_regime_sequence` is provided to `run_simulation`
- **THEN** for each year, the regime dict SHALL provide the base brackets, cap gains brackets, standard deduction, and IRMAA tiers
- **AND** these base values SHALL be inflation-indexed using `inflate_brackets` and `cumulative_inflation` (layering with BE-3)
- **AND** when no regime sequence is provided, the 2024 constants SHALL be used as the base (unchanged behavior)

#### Scenario: Progressive income tax in simulation
- WHEN calculating final income tax for a simulation year
- THEN the system SHALL use `calculate_income_tax(taxable_income, adj_fed_brackets, state_rate)` for progressive bracket calculation
- AND SHALL NOT multiply taxable_income by a flat marginal rate

---

### Requirement: Simulation Configuration (UI Assembly)
The system SHALL process simulation configuration assembled from both Portfolio and Simulate tab inputs.

#### Scenario: Portfolio tab provides base data
- GIVEN a simulation request
- THEN the Portfolio object includes:
  - People & Timeline fields (ages, years, start_year)
  - Account balances and types
  - Social Security configuration
  - Annual spending amount and planned expenses

#### Scenario: Simulate tab provides assumptions
- GIVEN a simulation request
- THEN the Portfolio config also includes assumption fields set from the Simulate tab:
  - inflation_rate
  - investment_growth_rate
  - spending_strategy (and conditional params: withdrawal_rate, guardrails_config)
  - strategy_target (conversion strategy)
  - tax_rate_state
  - rmd_start_age
  - irmaa_limit_tier_1

#### Scenario: Single Portfolio object sent to API
- WHEN the UI submits a simulation request
- THEN the API receives a single `Portfolio` JSON containing both portfolio data and simulation assumptions

---

## ADDED Requirements

### Requirement: Income stream owner-based age gating
Income streams SHALL be gated by their owner's age, not always the primary's age.

#### Scenario: Primary-owned stream uses primary age
- WHEN an income stream has `owner: primary`
- AND `start_age: 65, end_age: 80`
- THEN the stream is active when `age_primary` is between 65 and 80

#### Scenario: Spouse-owned stream uses spouse age
- WHEN an income stream has `owner: spouse`
- AND `start_age: 67, end_age: 85`
- THEN the stream is active when `age_spouse` is between 67 and 85

#### Scenario: SS auto-generation tags owner
- WHEN `ss_auto` generates income streams
- THEN primary SS stream SHALL have `owner: primary`
- AND spouse SS stream SHALL have `owner: spouse`

#### Scenario: Default owner is primary
- WHEN an income stream has no explicit owner
- THEN it SHALL default to `owner: primary`
