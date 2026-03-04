# Per-Account Growth Rates Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace global `investment_growth_rate` with per-account growth rates derived from stock/bond allocation, plus a conservative growth checkbox.

**Architecture:** Each account's growth rate = `stock_pct/100 * 0.10 + (1 - stock_pct/100) * 0.04`, minus tax drag for brokerage. A `conservative_growth` boolean on SimulationConfig applies a 0.75 multiplier. The global `investment_growth_rate` field is removed from the model, API, and UI.

**Tech Stack:** Python/FastAPI backend, SvelteKit frontend with Svelte 5 runes, vitest, pytest

---

### Task 1: Backend constants and model changes

**Files:**
- Modify: `src/retirement_model/constants.py:110-111`
- Modify: `src/retirement_model/models.py:324`
- Test: `tests/test_models.py:136`

**Step 1: Update constants**

In `src/retirement_model/constants.py`, replace `DEFAULT_GROWTH_RATE` with the new constants:

```python
# Per-account growth rate assumptions
EQUITY_RETURN = 0.10
BOND_RETURN = 0.04
CONSERVATIVE_GROWTH_FACTOR = 0.75
```

**Step 2: Update SimulationConfig model**

In `src/retirement_model/models.py`, line 324, replace:

```python
investment_growth_rate: float = Field(default=DEFAULT_GROWTH_RATE, ge=-0.5, le=0.5)
```

with:

```python
conservative_growth: bool = Field(default=False)
```

Update the import from constants (remove `DEFAULT_GROWTH_RATE` if no longer used elsewhere).

**Step 3: Fix test_models.py**

In `tests/test_models.py:136`, replace:

```python
assert cfg.investment_growth_rate == 0.06  # default
```

with:

```python
assert cfg.conservative_growth is False  # default
```

**Step 4: Run tests to check for breakage**

Run: `python -m pytest tests/test_models.py -x -q`

This will show remaining references to `investment_growth_rate` that need fixing in later tasks.

**Step 5: Commit**

```
git add src/retirement_model/constants.py src/retirement_model/models.py tests/test_models.py
git commit -m "feat: replace investment_growth_rate with conservative_growth and per-account constants"
```

---

### Task 2: Backend growth logic — apply_growth per-account rates

**Files:**
- Modify: `src/retirement_model/withdrawals.py:153-182`
- Modify: `src/retirement_model/constants.py` (import)
- Test: `tests/test_withdrawals.py:245-556`

**Step 1: Write new tests for per-account growth**

In `tests/test_withdrawals.py`, add a new test class after the existing `TestApplyGrowth` class. The existing tests call `apply_growth(accounts, rate)` — the new signature is `apply_growth(accounts, rate=None, conservative=False)`.

