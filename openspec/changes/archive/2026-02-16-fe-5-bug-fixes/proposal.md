## Why

Several UI input and display issues make the spending/simulation configuration confusing: inflation input silently converts between percent and decimal with unclear validation errors, the Roth conversion strategy selector appears even when conversions can't occur, and spending is displayed only as an annual figure despite users thinking in monthly terms. The API already returns monthly/annual spend data that the UI ignores.

## What Changes

- Fix inflation input to show clear "%" suffix and display field-level validation errors instead of a generic error banner on the Portfolio pane
- Disable or annotate the Roth conversion strategy selector when the user's age is at or past RMD start age
- Change spending display to show monthly as primary with annual as secondary note
- Wire up `initial_monthly_spend` and `initial_annual_spend` from the API summary into the SimulateView results and landing page summary
- Update TypeScript types to include the spending fields in SimulationResponse summary

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `simulate-tab-layout`: Add effective spending display (monthly/annual) to simulation results summary
- `landing-page`: Show monthly spending in portfolio summary area
- `spending-page`: Change spending input to monthly-primary display with annual note
- `portfolio-editor`: Improve validation error display for inflation and other config fields
- `roth-conversions`: Disable/annotate conversion strategy when past RMD age

## Impact

- `ui/src/lib/components/SimulateSettings.svelte` — inflation input, conversion selector
- `ui/src/lib/components/SimulateView.svelte` — spending display in results
- `ui/src/lib/components/portfolio/SpendingEditor.svelte` — monthly input
- `ui/src/lib/components/portfolio/PortfolioEditor.svelte` — validation error display
- `ui/src/routes/+page.svelte` — landing page summary
- `ui/src/lib/types.ts` — SimulationResponse summary type
- No backend changes needed (API already returns the data)
