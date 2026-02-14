## Why

The simulation uses fixed 2024 tax brackets throughout all years (inflation-indexed via BE-3, but structurally unchanged). In reality, tax policy changes every few years via legislation — bracket counts, rate levels, standard deductions, and IRMAA thresholds shift discretely. Over a 30-year horizon, assuming today's tax structure is as unrealistic as assuming a single return rate. Monte Carlo already varies returns and inflation; adding tax regime variation captures policy risk.

## What Changes

- Add a historical tax regime data module with ~8 normalized regimes (1970s through TCJA), each containing 7-bracket federal structure, capital gains rate, standard deduction, and IRMAA tiers — all in 2024 dollars
- Add a regime sampling function that selects a regime and holds it for 2-4 years (simulating political cycles), then samples a new one
- Pass a per-year tax regime sequence to `run_simulation` alongside returns and inflation sequences
- Add an optional `vary_tax_regimes` flag to Monte Carlo config (default off, preserving current behavior)
- When enabled, each Monte Carlo iteration samples a different regime sequence

## Capabilities

### New Capabilities
- `tax-regime-data`: Historical tax regime definitions (bracket structures, cap gains rates, deductions, IRMAA tiers) normalized to 2024 dollars

### Modified Capabilities
- `monte-carlo`: Add regime sampling to Monte Carlo iteration loop, add `vary_tax_regimes` config flag
- `simulation-orchestration`: Accept optional tax regime sequence; when provided, override base brackets/rates for each year (layered with BE-3 inflation indexing)

## Impact

- New file: `src/retirement_model/historical_tax_regimes.py` — regime data and sampling function
- Modified: `simulation.py` — accept `tax_regime_sequence` parameter, apply regime brackets per year
- Modified: `monte_carlo.py` — sample regime sequences when `vary_tax_regimes` is enabled
- Modified: `models.py` — add `vary_tax_regimes` field to config
- Modified: `api.py` — pass through new config field
- No FE dependency — optional flag, default off