```python
class TestPerAccountGrowth:
    """Per-account growth rates derived from stock_pct."""

    def test_high_equity_grows_faster(self):
        """80% stock account should grow faster than 40% stock account."""
        acc_high = Account(id="h", name="High Eq", balance=100000, type=AccountType.IRA,
                           owner=Owner.PRIMARY, stock_pct=80)
        acc_low = Account(id="l", name="Low Eq", balance=100000, type=AccountType.IRA,
                          owner=Owner.PRIMARY, stock_pct=40)
        apply_growth([acc_high], conservative=False)
        apply_growth([acc_low], conservative=False)
        assert acc_high.balance > acc_low.balance

    def test_per_account_rate_formula(self):
        """60% stock IRA should grow at 0.6*0.10 + 0.4*0.04 = 0.076."""
        acc = Account(id="a", name="IRA", balance=100000, type=AccountType.IRA,
                      owner=Owner.PRIMARY, stock_pct=60)
        apply_growth([acc], conservative=False)
        assert acc.balance == pytest.approx(107600, rel=1e-3)

    def test_conservative_reduces_growth(self):
        """Conservative mode applies 0.75 multiplier to per-account rate."""
        acc_normal = Account(id="n", name="Normal", balance=100000, type=AccountType.IRA,
                             owner=Owner.PRIMARY, stock_pct=60)
        acc_conservative = Account(id="c", name="Conserv", balance=100000, type=AccountType.IRA,
                                   owner=Owner.PRIMARY, stock_pct=60)
        apply_growth([acc_normal], conservative=False)
        apply_growth([acc_conservative], conservative=True)
        # Normal: 7.6%, Conservative: 7.6% * 0.75 = 5.7%
        assert acc_normal.balance == pytest.approx(107600, rel=1e-3)
        assert acc_conservative.balance == pytest.approx(105700, rel=1e-3)

    def test_brokerage_drag_applied_after_conservative(self):
        """Brokerage: conservative rate minus drag."""
        acc = Account(id="b", name="Brk", balance=100000, type=AccountType.BROKERAGE,
                      owner=Owner.PRIMARY, stock_pct=60, cost_basis_ratio=0.5)
        apply_growth([acc], conservative=True)
        # Rate = 0.076 * 0.75 = 0.057, drag = 0.6*0.0022 + 0.4*0.01 = 0.00532
        # Effective = 0.057 - 0.00532 = 0.05168
        assert acc.balance == pytest.approx(105168, rel=1e-2)

    def test_mc_rate_overrides_per_account(self):
        """When rate is provided (MC path), it overrides the per-account formula."""
        acc = Account(id="a", name="IRA", balance=100000, type=AccountType.IRA,
                      owner=Owner.PRIMARY, stock_pct=60)
        apply_growth([acc], rate=0.12, conservative=False)
        assert acc.balance == pytest.approx(112000, rel=1e-3)

    def test_cash_cd_zero_growth_regardless(self):
        """Cash/CD always gets 0% regardless of stock_pct or conservative."""
        acc = Account(id="c", name="Cash", balance=100000, type=AccountType.CASH_CD,
                      owner=Owner.PRIMARY, stock_pct=50)
        apply_growth([acc], conservative=True)
        assert acc.balance == 100000

    def test_none_stock_pct_uses_default(self):
        """When stock_pct is None, use ACCOUNT_TYPE_DEFAULTS."""
        acc = Account(id="a", name="IRA", balance=100000, type=AccountType.IRA,
                      owner=Owner.PRIMARY)
        assert acc.stock_pct is None
        apply_growth([acc], conservative=False)
        # Default IRA stock_pct is 60, so rate = 0.076
        assert acc.balance == pytest.approx(107600, rel=1e-3)
```

**Step 2: Run tests to verify they fail**

Run: `python -m pytest tests/test_withdrawals.py::TestPerAccountGrowth -x -v`
Expected: FAIL (signature mismatch)

**Step 3: Implement new apply_growth**

In `src/retirement_model/withdrawals.py`, replace `apply_growth`:

```python
from retirement_model.constants import EQUITY_RETURN, BOND_RETURN, CONSERVATIVE_GROWTH_FACTOR

def account_growth_rate(stock_pct: float | None, account_type: AccountType) -> float:
    """Compute nominal growth rate from stock/bond allocation."""
    if stock_pct is None:
        stock_pct = ACCOUNT_TYPE_DEFAULTS[account_type]["default_stock_pct"]
    s = float(stock_pct) / 100.0
    return s * EQUITY_RETURN + (1 - s) * BOND_RETURN


def apply_growth(
    accounts: list[Account],
    rate: float | None = None,
    conservative: bool = False,
) -> float:
    """Apply investment growth to all accounts and return total balance.

    When rate is provided (Monte Carlo path), it is used as the base rate for all
    accounts. When rate is None (single-run path), each account's rate is computed
    from its stock/bond allocation.

    Cash/CD accounts skip growth. Brokerage accounts suffer tax drag.
    Brokerage cost_basis_ratio is recalculated after growth.
    """
    total = 0.0
    for acc in accounts:
        if acc.type != AccountType.CASH_CD:
            if rate is not None:
                base_rate = rate
            else:
                base_rate = account_growth_rate(acc.stock_pct, acc.type)
                if conservative:
                    base_rate *= CONSERVATIVE_GROWTH_FACTOR

            is_brokerage = tax_category(acc.type) == TaxCategory.BROKERAGE
            if is_brokerage:
                old_basis = acc.balance * acc.cost_basis_ratio
                if acc.tax_drag_override is not None:
                    drag = acc.tax_drag_override
                else:
                    spct = acc.stock_pct
                    if spct is None:
                        spct = ACCOUNT_TYPE_DEFAULTS[acc.type]["default_stock_pct"]
                    drag = calculate_tax_drag(float(spct))
                effective_rate = base_rate - drag
                acc.balance *= 1 + effective_rate
            else:
                acc.balance *= 1 + base_rate
            acc.balance = round(acc.balance, 2)
            if is_brokerage and acc.balance > 0:
                acc.cost_basis_ratio = old_basis / acc.balance
        total += acc.balance
    return total
```

