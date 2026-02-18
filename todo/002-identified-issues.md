# Identified Issues — Comprehensive Module Review

Post-implementation review of withdrawal, tax, conversion, and simulation modules.
Issues are grouped by severity. Each includes the module/function, description, and probable fix.

## Disposition Key

- **FIX** — Include in next development cycle
- **DEFER** — Tracked in a separate todo for later
- **DOCS** — Documentation-only change

---

## Critical Bugs (incorrect financial results)

### 1. Flat marginal rate used instead of progressive income tax
**Module:** `simulation.py` `run_simulation()` ~line 379
**Disposition:** FIX

Income tax is calculated as `taxable_income * est_tax_rate` where `est_tax_rate` is the marginal rate from `get_marginal_tax_rate`. This taxes all income at the top bracket rate instead of using progressive brackets. For $300K AGI at 24% marginal, the entire taxable income gets taxed at 24%.

The `taxes.py` module already has a correct progressive `calculate_income_tax()` function — it is simply not called from the simulation loop.

**Fix:** Replace the flat multiplication with `calculate_income_tax(taxable_income, adj_fed_brackets, cfg.tax_rate_state)`.

---

### 2. Cost basis ratio never updates as brokerage accounts grow
**Module:** `withdrawals.py` `apply_growth()`, `withdraw_from_accounts()`
**Disposition:** FIX

When brokerage accounts grow, the cost_basis_ratio stays fixed. A $100K account with 0.40 cost basis ratio ($40K basis, $60K gains) that grows to $200K should have ratio 0.20 ($40K basis / $200K), but the model keeps 0.40, understating taxable gains.

Similarly, surplus cash deposits to brokerage don't update the ratio, even though deposits are 100% basis.

**Fix:** Track absolute cost basis instead of ratio. Adjust on growth, deposits, and withdrawals:
- After growth: basis unchanged, ratio = basis / new_balance
- After deposit: basis += deposit amount
- After withdrawal: basis decreases proportionally (linear, not LIFO/FIFO — out of scope)

---

### 3. Capital gains tax not progressive across bracket boundary
**Module:** `taxes.py` `calculate_capital_gains_tax()`
**Disposition:** FIX

Applies a single flat rate based on total income bracket, not progressively. If total income is $130K (including $50K gains on $80K ordinary income), all $50K gains are taxed at 15%. But the first $9,250 of gains (from $80K up to the $89,250 threshold) should be at 0%.

**Fix:** Implement progressive capital gains calculation that stacks gains on top of ordinary income and applies bracket rates to each slice.

---

### 4. Spouse income streams use primary's age for start/end gating
**Module:** `simulation.py` `run_simulation()` ~lines 227-235
**Disposition:** FIX

All income streams use `age_primary` for the `in_range` check, including spouse SS and spouse-specific streams. A spouse 3 years younger with SS starting at 67 would start receiving income when the primary reaches 67, not when the spouse does.

**Fix:** Add an `owner` field to `IncomeStream` model. Use `age_spouse` for spouse-owned streams and `age_primary` for primary-owned streams. The `ss_auto` generation should tag generated streams with the appropriate owner.

---

### 5. Surplus cash deposits to brokerage create phantom capital gains
**Module:** `simulation.py` `run_simulation()` ~line 374-375
**Disposition:** FIX

When SS + income streams + RMDs exceed spending target, surplus is deposited to the first matching brokerage account. If none exists, a new one is created with `cost_basis_ratio=0.40` from ACCOUNT_TYPE_DEFAULTS — taxing already-taxed income as 60% gains on future withdrawal.

**Fix:** Always deposit surplus to a dedicated `excess_income` brokerage account (joint if spouse exists). Track absolute cost basis — each deposit adds to basis at 100%. This replaces the current behavior of finding/creating an arbitrary brokerage account.

---

### 6. Stream income withholding taxes gross instead of taxable portion
**Module:** `simulation.py` `run_simulation()` ~line 259
**Disposition:** FIX

`cash_from_streams = stream_income * (1 - est_tax_rate)` taxes the entire stream income at the marginal rate, but only `stream_taxable` (= `amount * taxable_pct`) should be taxed. A stream with `taxable_pct=0.5` gets the full marginal rate applied to 100% of its income.

**Fix:** `cash_from_streams = stream_income - (stream_taxable * est_tax_rate)`

---

## Significant Bugs

### 7. Tax withholding and final tax not reconciled (potential double-counting)
**Module:** `simulation.py` `run_simulation()`
**Disposition:** DEFER → relates to future 100-withdrawal-plan

The simulation withholds estimated tax from SS/streams/RMDs cash flow (reducing available spending power), then separately computes final `income_tax` on AGI. There is no reconciliation between what was withheld and what was owed.

**Preferred approach:** Income from source at gross, total tax computed from all sources, separate withdrawal for taxes. Income available = budgeted amount, not reduced for taxes.

