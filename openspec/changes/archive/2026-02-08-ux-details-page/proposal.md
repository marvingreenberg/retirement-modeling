## Why

The `/details` page is currently a placeholder. The year-by-year detail table is buried inside a collapsible section on the simulate tab, making it hard to find and use. Moving detailed results to their own page gives them proper real estate and lets the simulate tab focus on summary + charts.

## What Changes

- Move year-by-year detail table from SimulateView's CollapsibleSection to `/details` page
- Add shared simulation results store so results are accessible across pages
- `/details` shows "no results" state when no simulation has been run, full table when results exist
- SimulateView removes the collapsible year-by-year section (summary + charts remain)
- Details page also shows Monte Carlo percentile data when MC mode was last run

## Capabilities

### New Capabilities
- `details-page`: Year-by-year detailed results view on the `/details` route

### Modified Capabilities
- `simulate-tab-layout`: Remove year-by-year detail table from the results area (moved to details page)

## Impact

- `ui/src/lib/stores.ts` — New simulation results store
- `ui/src/routes/details/+page.svelte` — Replace placeholder with real content
- `ui/src/lib/components/SimulateView.svelte` — Remove CollapsibleSection with year-by-year table
- `ui/src/routes/+page.svelte` — Write results to shared store instead of local state
