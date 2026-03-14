# Balanced Sources & Uses Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Sources and Uses balance exactly on the Withdrawal Plan card, fix several accounting bugs, remove `is_retired` gating, and expose hidden tax components.

**Architecture:** Backend changes to YearResult model (new fields for 401k deposits, brokerage gains tax, spending-limited flag), simulation loop changes (remove is_retired, use age-based account availability, gate conversions on employment income), then frontend changes to WithdrawalPlan card and details table to display the balanced breakdown.

**Tech Stack:** Python/FastAPI (Pydantic models, simulation engine), SvelteKit/Svelte 5 (WithdrawalPlan component, details page), pytest, vitest

**Key warnings:**
- Do NOT remove `retirement_age` from SimulationConfig — it's used by the frontend and stored in portfolios. Just stop using it to gate withdrawals/conversions in the simulation loop.
- `schema.ts` does not validate YearResult (only input schemas). Task 10 may be a no-op for schema.ts.
- `SimulationResult.total_taxes_paid` (models.py:467) sums `total_tax` across years. Since `total_tax` now excludes IRMAA, this aggregate changes meaning. Add `total_irmaa_paid` to `SimulationResult` so the lifetime view stays complete.
- The accounting identity will be tricky because estimated withholding vs actual tax creates a gap reconciled via tax-shortfall withdrawals. The `surplus_cash` calculation happens BEFORE final tax is known, so it may need adjustment after the tax shortfall step.

---

## Chunk 1: Backend Model & Simulation Changes

### Task 1: Add new fields to YearResult model

**Files:**
- Modify: `src/retirement_model/models.py:416-452` (YearResult)
- Modify: `ui/src/lib/types.ts:289-316` (YearResult TS interface)
- Test: `tests/test_models.py`

- [ ] **Step 1: Add new fields to Python YearResult**

Add these fields to `YearResult` in `models.py` after existing fields:

```python
# New fields for balanced accounting
pretax_401k_deposit: float = 0.0
roth_401k_deposit: float = 0.0
brokerage_gains_tax: float = 0.0
spending_limited: bool = False
```

- [ ] **Step 2: Add matching fields to TypeScript YearResult**

Add to `ui/src/lib/types.ts` YearResult interface:

```typescript
pretax_401k_deposit: number;
roth_401k_deposit: number;
brokerage_gains_tax: number;
spending_limited: boolean;
```

- [ ] **Step 3: Redefine `total_tax` semantics**

`total_tax` currently = `income_tax + brokerage_gains_tax + irmaa_cost`. Change to = `income_tax + brokerage_gains_tax` only. IRMAA is a surcharge, shown separately. This is done in the simulation (Task 3), but document intent here: update the docstring or comment on YearResult.total_tax if one exists.

- [ ] **Step 4: Commit**

```bash
git add src/retirement_model/models.py ui/src/lib/types.ts
git commit -m "feat: add 401k deposit, brokerage gains tax, spending_limited fields to YearResult"
```

---

### Task 2: Change `total_income` to gross and track 401k deposits

**Files:**
- Modify: `src/retirement_model/simulation.py:340-364` (income stream processing)
- Modify: `src/retirement_model/simulation.py:613-650` (YearResult construction)
- Test: `tests/test_simulation.py`

- [ ] **Step 1: Write failing tests**

In `tests/test_simulation.py`, add tests:

```python
def test_total_income_is_gross_of_401k(self):
    """total_income should be gross salary, not net of 401k deductions."""
    # Setup: employment income $120K with $22K pretax 401k
    streams = [IncomeStream(
        name="Salary", kind="employment", amount=120000,
        start_age=60, end_age=70, taxable_pct=1.0,
        pretax_401k=22000,
    )]
    portfolio = _make_portfolio(streams=streams)
    result = run_simulation(portfolio)
    yr = result.years[0]
    assert yr.total_income == 120000  # gross, not 98000
    assert yr.pretax_401k_deposit == 22000

def test_401k_deposits_in_year_result(self):
    """401k deposits should be tracked in YearResult."""
    streams = [IncomeStream(
        name="Salary", kind="employment", amount=120000,
        start_age=60, end_age=70, taxable_pct=1.0,
        pretax_401k=15000, roth_401k=5000,
    )]
    portfolio = _make_portfolio(streams=streams)
    result = run_simulation(portfolio)
    yr = result.years[0]
    assert yr.pretax_401k_deposit == 15000
    assert yr.roth_401k_deposit == 5000
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest tests/test_simulation.py -k "test_total_income_is_gross or test_401k_deposits" -v`
Expected: FAIL

