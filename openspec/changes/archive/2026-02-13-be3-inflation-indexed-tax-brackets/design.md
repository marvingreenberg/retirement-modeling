## Context

Tax functions in `taxes.py` already accept optional bracket overrides (e.g., `calculate_income_tax` takes `brackets: list[TaxBracket] | None`, `calculate_irmaa_cost` takes `tiers: list[dict] | None`). The simulation loop in `simulation.py` already tracks `cumulative_inflation` per year. The missing piece is computing inflation-adjusted thresholds each year and passing them through.

## Goals / Non-Goals

**Goals:**
- Apply cumulative inflation to all tax thresholds each simulation year
- Cover: federal brackets, IRMAA tiers, capital gains brackets, standard deduction, conversion ceiling
- Use existing function signatures where possible (they already accept overrides)

**Non-Goals:**
- Separate Chained CPI-U configuration (the general inflation rate is a close enough proxy)
- Legislative tax regime changes (that's BE-4)
- Changing base-year constants or config model

## Decisions

1. **Add a helper to inflate thresholds** — A utility function `inflate_thresholds(base_values, factor)` that scales all limit/threshold fields by the cumulative inflation factor. Works generically on the dict-based bracket/tier structures in `constants.py`.

2. **Compute adjusted values once per year in the simulation loop** — At the top of each year iteration, compute inflation-adjusted brackets, tiers, deduction, and conversion ceiling. Pass these to tax functions.

3. **Conversion ceiling indexing** — `get_conversion_ceiling` currently returns hardcoded dollar amounts (383900, 201050). Change it to accept an `inflation_factor` parameter and scale the thresholds. The `irmaa_limit_tier_1` path already gets its value from config — that value should also be indexed.

4. **Standard deduction indexing** — The hardcoded `30000` on line 307 of `simulation.py` (used for `taxable_income = max(0, current_agi - 30000)`) should use `STANDARD_DEDUCTION_MFJ` from constants, scaled by inflation.

5. **No model or API changes** — This is purely internal to the simulation loop. Results just become more accurate.

## Risks / Trade-offs

- **Slightly different simulation results** — Tax liability will decrease in later years vs the current behavior, meaning portfolios survive longer and Roth conversions become more valuable. This is more accurate, not a regression.
- **Year 0 unchanged** — With `cumulative_inflation = 1.0` in year 0, all thresholds match the base 2024 values. No behavioral change for single-year simulations.
