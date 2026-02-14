## Context

The simulation now inflation-indexes all tax thresholds each year (BE-3), but the bracket structure itself — 7 brackets with specific rate levels — is fixed at the 2024 TCJA structure for the entire simulation. In reality, tax policy changes legislatively every few years: bracket counts, rate levels, standard deductions, and cap gains rates shift discretely. Over a 30-year horizon, assuming TCJA persists is a significant assumption. Monte Carlo already varies returns and inflation; this change adds tax regime variation to capture policy risk.

The block-sampling infrastructure in `monte_carlo.py` already demonstrates the pattern: sample from historical data, hold for a block of years, then sample again. Tax regime sampling follows the same pattern but with longer blocks (2-4 years, matching political cycles).

## Goals / Non-Goals

**Goals:**
- Define ~8 historical tax regimes covering 1970s through TCJA, each with a complete bracket structure
- All regimes normalized to 2024 dollars (inflation-adjusted once at data entry time, not at runtime)
- Sample regimes in blocks of 2-4 years to simulate political cycles
- Pass regime data per year to `run_simulation` so it overrides base brackets
- Layer correctly with BE-3: regime provides the base brackets, then cumulative inflation scales them
- Optional flag (`vary_tax_regimes`), default off, so existing behavior is preserved

**Non-Goals:**
- Predicting future tax policy or modeling specific proposals
- State/local tax regime variation (remains a flat rate config input)
- Regime-correlated returns (no linkage between tax regime and market returns)
- UI for regime selection or display of regime names in results

## Decisions

1. **Data module structure** — New file `historical_tax_regimes.py` containing a list of regime dicts. Each regime has: `name`, `federal_brackets` (7-entry list matching `FEDERAL_TAX_BRACKETS_MFJ` format), `capital_gains_brackets` (3-entry list matching `CAPITAL_GAINS_BRACKETS_MFJ`), `standard_deduction`, `irmaa_tiers` (6-entry list matching `IRMAA_TIERS_MFJ`). All dollar amounts in 2024 equivalent. This mirrors the constants structure so `inflate_brackets` works directly.

   *Alternative considered*: Storing regimes as TaxBracket pydantic models — rejected because the simulation already works with dict brackets (from BE-3) and adding model conversion is unnecessary overhead.

2. **Regime normalization approach** — All historical brackets are hand-normalized to 2024 dollars using CPI data at data entry time. This means the regime data is static and doesn't need runtime inflation adjustment for normalization. BE-3 inflation indexing then applies on top during simulation.

   *Alternative considered*: Storing nominal historical values and normalizing at runtime — rejected because it requires additional CPI data and adds complexity for ~8 static entries that can be computed once.

3. **Eras with fewer brackets** — Historical eras with fewer than 7 brackets (e.g., TRA86 had 2 brackets: 15% and 28%) are padded to 7 by repeating the top rate at increasing thresholds. This keeps the data structure uniform and avoids conditionals in the simulation loop.

4. **IRMAA before 2007** — IRMAA didn't exist before 2007. Pre-2007 regimes set IRMAA tier limits to `float("inf")` with cost 0 for all tiers. Structure stays uniform.

5. **Regime sampling** — New function `sample_regime_sequence(num_years, regimes, seed)` that produces a `list[dict]` of length `num_years`. Selects a regime uniformly at random and holds it for a random block of 2-4 years, then selects again. Uses the same seed-offset pattern as return sampling.

6. **Simulation integration** — `run_simulation` gains an optional `tax_regime_sequence: list[dict] | None` parameter. When provided, each year's regime dict overrides the base constants (`FEDERAL_TAX_BRACKETS_MFJ`, etc.) before inflation indexing is applied. This means: `inflated_brackets = inflate_brackets(regime["federal_brackets"], inflation_factor)`. When `None`, behavior is unchanged (uses the 2024 constants from `constants.py`).

7. **Monte Carlo integration** — `run_full_monte_carlo` checks `portfolio.config.vary_tax_regimes`. When True, each iteration samples a regime sequence alongside returns and inflation, and passes it to `run_simulation`. When False (default), no regime sequence is passed.

8. **Config model** — Add `vary_tax_regimes: bool = False` to `SimulationConfig`. No new API endpoints needed.

## Risks / Trade-offs

- **Historical accuracy of regime data** — The ~8 regimes are approximations. Tax law has many nuances (phase-outs, AMT, credits) that can't be captured in bracket structures alone. → Mitigation: This is a Monte Carlo exercise to capture policy risk range, not a precise historical recreation.
- **Regime block length** — Using 2-4 year blocks is a simplification of political cycles (some tax structures persist 10+ years). → Mitigation: The block length captures the idea that regimes are sticky, and averaging over many MC iterations smooths out any specific block pattern.
- **Performance** — Adding regime sampling to each MC iteration is negligible cost (just list indexing).
- **Results interpretation** — Users may not understand that tax regimes are varying. → Mitigation: Feature is opt-in and default off. When enabled, the API response could note "tax regime variation enabled" in the summary.
