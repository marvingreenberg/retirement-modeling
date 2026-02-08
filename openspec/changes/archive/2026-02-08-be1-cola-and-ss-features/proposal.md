## Why

The income stream model (added in `add-income-streams`) supports generic streams with fixed amounts. But BE-1 calls for COLA adjustments so income keeps pace with inflation, and Social Security features — auto-generating SS streams from profile data and computing actuarial adjustments for early/late claiming instead of requiring users to know their benefit at each age.

## What Changes

- Add optional `cola_rate` field to `IncomeStream` — amount grows annually by this rate (default: simulation inflation rate, `None` = no COLA)
- Add SS benefit formula: given a Full Retirement Age (FRA) benefit amount, compute the actuarial reduction for claiming before FRA and delayed retirement credits for claiming after FRA (up to 70)
- Add optional `ss_auto_generate` config: given primary/spouse FRA benefit amounts and desired start ages, auto-create SS income streams with correct adjusted amounts, taxability (85%), and age ranges
- Apply cumulative COLA to each income stream during the simulation loop
- All new fields optional with backward-compatible defaults — existing configs and UI work unchanged

## Capabilities

### New Capabilities
- `ss-benefit-formula`: Social Security benefit calculation — actuarial reduction/delayed credits based on claiming age vs FRA, and auto-generation of SS income streams from profile config

### Modified Capabilities
- `income-streams`: Add COLA adjustment field and cumulative COLA application during simulation
- `simulation-orchestration`: Apply per-stream COLA in the income stream loop; integrate auto-generated SS streams into income flow

## Impact

- `src/retirement_model/models.py` — `IncomeStream` gains `cola_rate`; new `SSAutoConfig` model; `SimulationConfig` gains optional `ss_auto` field
- `src/retirement_model/simulation.py` — COLA accumulation in income stream loop; SS auto-generation at simulation start
- New module `src/retirement_model/social_security.py` for benefit formula and stream generation
- `tests/` — new tests for SS formula, COLA growth, auto-generation
- API remains backward-compatible (all new fields optional with defaults)
