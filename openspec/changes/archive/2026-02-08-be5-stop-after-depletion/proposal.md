## Why

The simulation continues producing year-by-year rows after all accounts hit $0, generating useless rows with zero balances for the remaining years. This clutters API responses, CLI output, and charts.

## What Changes

- After recording a year where total balance reaches $0, break the simulation loop
- API returns fewer rows (only up to depletion year)
- CLI output stops at depletion
- Monte Carlo simulations also stop individual runs at depletion

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `simulation-orchestration`: Add early termination when all account balances reach zero

## Impact

- `src/retirement_model/simulation.py` — add break after recording depleted year
- API responses return fewer rows for depleted portfolios
- Monte Carlo runs terminate individual simulations at depletion (already tracks depletion correctly, just runs extra years)
- No FE dependency — fewer rows is transparent
