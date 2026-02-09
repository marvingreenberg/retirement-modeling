## MODIFIED Requirements

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
  6. Calculate income from additional income streams (if age threshold met)
  7. Calculate and execute RMDs (if age threshold met)
  8. Determine cash available vs. spending needed
  9. Execute withdrawals to meet spending shortfall
  10. Execute Roth conversions (if pre-RMD age and strategy permits)
  11. Reinvest surplus cash (if any)
  12. Calculate all taxes
  13. Apply investment growth to all accounts
  14. Record year results

### Requirement: Cash Flow Reconciliation
The system SHALL reconcile income against spending needs.

#### Scenario: Income exceeds spending
- WHEN (SS_income + income_streams + RMD) net of taxes > spending_target
- THEN surplus_cash = income - spending
- AND surplus is deposited to brokerage

#### Scenario: Spending exceeds income
- WHEN spending_target > available income
- THEN remaining_spend = spending_target - income
- AND withdrawals are executed per withdrawal ordering spec
