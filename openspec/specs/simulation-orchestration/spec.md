# Simulation Orchestration Specification

## Purpose
Define the year-by-year simulation loop that coordinates all retirement calculations.
## Requirements
### Requirement: Year-by-Year Processing Order
The system SHALL process each simulation year in a specific sequence.

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

### Requirement: Conversion Ceiling
The system SHALL compute the AGI ceiling for Roth conversions based on strategy, inflation-indexed.

#### Scenario: Inflation-adjusted conversion ceiling
- WHEN computing the Roth conversion AGI ceiling
- THEN bracket thresholds (383900 for 24%, 201050 for 22%) SHALL be multiplied by `cumulative_inflation_factor`
- AND the `irmaa_limit_tier_1` from config SHALL also be multiplied by `cumulative_inflation_factor`
- AND the `STANDARD` strategy ceiling (0) SHALL remain 0

---

### Requirement: Social Security Income
The system SHALL add Social Security income when age thresholds are met.

#### Scenario: Primary SS benefit
- WHEN primary owner age >= `primary_start_age`
- THEN add `primary_benefit` to annual income

#### Scenario: Spouse SS benefit
- WHEN spouse age >= `spouse_start_age`
- THEN add `spouse_benefit` to annual income

#### Scenario: SS not yet started
- WHEN owner has not reached start age
- THEN SS benefit is $0 for that person

---

### Requirement: Planned Expenses
The system SHALL incorporate planned one-time and recurring expenses.

#### Scenario: One-time expense
- WHEN a planned expense has `expense_type: one_time`
- AND current year matches `expense.year`
- THEN add expense amount to spending target

#### Scenario: Recurring expense by age
- WHEN a planned expense has `expense_type: recurring`
- AND primary age is between `start_age` and `end_age`
- THEN add expense amount to spending target

#### Scenario: Inflation-adjusted expenses
- WHEN `inflation_adjusted: true` on an expense
- THEN multiply expense amount by cumulative inflation factor

---

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

### Requirement: Year-End Growth Application
The system SHALL apply investment returns after all transactions.

#### Scenario: Apply growth
- WHEN all withdrawals and deposits are complete
- THEN each account balance *= (1 + growth_rate)
- AND growth rate comes from config or Monte Carlo sequence

---

### Requirement: Result Recording
The system SHALL record detailed results for each year.

#### Scenario: Captured metrics
- WHEN a year completes
- THEN record:
  - Year and ages
  - AGI and tax bracket
  - RMD amount
  - Surplus or shortfall
  - Roth conversion amount and tax
  - Withdrawals by account type
  - Total tax and IRMAA
  - Total balance
  - Spending target
  - Balances by account type (pretax, roth, brokerage)

---

### Requirement: YearResult includes withdrawal details
`YearResult` SHALL include a `withdrawal_details` list of per-account withdrawal records, each containing account_id, account_name, amount, and purpose ("rmd", "spending", or "conversion").

#### Scenario: Year with RMD and spending withdrawals
- **WHEN** a year includes $20K RMD from IRA and $30K spending from brokerage
- **THEN** `withdrawal_details` SHALL contain two entries: one with purpose "rmd" and one with purpose "spending"

#### Scenario: Year with Roth conversion
- **WHEN** $50K is converted from IRA to Roth
- **THEN** `withdrawal_details` SHALL include an entry with purpose "conversion", account_id of the source IRA, and amount $50K

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

## Simulation Configuration

### Required Inputs
| Field | Description |
|-------|-------------|
| current_age_primary | Starting age of primary owner |
| current_age_spouse | Starting age of spouse |
| simulation_years | Number of years to simulate (default 30) |
| start_year | Calendar year simulation begins |
| annual_spend_net | Target annual spending |
| social_security | SS benefits and start ages |
| accounts | List of investment accounts |

### Optional Inputs with Defaults
| Field | Default | Description |
|-------|---------|-------------|
| inflation_rate | 3% | Annual inflation assumption |
| investment_growth_rate | 6% | Annual return assumption |
| strategy_target | irmaa_tier_1 | Roth conversion strategy |
| spending_strategy | fixed_dollar | Spending calculation method |
| withdrawal_rate | 4% | For percent_of_portfolio strategy |
| rmd_start_age | 73 | Per SECURE 2.0 Act |
| tax_rate_state | 5.75% | State income tax rate |

---

