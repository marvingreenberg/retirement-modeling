## Why

Percentage inputs (Inflation %, Growth %, State Tax %, Cap Gains %, Withdrawal Rate, guardrails percentages) display raw decimal values (e.g., 0.03 for 3%). Users expect to type "3" for 3%, not "0.03". The label says "%" but the input shows a float, which is confusing and error-prone.

## What Changes

- All percentage inputs display values multiplied by 100 (3.0 instead of 0.03)
- User edits in human-friendly percentage form (type "3" for 3%)
- Values converted back to decimals for the portfolio store
- Input min/max/step updated accordingly (e.g., step 0.5 instead of 0.005)

## Capabilities

### Modified Capabilities
- `simulate-tab-layout`: Percentage inputs display as human-readable percentages

## Impact

- `ui/src/lib/components/SimulateSettings.svelte` — Convert all % inputs to display/edit as percentages
- `ui/src/routes/budget/+page.svelte` — No changes (no % inputs remain)
- Tests updated to verify percentage display