- [ ] **Step 3: Implement changes in simulation.py**

In the income stream loop (around line 340-364):

1. Track 401k deposits in new accumulators:
```python
total_pretax_401k = 0.0
total_roth_401k = 0.0
```

2. Inside the employment branch, after computing contributions:
```python
total_pretax_401k += contrib_pretax
total_roth_401k += contrib_roth
```

3. Change `stream_income` to use gross (not net of 401k):
```python
# Was: net_income = adjusted - contrib_pretax - contrib_roth
# Now: stream_income accumulates gross; 401k tracked separately
stream_income += adjusted  # gross
```

But **cash_in_hand still needs to be net** — the 401k money isn't available for spending. So we need a separate variable:
```python
gross_stream_income += adjusted
net_stream_income += adjusted - contrib_pretax - contrib_roth
```

Use `net_stream_income` for cash_in_hand (line 399) and `gross_stream_income` for total_income (line 633).

`stream_taxable` calculation stays the same (line 361): `adjusted * taxable_pct - contrib_pretax`.

4. In YearResult construction (line 633):
```python
total_income=round(ss_income + gross_stream_income),
pretax_401k_deposit=round(total_pretax_401k),
roth_401k_deposit=round(total_roth_401k),
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python -m pytest tests/test_simulation.py -k "test_total_income_is_gross or test_401k_deposits" -v`
Expected: PASS

- [ ] **Step 5: Fix existing tests that assumed net income**

Some existing tests may assert on `total_income` being net. Find and update them. Run:
`python -m pytest tests/test_simulation.py -x -v`

- [ ] **Step 6: Commit**

```bash
git add src/retirement_model/simulation.py tests/test_simulation.py
git commit -m "feat: total_income is now gross; track 401k deposits separately"
```

---

### Task 3: Expose brokerage_gains_tax and redefine total_tax

**Files:**
- Modify: `src/retirement_model/simulation.py:553-557` (tax computation)
- Modify: `src/retirement_model/simulation.py:613-650` (YearResult construction)
- Test: `tests/test_simulation.py`

- [ ] **Step 1: Write failing test**

```python
def test_brokerage_gains_tax_exposed(self):
    """brokerage_gains_tax should be a separate field, not hidden in total_tax."""
    # Setup: brokerage with low basis (high gains) + need to withdraw
    accounts = [Account(
        id="brk", name="Brokerage", balance=1_000_000,
        type=AccountType.BROKERAGE, owner=Owner.JOINT,
        cost_basis_ratio=0.2,  # 80% gains
    )]
    portfolio = _make_portfolio(accounts=accounts)
    result = run_simulation(portfolio)
    yr = result.years[0]
    assert yr.brokerage_gains_tax >= 0
    # total_tax should NOT include irmaa
    assert yr.total_tax == yr.income_tax + yr.brokerage_gains_tax
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_simulation.py -k "test_brokerage_gains_tax_exposed" -v`
Expected: FAIL (total_tax currently includes irmaa_cost)

- [ ] **Step 3: Implement**

In simulation.py line 557, change:
```python
# Was: total_tax = income_tax + brokerage_gains_tax + irmaa_cost
total_tax = income_tax + brokerage_gains_tax
```

In YearResult construction, add:
```python
brokerage_gains_tax=round(brokerage_gains_tax),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_simulation.py -k "test_brokerage_gains_tax_exposed" -v`
Expected: PASS

- [ ] **Step 5: Fix existing tests that assumed total_tax includes irmaa**

Run full suite: `python -m pytest tests/ -x -v`
Update any assertions on `total_tax` that expect it to include IRMAA.

- [ ] **Step 6: Commit**

```bash
git add src/retirement_model/simulation.py tests/test_simulation.py
git commit -m "feat: expose brokerage_gains_tax; total_tax excludes irmaa"
```

---

### Task 4: Remove is_retired gating — withdraw based on account availability

**Files:**
- Modify: `src/retirement_model/simulation.py:406-478` (spending withdrawals)
- Modify: `src/retirement_model/simulation.py:569-574` (tax shortfall)
- Test: `tests/test_simulation.py`, `tests/test_salary_retirement_gating.py`