### Requirement: SS Auto-Generation at Simulation Start

The system SHALL materialize auto-generated SS income streams before the simulation loop begins.

#### Scenario: ss_auto present
- **WHEN** `SimulationConfig.ss_auto` is set
- **THEN** the system SHALL call `generate_ss_streams(ss_auto)` to produce SS `IncomeStream` entries
- **AND** prepend them to the working copy of `income_streams`
- **AND** skip legacy `social_security` income in the per-year SS block

#### Scenario: ss_auto absent
- **WHEN** `SimulationConfig.ss_auto` is None
- **THEN** the simulation SHALL use the existing `social_security` config for SS income (no change)

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

---

### Requirement: COLA Application in Income Stream Loop

The system SHALL apply per-stream COLA when calculating income stream contributions each year.

#### Scenario: Stream with COLA
- **WHEN** an active income stream has `cola_rate` set
- **THEN** effective amount SHALL be `amount * (1 + cola_rate) ^ (current_age - start_age)`

#### Scenario: Stream without COLA
- **WHEN** an active income stream has `cola_rate` as None
- **THEN** effective amount SHALL be the base `amount`

### Requirement: Early Termination on Fund Exhaustion

The system SHALL stop the simulation loop after all account balances reach zero.

#### Scenario: Portfolio depletes mid-simulation
- **WHEN** total balance across all accounts is <= 0 after applying year-end growth
- **THEN** the system SHALL record the current year's results
- **AND** terminate the simulation loop (no further years processed)

#### Scenario: Portfolio never depletes
- **WHEN** total balance remains > 0 for all simulation years
- **THEN** the simulation SHALL run for the full `simulation_years` duration (no change)

#### Scenario: Result array length
- **WHEN** depletion occurs at year N of a simulation configured for M years
- **THEN** the results array SHALL contain N entries (fewer than M)

### Requirement: Initial Spending in Simulation Summary
The API SHALL include the effective initial spending amounts in the simulation summary response.

#### Scenario: Summary includes initial spending
- **WHEN** a simulation completes successfully
- **THEN** the summary dict SHALL include `initial_annual_spend` equal to `years[0].spending_target`
- **AND** the summary dict SHALL include `initial_monthly_spend` equal to `years[0].spending_target / 12`

#### Scenario: Empty results
- **WHEN** a simulation produces no year results
- **THEN** `initial_annual_spend` and `initial_monthly_spend` SHALL be 0

### Requirement: Monthly Spend Convenience Property
`SimulationConfig` SHALL provide a `monthly_spend` computed property.

#### Scenario: Compute monthly from annual
- **WHEN** `SimulationConfig.monthly_spend` is accessed
- **THEN** it SHALL return `annual_spend_net / 12`

### Requirement: Tax Regime Configuration
The system SHALL support an optional flag to enable tax regime variation in Monte Carlo.

#### Scenario: Config field
- **WHEN** `SimulationConfig` is defined
- **THEN** it SHALL include `vary_tax_regimes: bool` with default `False`

#### Scenario: Deterministic simulation unaffected
- **WHEN** running a deterministic simulation (not Monte Carlo)
- **THEN** `vary_tax_regimes` SHALL have no effect
- **AND** the simulation SHALL use 2024 constants as the base brackets

---

### Requirement: API Version Alignment
The API SHALL be versioned under the `/api/v1/` prefix.

#### Scenario: Versioned route prefix
- **WHEN** the API starts
- **THEN** all simulation endpoints SHALL be available under `/api/v1/`
- **AND** `/api/v1/simulate`, `/api/v1/monte-carlo`, `/api/v1/compare`, `/api/v1/strategies` SHALL be the canonical routes

#### Scenario: Root health check
- **WHEN** a request hits `/`
- **THEN** if static assets are mounted, the SPA SHALL be served
- **AND** if no static assets, a JSON health/info response SHALL be returned

#### Scenario: Version reporting
- **WHEN** the `/api/v1/status` or `/api/v1/` endpoint is called
- **THEN** the response SHALL include a `version` field
- **AND** the version SHALL be derived dynamically from `setuptools-scm` git tags

#### Scenario: Backward-compatible redirects
- **WHEN** a request hits an old unversioned route (e.g., `/simulate`)
- **THEN** the API SHALL redirect to the versioned equivalent (`/api/v1/simulate`)
- **AND** these redirects are temporary and may be removed in future versions