---

### 8. Conversion tax overestimated (uses marginal rate, not blended)
**Module:** `simulation.py` `run_simulation()` ~line 333
**Disposition:** FIX

`tax_bill = conversion_target * est_tax_rate` uses the marginal rate. If a conversion spans from the 12% to 22% bracket, the entire amount gets taxed at 22%.

**Fix:** Use incremental progressive calculation: `tax = calculate_income_tax(agi + conversion) - calculate_income_tax(agi)`.

---

### 9. Capital gains 0% bracket unused due to default flat rate
**Module:** `taxes.py` `calculate_capital_gains_tax()`; config defaults; UI settings
**Disposition:** FIX — remove flat rate entirely

`tax_rate_capital_gains` defaults to 0.15. When set, the tiered bracket-based calculation is bypassed entirely. For retirees with lower income, the 0% capital gains bracket (up to ~$89,250 MFJ) could save significant tax.

**Fix:** Remove the `tax_rate_capital_gains` field from config, models, schema, and UI. Always use tiered progressive capital gains brackets. Pre-1.0, no backward compatibility needed. Future: advanced setting to customize brackets.

---

### 10. Bracket label "12%" returned for 10% bracket income
**Module:** `taxes.py` `get_bracket_label()`; `constants.py` `BRACKET_LABELS`
**Disposition:** FIX

`BRACKET_LABELS` has the lowest threshold at 0, labeled "12%". Income of $5,000 matches `income > 0` and returns "12%" instead of "10%". The 10% bracket ($0-$23,200) is never labeled correctly.

**Fix:** Change the 12% threshold from 0 to 23200 in `BRACKET_LABELS`.

---

### 11. RMD withdrawal not separated by owner (cross-owner contamination)
**Module:** `simulation.py` `run_simulation()` ~lines 240-251
**Disposition:** FIX

RMDs are calculated per-owner but the withdrawal uses combined `total_rmd` from any pretax account. If primary has a larger RMD but spouse's accounts come first in the list, the spouse's account could be over-withdrawn to satisfy the primary's obligation.

**Fix:** Separate RMD withdrawals by owner — add an optional `owner` filter to `withdraw_from_accounts` and call it once per owner.

---

## Modeling Simplifications Worth Documenting

### 12. Social Security always taxed at 85%
**Module:** `simulation.py` ~line 237
**Disposition:** FIX

The 85% taxability is always applied. IRS rules have 0%/50%/85% tiers based on combined income. A correct `calculate_ss_taxable_portion()` function exists in `taxes.py` but is never called. For lower-income retirees, this significantly overstates AGI.

**Fix:** Use `calculate_ss_taxable_portion()` instead of hardcoded 0.85.

---

### 13. Cash/CD accounts earn equity-like growth
**Module:** `withdrawals.py` `apply_growth()`
**Disposition:** FIX

All accounts get the same growth rate, including cash/CD. Cash should not earn equity returns or lose value in down markets.

**Fix:** Skip growth for `cash_cd` accounts (balance stays flat).

---

### 14. No Roth conversions after RMD age
**Module:** `simulation.py` ~line 325
**Disposition:** DEFER → 200-additional-improvements

Conversions are restricted to before RMD age. In practice, conversions can continue after RMD age (take RMD first, then convert).

---

### 15. Monte Carlo API uses simplified model, not full simulation
**Module:** `monte_carlo.py` `run_single_simulation()`; `api.py`
**Disposition:** FIX

The API's `/monte-carlo` endpoint calls `run_monte_carlo` → `run_single_simulation`, which does pro-rata withdrawals with no taxes, no RMDs, no conversions, no withdrawal ordering. Meanwhile `run_full_monte_carlo` exists (calls `run_simulation` with full logic) but is never wired to the API.

The UI shows one single run and one MC run — users expect both to use the same simulation logic.

**Fix:** Wire the API's `/monte-carlo` endpoint to use `run_full_monte_carlo` instead of `run_monte_carlo`. Both runs should use the same full simulation with withdrawal ordering, taxes, RMDs, and conversions.

---

### 16. 401(k)/403(b)/457(b) accounts not conversion-eligible
**Module:** `models.py` `is_conversion_eligible()`
**Disposition:** DOCS

Only IRA-type accounts are eligible for direct Roth conversion. Employer plans (401k, 403b, 457b) require rollover to IRA first — this is a mechanical detail, not a modeling limitation.

**Fix:** Add note to ApplicationDetails explaining that employer plan conversions require a rollover to IRA first, which users can model by changing the account type.

---

### 17. Inflation starts at 1.0 in year 0 regardless of start year
**Module:** `simulation.py` ~lines 144, 179-181
**Disposition:** DEFER → 201-start-year-exploration

Tax brackets use 2024 base values with no inflation adjustment in year 0. The broader question of how start_year works and what it means for pre-retirement planning needs exploration.