**Step 4: Update existing apply_growth tests**

The existing `TestApplyGrowth` tests pass an explicit `rate` arg. Update calls from `apply_growth(accounts, 0.05)` to `apply_growth(accounts, rate=0.05)` so the keyword arg works. Same for `TestApplyGrowthCostBasis` and all other test classes that call `apply_growth`.

Search `tests/test_withdrawals.py` for all `apply_growth(` calls and add `rate=` keyword.

**Step 5: Run all withdrawal tests**

Run: `python -m pytest tests/test_withdrawals.py -x -q`
Expected: All pass

**Step 6: Commit**

```
git add src/retirement_model/withdrawals.py tests/test_withdrawals.py
git commit -m "feat: per-account growth rates in apply_growth"
```

---

### Task 3: Backend simulation loop — pass conservative flag

**Files:**
- Modify: `src/retirement_model/simulation.py:249-252,598`
- Modify: `src/retirement_model/monte_carlo.py` (verify MC path)
- Test: `tests/test_simulation.py`
- Test: `tests/conftest.py:65`

**Step 1: Update simulation.py**

In `src/retirement_model/simulation.py`, around lines 249-252, replace:

```python
year_return = (
    returns_sequence[year_idx]
    if returns_sequence and year_idx < len(returns_sequence)
    else cfg.investment_growth_rate
)
```

with:

```python
year_return = (
    returns_sequence[year_idx]
    if returns_sequence and year_idx < len(returns_sequence)
    else None
)
```

Around line 598, replace:

```python
total_balance = apply_growth(accounts, year_return)
```

with:

```python
total_balance = apply_growth(accounts, rate=year_return, conservative=cfg.conservative_growth)
```

Note: when `year_return` is from MC sequence, `conservative` is passed but won't affect anything because `rate is not None` takes the MC path. This is correct — conservative only applies to the formula-derived path.

**Step 2: Update conftest.py**

In `tests/conftest.py:65`, remove `investment_growth_rate=0.06` from the sample config fixture. Add `conservative_growth=False` if needed (should be the default, so may not be required).

**Step 3: Update test_simulation.py references**

In `tests/test_simulation.py`, find all `investment_growth_rate=0.06` and `investment_growth_rate=0.0` references (lines 373, 469, 1287) and remove them. The simulation will now use per-account rates.

For line 1287 (the zero-growth edge case test), this test was testing what happens with 0% growth. Replace it with a test using `conservative_growth=True` or adjust the test to set all account `stock_pct=0` (all bonds = 4% growth, not zero). Alternatively, if truly testing depletion, set `stock_pct=0` on accounts and keep the test logic.

**Step 4: Update test_cli.py**

In `tests/test_cli.py:28`, remove `"investment_growth_rate": 0.06` from the config dict.

**Step 5: Update test_fe_be_boundary.py**

In `tests/test_fe_be_boundary.py`:
- Line 31: Remove `"investment_growth_rate": 0.06` from base_portfolio config
- Lines 141-142: The `TestGrowthAndInflationAffectSimulation` class tests high vs low growth rate. Replace with conservative vs normal:

