## Why

The spending strategies have unclear semantics around `annual_spend_net`. For `fixed_dollar` it's the actual spending target, but for `percent_of_portfolio`, `guardrails`, and `rmd_based` it's either ignored or only seeds initial state. The API doesn't communicate what the effective spending is for dynamic strategies, so the UI can't show users "here's what you'd actually spend" when they pick a non-fixed strategy. Also, `percent_of_portfolio` silently borrows `guardrails_config.initial_withdrawal_rate` instead of using the dedicated `withdrawal_rate` field — a bug.

## What Changes

- Make `annual_spend_net` optional for dynamic strategies (only required for `fixed_dollar`)
- Fix `percent_of_portfolio` to use `withdrawal_rate` field instead of borrowing from `guardrails_config`
- Add `initial_monthly_spend` and `initial_annual_spend` to the simulation summary response so the UI can display effective spending for any strategy
- Add `monthly_spend` convenience property to `SimulationConfig` (derives from `annual_spend_net`)
- Add spending strategy semantic descriptions to `/strategies` endpoint (which fields each strategy uses, which it ignores)
- Align version to `0.9.0` in `pyproject.toml` and API

## Capabilities

### New Capabilities

(none — all changes modify existing capabilities)

### Modified Capabilities

- `spending-strategies`: Fix `percent_of_portfolio` to use `withdrawal_rate`; make `annual_spend_net` only required for `fixed_dollar`; add strategy field-usage metadata to `/strategies` endpoint
- `simulation-orchestration`: Add `initial_monthly_spend` and `initial_annual_spend` to simulation summary; add `monthly_spend` convenience property to config model

## Impact

- `src/retirement_model/models.py` — `SimulationConfig.annual_spend_net` becomes optional (default None), add `monthly_spend` property
- `src/retirement_model/strategies.py` — Fix `_percent_of_portfolio_spending` to use `withdrawal_rate`
- `src/retirement_model/api.py` — Add spending fields to summary dict, enrich `/strategies` response, update version
- `src/retirement_model/simulation.py` — Pass withdrawal_rate to spending state, compute initial spend for summary
- `pyproject.toml` — Version bump to 0.9.0
- Tests updated for all changes
