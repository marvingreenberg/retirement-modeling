## Why

The simulation produces year-by-year aggregate results, but users need actionable per-account withdrawal plans — which accounts to draw from, how much, estimated taxes, and conversion details. This turns the abstract simulation into a concrete "what do I do this year?" guide.

## What Changes

- Backend: Track per-account withdrawal details through the simulation loop
- Backend: Add withdrawal detail fields to YearResult model
- Frontend: Add a "Withdrawal Plan" section to the Details page showing the first 2 years with per-account breakdowns, tax estimates, and conversion details

## Capabilities

### New Capabilities
- `withdrawal-plan`: Per-account withdrawal plan display for current and next year

### Modified Capabilities
- `withdrawal-ordering`: WithdrawalResult returns per-account details
- `simulation-orchestration`: YearResult carries per-account withdrawal breakdown

## Impact

- `src/retirement_model/withdrawals.py` — WithdrawalResult gains per-account tracking
- `src/retirement_model/models.py` — YearResult gains withdrawal detail fields
- `src/retirement_model/simulation.py` — capture per-account details from withdrawal calls
- `ui/src/lib/types.ts` — YearResult interface expanded
- `ui/src/routes/details/+page.svelte` — new Withdrawal Plan section
- Backend and frontend tests
