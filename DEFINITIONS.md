# Simulation Field Definitions

How each field is computed in the backend (`simulation.py`) and where it appears in the UI.

## Accounting Identity

Every simulated year satisfies:

```
SOURCES = USES

total_income + rmd + pretax_withdrawal + roth_withdrawal + brokerage_withdrawal
= spending_target + total_tax + irmaa_cost + pretax_401k_deposit + roth_401k_deposit + surplus + conversion_tax
```

---

## Core Identity Fields

| Field | Computation | Notes |
|-------|-------------|-------|
| **year** | `start_year + year_idx` | Calendar year (year_idx starts at 0) |
| **age_primary** | `current_age_primary + year_idx` | Primary's age at start of year |
| **age_spouse** | `current_age_spouse + year_idx` | Spouse's age at start of year |

---

## SOURCES (Withdrawal Plan Card)

These are the inflows that fund spending, taxes, and deposits. Card shows summary: _"Withdrawals + Income = $XXX"_

### Income (`total_income`)

**Backend**: `ss_income + gross_stream_income`

- **Social Security**: Generated as income streams with annual COLA and early/delayed filing adjustments. Added when owner's age >= their start_age.
- **Employment salary**: **Gross** amount (before 401k deductions). The 401k deposits are tracked as separate Uses.
- **Other streams** (pension, rental, annuity): Full amount after COLA adjustment.

Both the card header and `income_details[]` sub-items show gross amounts — they now agree.

### Withdrawals (by account type)

Occur whenever `remaining_spend > 0`, subject to each account's `available_at_age`. No retirement-age gating — if an account is age-accessible, it can be withdrawn from.

| Field | What it tracks |
|-------|---------------|
| **brokerage_withdrawal** | All withdrawals from BROKERAGE + CASH accounts (spending, tax shortfall, conversion tax) |
| **pretax_withdrawal** | Voluntary withdrawals from PRETAX accounts for spending/tax (does NOT include RMD) |
| **roth_withdrawal** | Withdrawals from ROTH accounts for spending/tax (tax-free) |
| **rmd** | Required Minimum Distribution from pretax accounts per-owner when age >= rmd_start_age |

### Withdrawal Order

Configurable (default: cash, brokerage, pretax, roth). Each category tried in order until spend is covered. Pre-tax withdrawals grossed up for estimated taxes.

### Spending-Limited Years

When no accounts are age-accessible and income is insufficient, spending is capped to available income. `spending_limited = True` and the card shows _"(!) Spending limited to available income"_.

---

## USES (Withdrawal Plan Card)

Card shows summary: _"Spending + Taxes + Deposits = $XXX"_ (same total as Sources).

### Spending Target (`spending_target`)

Net spending goal = base_spending + planned_expenses. Strategy-dependent (fixed_dollar / percent_of_portfolio / guardrails). Inflation-adjusted starting year 1.

### Taxes

| Field | What it includes |
|-------|-----------------|
| **income_tax** | Federal progressive tax + state flat tax on ordinary income (AGI minus brokerage gains and conversions, minus deduction) |
| **brokerage_gains_tax** | Capital gains tax on realized brokerage gains (progressive 0%/15%/20% stacked on ordinary income) |
| **total_tax** | `income_tax + brokerage_gains_tax` (does NOT include IRMAA or conversion tax) |
| **irmaa_cost** | Medicare IRMAA surcharge based on AGI tier. Shown as its own line, not nested under Taxes. |
| **conversion_tax** | Tax on Roth conversion amount, paid from brokerage/cash. Shown in the Roth Conversion section. |

**Card**: "Taxes" = `total_tax`. Sub-items: Income Tax, Capital Gains Tax. "IRMAA Surcharge" is a peer line item. Conversion Tax shown in the Roth Conversion section.

**Details table**: "Total Tax" = `total_tax`, "IRMAA" = `irmaa_cost`, "Conv Tax" = `conversion_tax`, "Cap Gains Tax" = `brokerage_gains_tax`.

### 401k Deposits

| Field | What it tracks |
|-------|---------------|
| **pretax_401k_deposit** | Pre-tax 401k contributions from employment salary |
| **roth_401k_deposit** | Roth 401k contributions from employment salary |

Shown as "Emp. 401k Deposit" / "Emp. Roth 401k Deposit" on the card when > 0. Combined as "401k Dep" in the details table.

### Surplus (`surplus`)

Positive when income + RMD exceeds spending + taxes + deposits. Includes tax refunds from over-withholding. Reinvested via configured `excess_income_routing`.

---

## AGI

Accumulated through the year:
```
AGI = ss_taxable_portion
    + stream_taxable          (gross salary * taxable_pct - pretax_401k)
    + rmd_withdrawn
    + voluntary_pretax_withdrawal
    + realized_brokerage_gains
    + roth_conversion_amount
```

Used for: tax bracket determination, IRMAA tier lookup, Roth conversion headroom, capital gains bracket stacking.

Note: `income_tax` is computed on `ordinary_agi` (AGI minus brokerage gains and conversion amount) to avoid double-counting with `brokerage_gains_tax` and `conversion_tax`.

---

## Roth Conversion Fields

| Field | Meaning |
|-------|---------|
| **roth_conversion** | Amount moved from pretax (IRA-type) accounts to Roth Conversion accounts |
| **conversion_tax** | Tax actually paid on the conversion (from brokerage/cash) |
| **conversion_tax_from_brokerage** | Internal tracking of which portion came from brokerage |

Occurs when: conversion strategy is not "standard", no employment income this year, and AGI headroom to ceiling > $5,000. Deposits go to the correct owner's Roth Conversion account (not always Primary).

---

## Balance Fields

| Field | Computation |
|-------|-------------|
| **total_balance** | Sum of all account balances after growth (end-of-year) |
| **pretax_balance** | All PRETAX-category accounts |
| **roth_balance** | All ROTH-category accounts minus Roth Conversions |
| **roth_conversion_balance** | Roth Conversions tracking account only |
| **brokerage_balance** | BROKERAGE + CASH category accounts |

---

## Card vs Details Table Field Mapping

| Withdrawal Plan Card | Details Table Column | Backend Field |
|---------------------|---------------------|---------------|
| Income (header) | Income | `total_income` (gross) |
| Withdrawals (header) | Pre-tax WD + Roth WD + Brokerage WD | split by tax category |
| RMD | RMD | `rmd` |
| Spending | Spending | `spending_target` |
| Taxes (header) | Total Tax | `total_tax` |
| Income Tax (sub) | — | `income_tax` |
| Capital Gains Tax (sub) | Cap Gains Tax | `brokerage_gains_tax` |
| IRMAA Surcharge | IRMAA | `irmaa_cost` |
| Emp. 401k Deposit | 401k Dep | `pretax_401k_deposit + roth_401k_deposit` |
| Conversion Tax (sub) | Conv Tax | `conversion_tax` |
| Roth Conversion | Roth Conv | `roth_conversion` |
| Surplus | — | `surplus` |