- [ ] **Step 1: Write failing tests for pre-retirement withdrawal behavior**

```python
def test_pre_retirement_withdraws_from_brokerage_when_income_insufficient(self):
    """When income doesn't cover spending pre-retirement, withdraw from brokerage."""
    # No income, brokerage available (available_at_age=0), IRA restricted (available_at_age=60)
    accounts = [
        Account(id="brk", name="Brokerage", balance=500_000,
                type=AccountType.BROKERAGE, owner=Owner.JOINT,
                cost_basis_ratio=0.5, available_at_age=0),
        Account(id="ira", name="IRA", balance=500_000,
                type=AccountType.IRA, owner=Owner.PRIMARY,
                available_at_age=60),
    ]
    portfolio = _make_portfolio(age=55, years=3, retirement_age=65, accounts=accounts)
    result = run_simulation(portfolio)
    yr = result.years[0]
    # Should withdraw from brokerage (age 55, brokerage available_at_age=0)
    assert yr.brokerage_withdrawal > 0
    # Should NOT withdraw from IRA (age 55 < available_at_age 60)
    assert yr.pretax_withdrawal == 0

def test_pre_retirement_no_available_accounts_limits_spending(self):
    """When no accounts are available pre-retirement and no income, spending is limited."""
    accounts = [
        Account(id="ira", name="IRA", balance=1_000_000,
                type=AccountType.IRA, owner=Owner.PRIMARY,
                available_at_age=60),
    ]
    portfolio = _make_portfolio(age=55, years=3, retirement_age=65, accounts=accounts)
    result = run_simulation(portfolio)
    yr = result.years[0]
    assert yr.spending_limited is True
    # Spending should be capped to available income (which is 0)
    assert yr.spending_target == 0 or yr.spending_limited
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest tests/test_simulation.py -k "test_pre_retirement" -v`
Expected: FAIL

- [ ] **Step 3: Remove is_retired gate from spending withdrawals**

In simulation.py, remove the `is_retired` variable (line 406) and change line 417:

```python
# Was: if remaining_spend > 0 and is_retired:
if remaining_spend > 0:
```

The age-based filtering in `withdraw_from_accounts` (withdrawals.py:56-58) already skips accounts where owner's age < available_at_age, so this is safe.

- [ ] **Step 4: Add spending-limited logic**

After the spending withdrawal loop (after line 475), add:

```python
# If withdrawals couldn't cover remaining spend, cap spending to what's available
spending_limited = False
if remaining_spend > 1.0:
    spending_limited = True
    # Use a separate variable — don't overwrite total_spend_needed which is used later
    actual_spend = total_spend_needed - remaining_spend
    surplus_cash = 0.0
```

Use `actual_spend` (not `total_spend_needed`) when constructing YearResult.spending_target for limited years.

Include `spending_limited` in YearResult construction:
```python
spending_limited=spending_limited,
```

- [ ] **Step 5: Remove is_retired gate from tax shortfall**

In simulation.py lines 571-574, remove the is_retired branching. The age-based account availability already prevents withdrawing from restricted accounts:

```python
# Was:
# tax_order = cfg.withdrawal_order if is_retired
#     else [c for c in cfg.withdrawal_order if c in _TAX_ONLY_CATEGORIES]
# Now: always use full withdrawal order; age restrictions handle availability
tax_order = cfg.withdrawal_order
```

- [ ] **Step 6: Run tests**

Run: `python -m pytest tests/test_simulation.py tests/test_salary_retirement_gating.py -x -v`

Many existing tests in `test_salary_retirement_gating.py` assume `is_retired` gating. Update them:
- `test_no_spending_withdrawals_pre_retirement`: Now brokerage withdrawals CAN happen pre-retirement if salary doesn't cover spending. Update assertion to check that pretax/roth are still blocked by age, not by retirement status.
- `test_roth_conversions_suppressed_pre_retirement`: Still valid — conversions are now gated on employment income (Task 5), not is_retired.
- `test_tax_shortfall_uses_only_liquid_pre_retirement`: Update — age-based availability now handles this, not is_retired.

- [ ] **Step 7: Remove `_TAX_ONLY_CATEGORIES` constant and `is_retired` variable**

