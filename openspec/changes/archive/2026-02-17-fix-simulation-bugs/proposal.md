## Why

The simulation engine has 14 correctness bugs identified in a comprehensive module review (todo/002-identified-issues.md). These produce materially incorrect financial results — flat tax rates instead of progressive brackets, cost basis never updating, capital gains not stacked progressively, spouse income gated by wrong age, and the Monte Carlo API using a simplified model that ignores taxes entirely.

## What Changes

- Use progressive `calculate_income_tax()` instead of flat marginal rate multiplication
- Track absolute cost basis on brokerage accounts (adjusts on growth, deposits, withdrawals)
- Implement progressive capital gains calculation stacking gains on ordinary income
- Gate income streams by owner age (primary vs spouse) instead of always primary
- Create dedicated `excess_income` brokerage account for surplus cash with proper 100% basis tracking
- Tax only the taxable portion of income streams, not gross
- Use incremental progressive calculation for Roth conversion tax
- **BREAKING**: Remove `tax_rate_capital_gains` config field entirely (always use tiered brackets)
- Fix bracket label off-by-one (10% bracket labeled as 12%)
- Separate RMD withdrawals by account owner to prevent cross-owner contamination
- Use `calculate_ss_taxable_portion()` instead of hardcoded 85%
- Skip investment growth for cash/CD accounts
- Wire API `/monte-carlo` endpoint to `run_full_monte_carlo` (full simulation logic)

## Capabilities

### New Capabilities
_None_

### Modified Capabilities
- `tax-calculations`: Progressive income tax in simulation, progressive capital gains stacking, remove flat cap gains override, fix bracket labels, correct SS taxable portion
- `withdrawal-ordering`: Cost basis tracking (absolute basis), skip cash/CD growth, RMD withdrawal by owner, excess income account
- `simulation-orchestration`: Spouse age gating for income streams, stream withholding on taxable portion only, conversion tax progressive calculation, tax reconciliation improvements
- `monte-carlo`: Wire API to full Monte Carlo (not simplified model)
- `portfolio-editor`: Remove capital gains % from Advanced Settings UI

## Impact

- **Backend**: `simulation.py`, `taxes.py`, `withdrawals.py`, `monte_carlo.py`, `models.py`, `constants.py`, `api.py`
- **Frontend**: Remove `tax_rate_capital_gains` from schema, types, stores, and Advanced Settings UI
- **API**: `/monte-carlo` endpoint behavior changes (uses full simulation, will be slower but correct)
- **Tests**: Extensive test updates across backend and frontend to match new behavior
