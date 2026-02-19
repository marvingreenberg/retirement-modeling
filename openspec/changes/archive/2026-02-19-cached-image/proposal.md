## Why

Simulation results persist visually after inputs change, giving users a false sense that the displayed charts/numbers reflect current data. Additionally, the Settings page navigation is awkward — "Done" is redundant with the nav bar, and sample data loading is buried in Basic Info instead of being next to the Load/Save section where users would expect it.

## What Changes

- Clear cached simulation results (charts, summary) whenever portfolio inputs change (accounts, income, expenses, budget, loaded data). Return to "Ready to simulate" state.
- Remove the "Done" button from the Settings page footer. Replace with a navigation link: `<= Overview` (using LayoutDashboard icon + "Overview" text) that links back to `/`.
- Move "Load Sample Data" dropdown from Basic Info section to the Load/Save section, positioned below the Load Portfolio button.
- Update the first-use welcome message to mention Load/Save for saved or sample data.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `simulation-orchestration`: Add requirement to clear cached results when portfolio inputs change
- `settings-page`: Remove Done button, add Overview nav link, move sample data to Load/Save, update welcome message
- `first-use-flow`: Update welcome message text to reference Load/Save for sample data

## Impact

- `ui/src/routes/+page.svelte` — watch for portfolio changes to clear simulation state
- `ui/src/lib/stores.ts` — may need a helper to reset simulation results
- `ui/src/routes/settings/+page.svelte` — remove Done button, add nav link, move sample data dropdown, update welcome text
- `ui/src/lib/components/FileControls.svelte` — may receive sample data dropdown (if FileControls is still used elsewhere)
- `ui/src/lib/components/WelcomeState.svelte` — update message text