Clean up dead code:
- Remove line 63: `_TAX_ONLY_CATEGORIES = frozenset({...})`
- Remove line 406: `is_retired = cfg.retirement_age is None or age_primary >= cfg.retirement_age`
- Do NOT remove `retirement_age` from SimulationConfig — it's used by the frontend and stored in portfolio JSON.

- [ ] **Step 8: Run full backend test suite**

Run: `python -m pytest tests/ -x -v`
Expected: all pass

- [ ] **Step 9: Commit**

```bash
git add src/retirement_model/simulation.py tests/test_simulation.py tests/test_salary_retirement_gating.py
git commit -m "feat: remove is_retired gating; use age-based account availability; add spending_limited"
```

---

### Task 5: Gate Roth conversions on employment income, per-owner deposits

**Files:**
- Modify: `src/retirement_model/simulation.py:478-540` (Roth conversion block)
- Modify: `src/retirement_model/withdrawals.py:113-141` (deposit_to_account)
- Test: `tests/test_simulation.py`

- [ ] **Step 1: Write failing tests**

```python
def test_roth_conversions_suppressed_during_employment(self):
    """Roth conversions should not occur when there is employment income."""
    streams = [IncomeStream(
        name="Salary", kind="employment", amount=120000,
        start_age=60, end_age=64, taxable_pct=1.0,
    )]
    accounts = [
        Account(id="brk", name="Brokerage", balance=500_000,
                type=AccountType.BROKERAGE, owner=Owner.JOINT, cost_basis_ratio=0.5),
        Account(id="ira", name="IRA", balance=500_000,
                type=AccountType.IRA, owner=Owner.PRIMARY),
    ]
    portfolio = _make_portfolio(
        age=60, years=10, streams=streams, strategy="irmaa_tier_1", accounts=accounts
    )
    result = run_simulation(portfolio)
    # Ages 60-64: employment income, no conversions
    for i in range(5):
        assert result.years[i].roth_conversion == 0
    # Ages 65+: no employment, conversions should happen
    any_conv = any(result.years[i].roth_conversion > 0 for i in range(5, len(result.years)))
    assert any_conv

def test_roth_conversion_deposits_to_correct_owner(self):
    """Roth conversion from spouse IRA deposits to spouse's Roth Conversion account."""
    accounts = [
        Account(id="brk", name="Brokerage", balance=500_000,
                type=AccountType.BROKERAGE, owner=Owner.JOINT, cost_basis_ratio=0.5),
        Account(id="ira_s", name="Spouse IRA", balance=300_000,
                type=AccountType.IRA, owner=Owner.SPOUSE),
    ]
    portfolio = _make_portfolio(age=65, years=3, strategy="irmaa_tier_1", accounts=accounts)
    result = run_simulation(portfolio)
    # Check withdrawal_details: conversion should come from Spouse IRA
    yr = result.years[0]
    conv_details = [d for d in yr.withdrawal_details if d.purpose == "conversion"]
    if conv_details:
        assert conv_details[0].account_name == "Spouse IRA"
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest tests/test_simulation.py -k "test_roth_conversion" -v`
Expected: FAIL (at minimum the employment gating test, since current code uses is_retired)

- [ ] **Step 3: Change conversion gate from is_retired to no-employment-income**

In simulation.py line 478:
```python
# Was: if conversion_ceiling > 0 and is_retired:
if conversion_ceiling > 0 and not has_employment_income:
```

- [ ] **Step 4: Per-owner Roth conversion deposits**

Currently line 536-537 always deposits to `Owner.PRIMARY`. Change to deposit per the source account's owner.

The `conv_result` from `withdraw_from_eligible_pretax` returns `per_account` details. We need to track which owner's accounts were converted and deposit accordingly.

Modify the conversion block to iterate per-owner:
```python
if conversion_ceiling > 0 and not has_employment_income:
    agi_headroom = max(0, conversion_ceiling - current_agi)

    if agi_headroom > 5000:
        available_ira = get_eligible_pretax_balance(accounts)
        conversion_target = min(agi_headroom, available_ira)

        if conversion_target > 0:
            # ... tax computation stays the same ...

            conv_result = withdraw_from_eligible_pretax(
                conversion_target, accounts, age_map, eligible_only=True
            )
            withdrawal_details.extend(
                _collect_details(conv_result, "conversion", account_names)
            )

            # Deposit per-owner based on source accounts
            owner_amounts: dict[Owner, float] = {}
            for pa in conv_result.per_account:
                acc = next(a for a in accounts if a.id == pa.account_id)
                owner_amounts[acc.owner] = owner_amounts.get(acc.owner, 0) + pa.amount

            # ... net deposit calculation stays the same ...

            for owner, amt in owner_amounts.items():
                # Scale net_deposit proportionally
                owner_net = net_deposit * (amt / conv_result.amount_withdrawn) if conv_result.amount_withdrawn > 0 else 0
                deposit_to_account(owner_net, accounts, AccountType.ROTH_CONVERSION, owner)

            converted_amount += conv_result.amount_withdrawn
            current_agi += conv_result.amount_withdrawn
```

