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
  6. Calculate and execute RMDs (if age threshold met)
  7. Determine cash available vs. spending needed
  8. Execute withdrawals to meet spending shortfall
  9. Execute Roth conversions (if pre-RMD age and strategy permits)
  10. Reinvest surplus cash (if any)
  11. Calculate all taxes
  12. Apply investment growth to all accounts
  13. Record year results

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
The system SHALL reconcile income against spending needs.

#### Scenario: Income exceeds spending
- WHEN (SS_income + RMD) net of taxes > spending_target
- THEN surplus_cash = income - spending
- AND surplus is deposited to brokerage

#### Scenario: Spending exceeds income
- WHEN spending_target > available income
- THEN remaining_spend = spending_target - income
- AND withdrawals are executed per withdrawal ordering spec

---

### Requirement: Tax Estimation for Withholding
The system SHALL estimate taxes for withdrawal gross-up calculations.

#### Scenario: Estimate tax rate
- WHEN determining how much to withdraw from pre-tax
- THEN estimate marginal rate = federal_rate + state_rate
- AND gross_withdrawal = net_need / (1 - estimated_rate)

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
| tax_rate_capital_gains | 15% | Flat cap gains rate |