```python
class TestGrowthAndInflationAffectSimulation:
    def test_conservative_growth_means_lower_balance(self, client, base_portfolio):
        normal = _simulate(client, _set_config(base_portfolio, "conservative_growth", False))
        conservative = _simulate(client, _set_config(base_portfolio, "conservative_growth", True))
        assert normal["summary"]["final_balance"] > conservative["summary"]["final_balance"]

    def test_higher_inflation_means_lower_balance(self, client, base_portfolio):
        low_inf = _simulate(client, _set_config(base_portfolio, "inflation_rate", 0.01))
        high_inf = _simulate(client, _set_config(base_portfolio, "inflation_rate", 0.06))
        assert low_inf["summary"]["final_balance"] > high_inf["summary"]["final_balance"]

    def test_all_bonds_depletes_faster_than_all_stocks(self, client, base_portfolio):
        """Accounts with 0% stocks (all bonds) grow at 4% vs 100% stocks at 10%."""
        bonds = deepcopy(base_portfolio)
        stocks = deepcopy(base_portfolio)
        for acc in bonds["accounts"]:
            acc["stock_pct"] = 0
        for acc in stocks["accounts"]:
            acc["stock_pct"] = 100
        bonds["config"]["annual_spend_net"] = 60000
        stocks["config"]["annual_spend_net"] = 60000
        r_bonds = _simulate(client, bonds)
        r_stocks = _simulate(client, stocks)
        assert r_stocks["summary"]["final_balance"] > r_bonds["summary"]["final_balance"]
```

**Step 6: Run all backend tests**

Run: `python -m pytest tests/ -x -q`
Expected: All pass

**Step 7: Commit**

```
git add src/retirement_model/simulation.py tests/
git commit -m "feat: simulation uses per-account growth, conservative flag"
```

---

### Task 4: Frontend types, schema, stores

**Files:**
- Modify: `ui/src/lib/types.ts:251,390`
- Modify: `ui/src/lib/schema.ts:121`
- Modify: `ui/src/lib/stores.svelte.ts:61`
- Modify: `ui/src/lib/sampleScenarios.ts:21,116,224`
- Test: `ui/src/lib/schema.test.ts:35,271`
- Test: `ui/src/lib/stores.test.ts:184`
- Test: `ui/src/lib/api.test.ts:13`
- Test: `ui/src/lib/chartEvents.test.ts:15`

**Step 1: Update types.ts**

In `ui/src/lib/types.ts`, line 251, replace:

```typescript
investment_growth_rate: number;
```

with:

```typescript
conservative_growth: boolean;
```

In the `ComparisonSnapshot` interface (line 390), replace:

```typescript
growthRate: number;
```

with:

```typescript
conservativeGrowth: boolean;
```

**Step 2: Update schema.ts**

In `ui/src/lib/schema.ts`, line 121, replace:

```typescript
investment_growth_rate: z.number().min(-0.5).max(0.5),
```

with:

```typescript
conservative_growth: z.boolean(),
```

**Step 3: Update stores.svelte.ts**

In `ui/src/lib/stores.svelte.ts`, line 61, replace:

```typescript
investment_growth_rate: 0.07,
```

with:

```typescript
conservative_growth: false,
```

**Step 4: Update sampleScenarios.ts**

In `ui/src/lib/sampleScenarios.ts`, replace all three `investment_growth_rate` lines (21, 116, 224) with:

```typescript
conservative_growth: false,
```

**Step 5: Update test files**

In `ui/src/lib/schema.test.ts`, replace `investment_growth_rate: 0.06` with `conservative_growth: false` (lines 35, 271).

In `ui/src/lib/api.test.ts:13`, replace `investment_growth_rate: 0.06` with `conservative_growth: false`.

In `ui/src/lib/chartEvents.test.ts:15`, replace `investment_growth_rate: 0.06` with `conservative_growth: false`.

In `ui/src/lib/stores.test.ts:184`, replace:

```typescript
expect(defaultPortfolio.config.investment_growth_rate).toBeDefined();
```

with:

```typescript
expect(defaultPortfolio.config.conservative_growth).toBe(false);
```

**Step 6: Run frontend tests to check progress**

Run: `cd ui && npx vitest run`
Expected: Some failures in SimulateSettings and simulate.test.ts (fixed in later tasks)

**Step 7: Commit**

```
git add ui/src/lib/types.ts ui/src/lib/schema.ts ui/src/lib/stores.svelte.ts ui/src/lib/sampleScenarios.ts ui/src/lib/schema.test.ts ui/src/lib/api.test.ts ui/src/lib/chartEvents.test.ts ui/src/lib/stores.test.ts
git commit -m "feat: replace investment_growth_rate with conservative_growth in types/schema/stores"
```