Note: `per_account` items have `account_id` — look up the account to find its owner.

- [ ] **Step 5: Run tests**

Run: `python -m pytest tests/test_simulation.py -k "test_roth_conversion" -v`
Expected: PASS

- [ ] **Step 6: Run full backend suite**

Run: `python -m pytest tests/ -x -v`
Fix any regressions.

- [ ] **Step 7: Commit**

```bash
git add src/retirement_model/simulation.py tests/test_simulation.py
git commit -m "feat: gate Roth conversions on employment income; per-owner deposits"
```

---

### Task 6: Verify accounting identity in tests

**Files:**
- Test: `tests/test_simulation.py`

- [ ] **Step 1: Write accounting identity test**

```python
def test_sources_equal_uses_every_year(self):
    """For every simulated year, total sources must equal total uses."""
    streams = [IncomeStream(
        name="Salary", kind="employment", amount=150000,
        start_age=60, end_age=64, taxable_pct=1.0,
        pretax_401k=22000,
    )]
    accounts = [
        Account(id="brk", name="Brokerage", balance=500_000,
                type=AccountType.BROKERAGE, owner=Owner.JOINT, cost_basis_ratio=0.5),
        Account(id="ira", name="IRA", balance=500_000,
                type=AccountType.IRA, owner=Owner.PRIMARY),
    ]
    portfolio = _make_portfolio(age=60, years=15, streams=streams, retirement_age=65, accounts=accounts)
    result = run_simulation(portfolio)

    for yr in result.years:
        sources = yr.total_income + yr.rmd + yr.pretax_withdrawal + yr.roth_withdrawal + yr.brokerage_withdrawal
        uses = (yr.spending_target + yr.total_tax + yr.irmaa_cost
                + yr.pretax_401k_deposit + yr.roth_401k_deposit + yr.surplus)
        assert abs(sources - uses) < 2.0, (
            f"Year {yr.year}: sources={sources:.0f} != uses={uses:.0f}, "
            f"diff={sources - uses:.0f}"
        )
```

- [ ] **Step 2: Run test**

Run: `python -m pytest tests/test_simulation.py -k "test_sources_equal_uses" -v`

If it fails, the imbalance reveals what's missing from the accounting. Debug and fix. Common issues:
- Conversion tax paid from brokerage is a source (brokerage_withdrawal) and a use (part of taxes? or separate?)
- Surplus routing deposits aren't a "use" that needs tracking if surplus is already shown

The identity should be:
```
total_income + rmd + pretax_wd + roth_wd + brokerage_wd
= spending_target + income_tax + brokerage_gains_tax + irmaa_cost
  + pretax_401k_deposit + roth_401k_deposit + surplus
```

Note: `conversion_tax` is paid from brokerage (already in brokerage_withdrawal) and is a use — but conversions are displayed separately. The conversion tax might need to be added to the uses side if it's embedded in brokerage_withdrawal on the sources side. Trace this carefully during implementation.

- [ ] **Step 3: Commit**

```bash
git add tests/test_simulation.py
git commit -m "test: add accounting identity assertion (sources == uses)"
```

---

## Chunk 2: Frontend Changes

### Task 7: Update WithdrawalPlan card — Sources section

**Files:**
- Modify: `ui/src/lib/components/WithdrawalPlan.svelte:169-251` (Sources section)
- Test: `ui/src/lib/components/WithdrawalPlan.test.ts`

- [ ] **Step 1: Write failing tests for new Sources display**

