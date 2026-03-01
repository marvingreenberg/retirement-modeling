# 106 — Fix Spending Chart Cash Flow Formula

## Problem

The "Cash Flow" area on the Spending chart can drop to very small values (e.g. $7K) even when the simulation is fully meeting the budgeted spending target ($144K+). This makes it look like spending collapses, which is misleading.

## Root Cause

The cash flow formula in `SpendingChart.svelte` / `cashFlowForYear()`:

```
gross = total_income + rmd + pretax_withdrawal + roth_withdrawal + brokerage_withdrawal
        - conversion_tax_from_brokerage
cashFlow = gross - max(0, total_tax - conversion_tax)
```

`pretax_withdrawal` only records **voluntary** pretax withdrawals for spending — it does NOT include RMD withdrawals. But `total_tax` includes tax on RMDs, voluntary withdrawals, and conversions. In years where RMDs are large and cover most spending needs, `pretax_withdrawal` is ~0, but tax on RMD income is still subtracted. The `rmd` field partially offsets this but doesn't fully account for the tax attribution, so cash flow underreports actual spending capacity.

## Expected Behavior

The cash flow line should reflect the actual amount available for spending each year. When the simulation meets the full budget, the cash flow area should be >= budget + taxes.

## Approach

Review what the chart is trying to show (gross inflows after tax?) and rebuild the formula from the simulation's actual accounting. The simulation itself correctly meets the budget — only the chart visualization formula is wrong.