---

### Task 5: Frontend growth rate utility

**Files:**
- Modify: `ui/src/lib/taxDrag.ts`
- Test: `ui/src/lib/taxDrag.test.ts`

**Step 1: Add growth rate constants and function**

In `ui/src/lib/taxDrag.ts`, add:

```typescript
export const EQUITY_RETURN = 0.10;
export const BOND_RETURN = 0.04;
export const CONSERVATIVE_GROWTH_FACTOR = 0.75;

/**
 * Compute effective growth rate for an account from its stock allocation.
 * Includes tax drag reduction for brokerage accounts.
 */
export function computeEffectiveGrowth(
   stockPct: number,
   isBrokerage: boolean,
   taxDragOverride?: number,
): number {
   const s = stockPct / 100;
   const nominal = s * EQUITY_RETURN + (1 - s) * BOND_RETURN;
   if (!isBrokerage) return nominal;
   const drag = taxDragOverride ?? estimateTaxDrag(stockPct);
   return nominal - drag;
}
```

**Step 2: Add tests**

In `ui/src/lib/taxDrag.test.ts`, add a new describe block:

```typescript
describe('computeEffectiveGrowth', () => {
   it('computes rate for 60/40 non-brokerage', () => {
      const rate = computeEffectiveGrowth(60, false);
      expect(rate).toBeCloseTo(0.076, 4);
   });

   it('computes rate for 80/20 non-brokerage', () => {
      const rate = computeEffectiveGrowth(80, false);
      expect(rate).toBeCloseTo(0.088, 4);
   });

   it('subtracts drag for brokerage', () => {
      const rate = computeEffectiveGrowth(60, true);
      // 0.076 - estimateTaxDrag(60) = 0.076 - ~0.00532
      expect(rate).toBeLessThan(0.076);
      expect(rate).toBeGreaterThan(0.06);
   });

   it('uses tax drag override when provided', () => {
      const rate = computeEffectiveGrowth(60, true, 0.01);
      expect(rate).toBeCloseTo(0.066, 4);
   });

   it('100% stocks gives equity return', () => {
      expect(computeEffectiveGrowth(100, false)).toBeCloseTo(0.10, 4);
   });

   it('0% stocks gives bond return', () => {
      expect(computeEffectiveGrowth(0, false)).toBeCloseTo(0.04, 4);
   });
});
```

**Step 3: Run tests**

Run: `cd ui && npx vitest run src/lib/taxDrag.test.ts`
Expected: All pass

**Step 4: Commit**

```
git add ui/src/lib/taxDrag.ts ui/src/lib/taxDrag.test.ts
git commit -m "feat: computeEffectiveGrowth utility for per-account growth display"
```

---

### Task 6: SimulateSettings — remove growth input, add conservative checkbox

**Files:**
- Modify: `ui/src/lib/components/SimulateSettings.svelte:16-20,169-195`
- Modify: `ui/src/lib/components/portfolio/PortfolioEditor.svelte:32`
- Test: `ui/src/lib/components/SimulateSettings.test.ts:111`

**Step 1: Update SimulateSettings.svelte**

Remove the `growthError` derived (lines 16-20):

```typescript
// DELETE these lines:
let growthError = $derived(
   $formTouched
      ? ($validationErrors['config.investment_growth_rate'] ?? '')
      : '',
);
```

Replace the Growth % label/input block (lines 169-195) with a conservative growth checkbox:

```svelte
<label class="flex items-center gap-2 text-xs font-medium text-surface-600 dark:text-surface-400">
   <input
      type="checkbox"
      class="checkbox"
      bind:checked={$portfolio.config.conservative_growth}
   />
   Conservative growth
   <HelpButton topic="simulation-parameters" anchor="conservative-growth" />
</label>
```

**Step 2: Update PortfolioEditor.svelte**

In `ui/src/lib/components/portfolio/PortfolioEditor.svelte:32`, remove `'config.investment_growth_rate'` from the `configInputPaths` array.

**Step 3: Update SimulateSettings.test.ts**