Add tests that verify:
- Sources header shows total: `total_income + rmd + pretax_withdrawal + roth_withdrawal + brokerage_withdrawal`
- Summary text: "Withdrawals + Income = $XXX"
- Income sub-items show gross salary (matching total_income)

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd ui && npx vitest run src/lib/components/WithdrawalPlan.test.ts`

- [ ] **Step 3: Update Sources section**

Add summary line after SOURCES header:
```svelte
<div class="text-xs text-surface-500 italic">
   Withdrawals + Income = {currency(yr.total_income + totalWithdrawals + yr.rmd)}
</div>
```

Where `totalWithdrawals` already exists (computed from withdrawal_details filtering).

Income header now shows gross `total_income` — since backend now provides gross, this just works. The sub-items from `income_details[]` already show gross amounts, so now they'll match the header.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ui && npx vitest run src/lib/components/WithdrawalPlan.test.ts`

- [ ] **Step 5: Commit**

```bash
git add ui/src/lib/components/WithdrawalPlan.svelte ui/src/lib/components/WithdrawalPlan.test.ts
git commit -m "feat: WithdrawalPlan sources show gross income with summary total"
```

---

### Task 8: Update WithdrawalPlan card — Uses section

**Files:**
- Modify: `ui/src/lib/components/WithdrawalPlan.svelte:253-335` (Uses section)
- Test: `ui/src/lib/components/WithdrawalPlan.test.ts`

- [ ] **Step 1: Write failing tests for new Uses display**

Add tests that verify:
- Uses summary text: "Spending + Taxes + Surcharges = $XXX" (same total as Sources)
- Taxes line = `income_tax + brokerage_gains_tax` (no IRMAA double-count)
- Capital Gains Tax shown as sub-item under Taxes when > 0
- IRMAA shown as its own line item (peer of Taxes, not nested)
- 401k deposits shown as separate use lines when > 0
- spending_limited flag shows warning text

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd ui && npx vitest run src/lib/components/WithdrawalPlan.test.ts`

- [ ] **Step 3: Implement Uses changes**

Add summary line after USES header (must match Sources total):
```svelte
{@const totalSources = yr.total_income + totalWithdrawals + yr.rmd}
<div class="text-xs text-surface-500 italic">
   Spending + Taxes + Deposits = {currency(totalSources)}
