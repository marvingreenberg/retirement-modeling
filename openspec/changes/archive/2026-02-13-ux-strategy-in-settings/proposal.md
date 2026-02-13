## Why

The spending *strategy* (how to withdraw) is a simulation assumption alongside inflation and growth rate, but it lives on a separate /spending page. Meanwhile the /spending page mixes strategy selection with budget planning (annual spend + planned expenses). Users must navigate away from the simulate panel to change their withdrawal approach.

## What Changes

- Move spending strategy dropdown and its conditional params (withdrawal rate, guardrails config) into SimulateSettings between the primary row and Advanced section
- Rename /spending route to /budget, update nav label to "Budget"
- /budget page keeps annual spending amount and planned expenses only (the budget plan)
- Strategy display in collapsed summary text (e.g., "Fixed/$120K" or "4%/POP")

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `simulate-tab-layout`: Add withdrawal strategy and conditional params between primary assumptions and Advanced
- `spending-page`: Rename to budget page, remove strategy controls (kept on simulate settings)

## Impact

- `ui/src/lib/components/SimulateSettings.svelte` — Add strategy dropdown + conditional params
- `ui/src/routes/spending/+page.svelte` — Remove strategy section, rename page heading
- `ui/src/routes/spending/` → `ui/src/routes/budget/` — Rename route directory
- `ui/src/lib/components/AppBar.svelte` — Update nav link
- `ui/src/routes/+page.svelte` — Update warning text referencing "Spending page"
- Tests updated to match
