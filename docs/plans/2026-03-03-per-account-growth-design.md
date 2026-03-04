# Per-Account Growth Rates Design

## Summary

Replace the single global `investment_growth_rate` with per-account growth rates derived from each account's stock/bond allocation (`stock_pct`). Add a "Conservative growth assumptions" checkbox that applies a 0.75 multiplier to all rates.

## Growth Rate Formula

Each account's nominal growth rate:

```
rate = (stock_pct / 100) * EQUITY_RETURN + (1 - stock_pct / 100) * BOND_RETURN
```

Constants: `EQUITY_RETURN = 0.10` (10%), `BOND_RETURN = 0.04` (4%).

Examples:
- 80/20 stocks/bonds → 8.8%
- 60/40 → 7.6%
- 40/60 → 6.4%
- 0/100 bonds only → 4.0%

For brokerage accounts, the effective rate subtracts tax drag:

```
effective_rate = rate - tax_drag(stock_pct)
```

Cash/CD accounts: 0% growth (unchanged).

Conservative mode multiplies all nominal rates by 0.75 before drag subtraction:

```
conservative_rate = rate * 0.75
effective_rate = conservative_rate - tax_drag  (brokerage only)
```

## Backend Changes

### Constants (`constants.py`)

Add:
```python
EQUITY_RETURN = 0.10
BOND_RETURN = 0.04
CONSERVATIVE_GROWTH_FACTOR = 0.75
```

Remove: `DEFAULT_GROWTH_RATE = 0.06`

### Model (`models.py`)

`SimulationConfig`:
- Remove `investment_growth_rate: float`
- Add `conservative_growth: bool = False`

### Growth logic (`withdrawals.py`)

`apply_growth(accounts, rate, conservative)`:
- When `rate` is provided (Monte Carlo path), use it as-is per account (with drag for brokerage). The `conservative` flag does NOT apply to MC-sampled returns — those are historical.
- When `rate` is None (single-run path), compute per-account: `stock_pct * EQUITY_RETURN + (1 - stock_pct) * BOND_RETURN`, apply conservative multiplier if enabled, then subtract drag for brokerage.

### Simulation loop (`simulation.py`)

- Single run: call `apply_growth(accounts, rate=None, conservative=cfg.conservative_growth)`
- MC run: call `apply_growth(accounts, rate=year_return, conservative=False)` (sampled returns already reflect historical reality)

### API

No new endpoints. The `/simulate` and `/montecarlo` payloads lose `investment_growth_rate` and gain `conservative_growth`.

## Frontend Changes

### Types (`types.ts`)

- Remove `investment_growth_rate` from `SimulationConfig`
- Add `conservative_growth: boolean`

### Schema (`schema.ts`)

- Remove `investment_growth_rate` validation
- Add `conservative_growth: z.boolean()`

### Stores (`stores.ts` / `stores.svelte.ts`)

- Remove `investment_growth_rate` from default and sample portfolio configs
- Add `conservative_growth: false`

### Growth rate utility

Add `computeGrowthRate(stock_pct, is_brokerage, tax_drag?)` to `taxDrag.ts` (or a new `growthRate.ts`):
- Returns the effective display rate for an account
- Used by AccountsEditor for the collapsed row display

### SimulateSettings

- Remove Growth % input and its HelpButton
- Add checkbox: "Conservative growth assumptions" with HelpButton linking to updated help topic
- Label or subtitle text: "Reduces all growth rates by 25%"

### AccountsEditor (collapsed row)

Show effective growth rate on each collapsed account row, after balance. Format: "7.6%" or for brokerage with drag "7.1% eff". Include a small HelpButton or rely on the existing stock_pct help.

### Import flow (`ImportPortfolio.svelte`)

Remove the code that sets `investment_growth_rate` from blended returns. The import still sets `stock_pct` per account — growth rates derive from that automatically.

### Help content

**`accounts-tax-treatment.md`** — Update Stock Allocation section:

> The stock percentage determines each account's expected growth rate using historical return assumptions: 10% for equities, 4% for bonds. A 60% stock / 40% bond allocation yields a 7.6% expected return. For brokerage accounts, tax drag reduces the effective rate (dividends and capital gains distributions are taxed annually).

**`simulation-parameters.md`** — Replace Growth Rate section with Conservative Growth:

> By default, accounts grow at rates based on their stock/bond allocation (10% equity, 4% bond assumptions). Enable "Conservative growth assumptions" to reduce all growth rates by 25%, modeling a lower-return environment.

## Files to Modify

### Backend
- `src/retirement_model/constants.py` — add EQUITY_RETURN, BOND_RETURN, CONSERVATIVE_GROWTH_FACTOR; remove DEFAULT_GROWTH_RATE
- `src/retirement_model/models.py` — SimulationConfig: remove investment_growth_rate, add conservative_growth
- `src/retirement_model/withdrawals.py` — apply_growth: per-account rate computation
- `src/retirement_model/simulation.py` — pass conservative flag through
- `src/retirement_model/monte_carlo.py` — verify MC path still works (rate parameter replaces formula)

### Frontend
- `ui/src/lib/types.ts` — SimulationConfig type
- `ui/src/lib/schema.ts` — Zod schema
- `ui/src/lib/stores.svelte.ts` — default/sample data
- `ui/src/lib/taxDrag.ts` — add computeGrowthRate helper
- `ui/src/lib/components/SimulateSettings.svelte` — remove growth input, add checkbox
- `ui/src/lib/components/portfolio/AccountsEditor.svelte` — show rate on collapsed row
- `ui/src/lib/components/portfolio/ImportPortfolio.svelte` — remove blended rate setting
- `ui/src/lib/help/en/accounts-tax-treatment.md` — update stock allocation docs
- `ui/src/lib/help/en/simulation-parameters.md` — replace growth rate with conservative mode

### Tests
- Backend: update simulation/withdrawal/MC tests for new signature
- Frontend: update AccountsEditor, SimulateSettings, schema, store tests

## What Stays the Same

- Tax drag calculation and `tax_drag_override`
- Per-account `stock_pct` field and defaults
- Monte Carlo historical return sampling
- Cost basis tracking
- All other simulation logic