In `ui/src/lib/components/SimulateSettings.test.ts:111`, replace the growth rate validation error test. Find the test that sets `validationErrors` for `config.investment_growth_rate` and either remove it or replace with a test for the conservative checkbox:

```typescript
it('renders conservative growth checkbox', () => {
   render(SimulateSettings);
   expect(screen.getByLabelText(/Conservative growth/i)).toBeInTheDocument();
});
```

**Step 4: Run tests**

Run: `cd ui && npx vitest run src/lib/components/SimulateSettings.test.ts`
Expected: All pass

**Step 5: Commit**

```
git add ui/src/lib/components/SimulateSettings.svelte ui/src/lib/components/portfolio/PortfolioEditor.svelte ui/src/lib/components/SimulateSettings.test.ts
git commit -m "feat: replace growth rate input with conservative growth checkbox"
```

---

### Task 7: AccountsEditor — show effective growth on collapsed row

**Files:**
- Modify: `ui/src/lib/components/portfolio/AccountsEditor.svelte` (compact row section, ~lines 441-477)
- Test: `ui/src/lib/components/portfolio/AccountsEditor.test.ts`

**Step 1: Add import and display**

In `AccountsEditor.svelte`, add import:

```typescript
import { computeEffectiveGrowth } from '$lib/taxDrag';
import { TAX_CATEGORY_MAP } from '$lib/types';  // already imported
```

In the compact row (the `{:else}` block with the `<button>` around line 441), add the effective growth rate display after the balance `<span>`. Insert between the balance span and the pie chart div:

```svelte
<span class="text-xs text-surface-500 dark:text-surface-400 flex-shrink-0 tabular-nums">
   {(computeEffectiveGrowth(
      account.stock_pct ?? ACCOUNT_TYPE_DEFAULTS[account.type].default_stock_pct,
      TAX_CATEGORY_MAP[account.type] === 'brokerage',
      account.tax_drag_override ?? undefined,
   ) * 100).toFixed(1)}%
</span>
```

This shows e.g. "7.6%" for a 60/40 IRA or "7.1%" for a 60/40 brokerage (after drag).

**Step 2: Add test**

In `AccountsEditor.test.ts`, add:

```typescript
it('shows effective growth rate on compact row', () => {
   render(AccountsEditor, {
      accounts: [makeAccount({ type: 'ira', stock_pct: 60 })],
   });
   expect(screen.getByText('7.6%')).toBeInTheDocument();
});

it('shows growth rate with drag for brokerage', () => {
   render(AccountsEditor, {
      accounts: [makeAccount({ type: 'brokerage', name: 'Brokerage', stock_pct: 60 })],
   });
   // 7.6% - ~0.53% drag ≈ 7.1%
   expect(screen.getByText('7.1%')).toBeInTheDocument();
});
```

**Step 3: Run tests**

Run: `cd ui && npx vitest run src/lib/components/portfolio/AccountsEditor.test.ts`
Expected: All pass

**Step 4: Commit**

```
git add ui/src/lib/components/portfolio/AccountsEditor.svelte ui/src/lib/components/portfolio/AccountsEditor.test.ts
git commit -m "feat: display per-account effective growth rate on compact row"
```

---

### Task 8: Comparison snapshots and +page.svelte

**Files:**
- Modify: `ui/src/routes/+page.svelte:86,69`
- Test: `ui/src/lib/components/simulate.test.ts`

**Step 1: Update +page.svelte snapshot creation**

In `ui/src/routes/+page.svelte`, line 86, replace:

```typescript
growthRate: c.investment_growth_rate,
```

with:

```typescript
conservativeGrowth: c.conservative_growth,
```

In the `snapshotKey` function (around line 69), replace `s.growthRate` with `s.conservativeGrowth` in the key string.

**Step 2: Update simulate.test.ts**

In `ui/src/lib/components/simulate.test.ts`:

- Line 14: Replace `expect(config.investment_growth_rate).toBeDefined()` with `expect(config.conservative_growth).toBe(false)`
- Lines 40-44: The snapshot name generation test uses `investment_growth_rate`. Remove the growth rate from the generated name since it's no longer a single number. Replace with conservative indicator:

