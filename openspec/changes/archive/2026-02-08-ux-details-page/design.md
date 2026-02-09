## Context

Simulation results (singleResult, mcResult, lastRunMode) are currently local `$state` in `+page.svelte`. The details page at `/details` is a placeholder. The year-by-year table lives inside SimulateView in a CollapsibleSection.

## Goals / Non-Goals

**Goals:**
- Details page shows year-by-year table for single runs and percentile table for Monte Carlo
- Results are shared across pages via a Svelte store
- SimulateView stays focused on summary + charts
- "No results" empty state when no simulation has been run

**Non-Goals:**
- CSV/Excel export (future)
- Sorting or filtering the table (future)
- Details page for comparison results

## Decisions

1. **Shared results store**: Add `simulationResults` writable store to `stores.ts` holding `{ singleResult, mcResult, lastRunMode }`. The `+page.svelte` writes to this store after API calls; `/details/+page.svelte` reads from it.

2. **Keep local loading/error state**: Loading and error state remain in `+page.svelte` since they're only relevant to the simulate tab.

3. **Details page structure**: Single run shows the year-by-year table (same columns as current). Monte Carlo shows yearly percentile data in tabular form. Both show a "run a simulation first" message when no results exist.

4. **Remove CollapsibleSection from SimulateView**: The year-by-year table moves entirely to `/details`. SimulateView keeps summary cards, BalanceChart, FanChart, depletion analysis, and Add to Comparison button.

## Risks / Trade-offs

- **Store vs page state**: Moving results to a store means they persist across page navigations (pro) but also persist after the user changes portfolio inputs without re-running (con). Acceptable since "Run" clears previous results.
- **No deep linking**: Results are in-memory only, not URL-persisted. Refreshing `/details` shows empty state. Acceptable for now.
