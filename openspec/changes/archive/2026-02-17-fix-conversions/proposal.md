## Why

Roth conversions currently withdraw from any pre-tax account, but in practice only Traditional/SEP/SIMPLE IRAs are directly convertible — 401k/403b/457b require a rollover first. The account type dropdown only offers 3 generic types (pretax/roth/brokerage) with no automated defaults, making it hard for users to set correct cost basis and taxable ratios. Converted amounts are deposited into existing Roth accounts, so users can't see conversion growth separately on the chart.

## What Changes

- **Expand AccountType enum** to specific types: `ira`, `sep_ira`, `simple_ira`, `401k`, `403b`, `457b`, `roth_ira`, `roth_401k`, `brokerage`, `cash_cd`, `roth_conversion`. Each maps to a tax category (pretax/roth/brokerage/cash) via helper function.
- **Automate defaults** per account type: selecting a type auto-fills cost_basis_ratio and removes the field from manual editing when it's fixed (e.g., 100% for Roth, 0% for pre-tax).
- **Fix conversion source** to only convert from IRA-category pre-tax accounts (`ira`, `sep_ira`, `simple_ira`), not from 401k/403b/457b or brokerage.
- **Auto-create "Roth Conversions" account** during simulation — conversion deposits go to a `roth_conversion` type account tracked separately from regular Roth.
- **Update balance chart** to show 4 stacked layers (Pre-tax, Roth Conversions, Roth, Brokerage) with dynamic visibility — layers hidden when balance is zero across all years.
- **Update ApplicationDetails.md** with explanations of Roth conversions (when/why valuable, eligibility), RMDs and the "RMD time bomb", and cost basis rationale per account type.

## Capabilities

### New Capabilities

_None — all changes modify existing capabilities._

### Modified Capabilities

- `roth-conversions`: Restrict conversion source to IRA-category pre-tax accounts only; auto-create roth_conversion tracking account
- `tax-calculations`: Map expanded account types to tax categories; Cash/CD type has 0% taxable withdrawals
- `portfolio-editor`: Expand account type dropdown with specific types and automated defaults; update chart to 4 layers with dynamic visibility
- `withdrawal-ordering`: Withdrawal logic uses tax category grouping from expanded account types

## Impact

- **Backend**: `models.py` (AccountType enum, helper functions), `simulation.py` (conversion source filter, auto-create roth_conversion account), `withdrawals.py` (use tax category for grouping), `taxes.py` (cash type handling)
- **Frontend**: `types.ts`, `schema.ts` (expanded types), `AccountsEditor.svelte` (type dropdown, auto-defaults), `BalanceChart.svelte` (4 layers, dynamic visibility), `stores.ts` (sample data with specific types)
- **Documentation**: `ApplicationDetails.md` (Roth conversions, RMDs, cost basis sections)
- **Tests**: Backend unit tests for conversion source filtering, account type mapping; frontend tests for type dropdown behavior, chart dataset filtering
