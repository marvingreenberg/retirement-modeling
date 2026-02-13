## Why

The simulation uses fixed 2024-dollar tax brackets, IRMAA tiers, capital gains thresholds, and standard deduction for all years. The IRS annually indexes these using Chained CPI-U. Over a 30-year simulation, ignoring this indexing dramatically overstates tax liability in later years because nominal income grows with inflation but thresholds stay fixed. This biases withdrawal strategies and Roth conversion decisions toward being overly conservative.

The simulation's configured inflation rate is a reasonable proxy for Chained CPI-U (difference is typically ~0.2-0.3%/year). The loop already tracks `cumulative_inflation` per year.

## What Changes

- Inflation-index federal tax bracket limits each year by cumulative inflation
- Inflation-index IRMAA tier thresholds each year
- Inflation-index capital gains bracket thresholds each year
- Inflation-index the standard deduction each year
- Inflation-index the conversion ceiling (bracket-based thresholds) each year
- All indexing uses the simulation's per-year cumulative inflation factor
- Base-year values remain the 2024 constants (no config change needed)
- No API changes, no model changes, no breaking changes

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `tax-calculations`: Bracket limits, IRMAA tiers, capital gains thresholds, and standard deduction are inflation-indexed using cumulative inflation factor
- `simulation-orchestration`: Simulation loop computes inflation-adjusted thresholds each year and passes them to tax functions; conversion ceiling is inflation-indexed

## Impact

- `src/retirement_model/simulation.py` — Compute adjusted brackets/thresholds each year, pass to tax calls, index conversion ceiling
- `src/retirement_model/taxes.py` — Minor: ensure functions accept pre-adjusted values (mostly already do via parameters)
- `src/retirement_model/constants.py` — No changes (base-year values stay as-is)
- Tests updated to verify inflation indexing produces lower effective tax at later years
