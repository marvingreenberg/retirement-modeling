## Context

The `add-income-streams` change added generic `IncomeStream` support with fixed annual amounts, age-based activation, and partial taxability. The simulation loop in `simulation.py` sums active streams each year at their nominal `amount`.

BE-1 requires two additions: (1) COLA so income stream amounts grow over time, and (2) Social Security auto-generation with actuarial benefit adjustments, so users enter their FRA benefit once instead of computing reduced/increased amounts manually.

Social Security is currently modeled separately via `SocialSecurityConfig` (primary/spouse benefit + start ages), hard-coded at 85% taxability in `simulation.py`. This change unifies SS into the income stream framework.

## Goals / Non-Goals

**Goals:**
- Income streams grow by a per-stream COLA rate (or simulation inflation rate by default)
- SS benefit formula computes actuarial reduction (before FRA) and delayed credits (after FRA)
- Optional `ss_auto` config auto-generates SS income streams from profile data
- Backward compatible — existing `SocialSecurityConfig` and `IncomeStream` configs still work
- Existing `social_security` field remains the primary SS config path; `ss_auto` is an alternative

**Non-Goals:**
- Replacing `SocialSecurityConfig` entirely (would break existing configs/UI)
- Spousal benefits, survivor benefits, or earnings test
- SS COLA (annual SS cost-of-living adjustment) — that's BE-3 territory (inflation-indexing brackets/thresholds)
- Frontend changes

## Decisions

### COLA field design
`IncomeStream` gets `cola_rate: float | None = None`. Semantics:
- `None` (default) → no COLA, amount stays fixed (backward compatible)
- `0.0` → explicitly no growth
- Any float (e.g., `0.03`) → 3% annual growth

Alternative considered: defaulting to simulation inflation rate. Rejected because it silently changes behavior for existing configs that omit the field. Users opt in explicitly. The simulation can offer a convenience value like `"inflation"` in the future if needed.

Cumulative COLA is tracked per-stream as `amount * (1 + cola_rate) ^ years_active`. The stream's base `amount` is not mutated — COLA is applied at read time each year.

### SS benefit formula module
New `src/retirement_model/social_security.py` with:
- `compute_ss_benefit(fra_amount, claiming_age, fra_age)` → adjusted annual benefit
- `generate_ss_streams(ss_auto_config)` → list of `IncomeStream`

Formula (SSA rules):
- Before FRA: reduce by 5/9 of 1% per month for first 36 months early, then 5/12 of 1% per additional month
- After FRA: increase by 2/3 of 1% per month delayed (8% per year), up to age 70
- FRA defaults to 67 (born 1960+), configurable

### SS auto-generation config
New `SSAutoConfig` model with fields: `primary_fra_amount`, `primary_start_age`, `spouse_fra_amount`, `spouse_start_age`, `fra_age` (default 67). Added to `SimulationConfig` as `ss_auto: SSAutoConfig | None = None`.

When `ss_auto` is set, `generate_ss_streams()` produces `IncomeStream` entries with `taxable_pct=0.85`, appropriate start ages, and the actuarially adjusted amounts. These are prepended to `income_streams` at simulation start.

If both `social_security` and `ss_auto` are provided, `ss_auto` takes precedence and the old `social_security` SS income is skipped to avoid double-counting.

### Integration in simulation loop
The income stream block in `run_simulation` changes from:
```python
stream_income += stream.amount
```
to:
```python
years_active = age_primary - stream.start_age
cola_factor = (1 + stream.cola_rate) ** years_active if stream.cola_rate else 1.0
adjusted = stream.amount * cola_factor
stream_income += adjusted
```

SS auto-generated streams are materialized once at the top of `run_simulation` and added to the config's `income_streams` list (on the deep copy, not mutating the original).

## Risks / Trade-offs

- [COLA compounds from start_age, not from simulation start] → This is correct (a pension that started at 62 has been growing since 62), but users might expect COLA to begin at simulation start. Document clearly.
- [Two SS config paths] → Could confuse users. Mitigation: `ss_auto` is clearly an alternative; validation warns if both are set with conflicting data.
- [FRA simplification] → Defaulting FRA to 67 is correct for anyone born 1960+. For older users (born 1955-1959), FRA is 66+months. We use 67 as default but make it configurable.