</div>
```

(The summary text says "Spending + Taxes + Deposits" to cover all use categories: spending, income tax, cap gains tax, IRMAA surcharge, 401k deposits, and surplus.)

Fix Taxes line (was `total_tax + irmaa_cost`, now just `total_tax` since irmaa excluded):
```svelte
<span>Taxes</span>
<span>{currency(yr.total_tax)}</span>
```

Show sub-items for Income Tax and Capital Gains Tax when there are multiple tax types:
```svelte
{#if yr.brokerage_gains_tax > 0 || yr.conversion_tax > 0}
   <div class="flex justify-between pl-3 text-surface-500">
      <span>Income Tax</span>
      <span>{currency(yr.income_tax)}</span>
   </div>
{/if}
{#if yr.brokerage_gains_tax > 0}
   <div class="flex justify-between pl-3 text-surface-500">
      <span>Capital Gains Tax</span>
      <span>{currency(yr.brokerage_gains_tax)}</span>
   </div>
{/if}
{#if yr.conversion_tax > 0}
   <div class="flex justify-between pl-3 text-surface-500">
      <span>Conversion Tax</span>
      <span>{currency(yr.conversion_tax)}</span>
   </div>
{/if}
```

IRMAA as peer line item (not nested under Taxes):
```svelte
{#if yr.irmaa_cost > 0}
   <div class="flex justify-between font-medium">
      <span>IRMAA Surcharge</span>
      <span>{currency(yr.irmaa_cost)}</span>
   </div>
{/if}
```

401k deposits:
```svelte
{#if yr.pretax_401k_deposit > 0}
   <div class="flex justify-between font-medium">
      <span>Emp. 401k Deposit</span>
      <span>{currency(yr.pretax_401k_deposit)}</span>
   </div>
{/if}
{#if yr.roth_401k_deposit > 0}
   <div class="flex justify-between font-medium">
      <span>Emp. Roth 401k Deposit</span>
      <span>{currency(yr.roth_401k_deposit)}</span>
   </div>
{/if}
```

Spending-limited warning:
```svelte
{#if yr.spending_limited}
   <div class="text-xs text-warning-600 dark:text-warning-400 pl-3">
      (!) Spending limited to available income
   </div>
{/if}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ui && npx vitest run src/lib/components/WithdrawalPlan.test.ts`

- [ ] **Step 5: Commit**

```bash
git add ui/src/lib/components/WithdrawalPlan.svelte ui/src/lib/components/WithdrawalPlan.test.ts
git commit -m "feat: balanced Uses section with separate IRMAA, cap gains tax, 401k deposits"
```

---

### Task 9: Update details table

**Files:**
- Modify: `ui/src/routes/details/+page.svelte:85-124`
- Test: `ui/src/routes/details/details.test.ts`

- [ ] **Step 1: Write failing tests**

Add tests for new columns: Capital Gains Tax, 401k Deposits. Verify Total Tax column uses the new definition (excludes IRMAA).

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd ui && npx vitest run src/routes/details/details.test.ts`

- [ ] **Step 3: Add new columns to details table**

In the header row, add after existing columns:
- `<th>Cap Gains Tax</th>` (after Total Tax or Conv Tax)
- `<th>401k Dep</th>` (combines pretax + roth deposits for space)

In the body row, add corresponding cells:
```svelte
<td>{currency(yr.brokerage_gains_tax)}</td>
<td>{currency(yr.pretax_401k_deposit + yr.roth_401k_deposit)}</td>
```

"Total Tax" column already shows `yr.total_tax` — now that total_tax excludes IRMAA, it's correct. IRMAA already has its own column.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ui && npx vitest run src/routes/details/details.test.ts`

- [ ] **Step 5: Commit**

```bash
git add ui/src/routes/details/+page.svelte ui/src/routes/details/details.test.ts
git commit -m "feat: add cap gains tax and 401k deposit columns to details table"
```

---

### Task 10: Update Zod schema and API boundary tests

**Files:**
- Modify: `ui/src/lib/schema.ts` (if YearResult is validated)
- Modify: `tests/test_fe_be_boundary.py` (frontend-backend boundary tests)
- Test: both of the above

- [ ] **Step 1: Check if schema.ts validates YearResult**

Search for YearResult in schema.ts. If present, add the new fields:
```typescript
pretax_401k_deposit: z.number(),
roth_401k_deposit: z.number(),
brokerage_gains_tax: z.number(),
spending_limited: z.boolean(),
```

- [ ] **Step 2: Update fe_be_boundary tests**

Update any test fixtures that construct YearResult objects to include the new fields.

- [ ] **Step 3: Run boundary tests**

Run: `python -m pytest tests/test_fe_be_boundary.py -x -v`
Run: `cd ui && npx vitest run`

- [ ] **Step 4: Commit**

```bash
git add ui/src/lib/schema.ts tests/test_fe_be_boundary.py
git commit -m "feat: update schema and boundary tests for new YearResult fields"
```

---

### Task 11: Update DEFINITIONS.md

**Files:**
- Modify: `DEFINITIONS.md`

- [ ] **Step 1: Update definitions to reflect new semantics**

- `total_income`: now gross (includes 401k portion)
- `total_tax`: now `income_tax + brokerage_gains_tax` (excludes IRMAA)
- New fields: `pretax_401k_deposit`, `roth_401k_deposit`, `brokerage_gains_tax`, `spending_limited`
- Remove "Known Issues" that are now fixed
- Update card/table mapping

- [ ] **Step 2: Commit**

```bash
git add DEFINITIONS.md
git commit -m "docs: update DEFINITIONS.md for balanced sources/uses"
```

---

### Task 12: Full integration test pass

- [ ] **Step 1: Run full backend tests**

Run: `python -m pytest tests/ -x -v --tb=short`
Expected: all pass

- [ ] **Step 2: Run full frontend tests**

Run: `cd ui && npx vitest run`
Expected: all pass

- [ ] **Step 3: Run svelte-check**

Run: `cd ui && npx svelte-check --tsconfig ./tsconfig.json`
Expected: no errors

- [ ] **Step 4: Run linters**

Run: `make lint`
Expected: clean

- [ ] **Step 5: Manual smoke test**

Run: `make dev`
Load the Mike/Karen portfolio. Verify:
- 2026: spending limited (or withdrawals from brokerage if available)
- 2027: Sources total == Uses total
- Income shows $200K (gross salary), 401k deposit shows $22K under Uses
- Taxes don't double-count IRMAA
- Capital gains tax visible when brokerage withdrawals occur
- Details table has new columns

- [ ] **Step 6: Final commit if any fixups needed**