```typescript
it('generates name from default config', () => {
   const name = generateSnapshotName(samplePortfolio.config);
   expect(name).toContain('3.0% infl');
   expect(name).toContain('Fixed Dollar');
});
```

Update `generateSnapshotName` in the test to not reference growth rate, or include "Conservative" when `conservative_growth` is true.

- Lines 71-126: Replace `growthRate: 0.06` / `growthRate: 0.07` with `conservativeGrowth: false` in all ComparisonSnapshot objects.

**Step 3: Run tests**

Run: `cd ui && npx vitest run src/lib/components/simulate.test.ts`
Expected: All pass

**Step 4: Commit**

```
git add ui/src/routes/+page.svelte ui/src/lib/components/simulate.test.ts
git commit -m "feat: update comparison snapshots for conservative_growth"
```

---

### Task 9: Import flow — remove blended growth rate setting

**Files:**
- Modify: `ui/src/lib/components/portfolio/ImportPortfolio.svelte:141-163`

**Step 1: Remove growth rate update from import**

In `ImportPortfolio.svelte`, lines 141-163, delete the entire block that computes `weightedReturn` and sets `investment_growth_rate`. The import still sets `stock_pct` on each account — growth rates now derive from that automatically.

**Step 2: Run full frontend tests**

Run: `cd ui && npx vitest run`
Expected: All pass

**Step 3: Commit**

```
git add ui/src/lib/components/portfolio/ImportPortfolio.svelte
git commit -m "refactor: remove blended growth rate from import (per-account rates replace it)"
```

---

### Task 10: Help content updates

**Files:**
- Modify: `ui/src/lib/help/en/accounts-tax-treatment.md`
- Modify: `ui/src/lib/help/en/simulation-parameters.md`

**Step 1: Update stock allocation help**

In `ui/src/lib/help/en/accounts-tax-treatment.md`, replace the "Stock Allocation" section (last paragraph) with:

```markdown
### Stock Allocation {#stock-allocation}

The stock percentage (equity allocation) for each account determines both the expected growth rate and tax drag.

**Growth rate formula:** Each account grows at a rate based on its stock/bond mix, using long-term historical return assumptions:

- Equities: 10% annual return
- Bonds: 4% annual return
- Formula: `stock% × 10% + bond% × 4%`

Examples: 80/20 → 8.8%, 60/40 → 7.6%, 40/60 → 6.4%

For brokerage (taxable) accounts, annual tax drag is subtracted — stock dividends and bond interest are taxed each year, reducing effective growth. The effective rate is shown on each account's summary row.

Tax-sheltered accounts (IRA, 401k, Roth) are not subject to tax drag — dividends and interest compound tax-free inside the account.

If not set, each account type has a default stock allocation (e.g., 60% for brokerage, 80% for Roth).
```

**Step 2: Update simulation parameters help**

In `ui/src/lib/help/en/simulation-parameters.md`, replace the "Growth Rate" section with:

```markdown
### Conservative Growth {#conservative-growth}

By default, each account grows at a rate determined by its stock/bond allocation (see Stock Allocation in Accounts & Tax Treatment). Enable "Conservative growth assumptions" to reduce all account growth rates by 25%, modeling a lower-return environment.

For example, a 60/40 account normally grows at 7.6%. With conservative growth enabled, it grows at 5.7% (7.6% × 0.75).

This setting only affects single deterministic simulations. In Monte Carlo mode, historical market returns are sampled directly and this setting has no effect.
```

**Step 3: Commit**

```
git add ui/src/lib/help/en/accounts-tax-treatment.md ui/src/lib/help/en/simulation-parameters.md
git commit -m "docs: update help content for per-account growth and conservative mode"
```

---

### Task 11: Full verification

**Step 1: Run all backend tests**

Run: `python -m pytest tests/ -x -q`
Expected: All pass (~353 tests)

**Step 2: Run all frontend tests**

Run: `cd ui && npx vitest run`
Expected: All pass (~449+ tests)

**Step 3: Run lint**

Run: `make lint`
Expected: Clean (no new warnings)

**Step 4: Run svelte-check**

Run: `cd ui && npx svelte-check --tsconfig ./tsconfig.json`
Expected: No errors

**Step 5: Commit any remaining fixes, then final commit if needed**
