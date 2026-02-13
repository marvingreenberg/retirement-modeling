## Context

Four spending strategies exist: `fixed_dollar`, `percent_of_portfolio`, `guardrails`, `rmd_based`. Only `fixed_dollar` uses `annual_spend_net` as the actual spending target. The other three compute spending dynamically from portfolio balance × some rate. The API summary doesn't report what spending the simulation actually computed, so the UI can't tell the user "you'd spend $X/mo with this strategy." There's also a bug: `percent_of_portfolio` reads from `guardrails_config.initial_withdrawal_rate` instead of the `withdrawal_rate` field.

## Goals / Non-Goals

**Goals:**
- Make the relationship between `annual_spend_net` and each strategy explicit in the model
- Surface computed initial spending in the API summary (`initial_annual_spend`, `initial_monthly_spend`)
- Fix `percent_of_portfolio` to use `withdrawal_rate` field
- Add `monthly_spend` property to config for UI convenience
- Enrich `/strategies` endpoint with field-usage metadata per strategy
- Align version to 0.9.0

**Non-Goals:**
- Modifying dynamic strategies to target a desired income (non-standard practice)
- Adding new spending strategies
- Changing the simulation loop order or tax calculations

## Decisions

1. **`annual_spend_net` stays required** — Making it optional adds validation complexity for minimal gain. Dynamic strategies already ignore it. The UI can pre-fill a reasonable default and explain that it only applies to `fixed_dollar`. This avoids a **BREAKING** API change.

2. **Initial spend comes from year-1 `spending_target`** — The simulation already computes and records `spending_target` per year in `YearResult`. The summary just pulls `years[0].spending_target` and divides by 12 for monthly. No new calculation needed.

3. **Fix `percent_of_portfolio` bug inline** — The function currently reads `state.guardrails_config.initial_withdrawal_rate` which is wrong. Change to accept `withdrawal_rate` as a parameter, passed through from `SimulationConfig.withdrawal_rate`.

4. **`/strategies` field-usage metadata** — Each strategy entry gets a `uses_fields` list and `ignores_fields` list so the UI can show/hide inputs appropriately.

5. **`monthly_spend` is a computed property** — `@property` on `SimulationConfig` returning `annual_spend_net / 12`. Not a stored field. Simple.

## Risks / Trade-offs

- **`percent_of_portfolio` fix is a behavior change** — Anyone relying on it using `guardrails_config.initial_withdrawal_rate` will see different results. Since the default `withdrawal_rate` is 0.04 and the default `guardrails_config.initial_withdrawal_rate` is 0.05, this changes the default percent_of_portfolio rate from 5% to 4%. This is actually the correct behavior — it should use the dedicated field.
- **Version bump** — Going from 1.0.0 to 0.9.0 is a downgrade in semver terms, but the previous version was prematurely set. The FE doesn't check API version.
