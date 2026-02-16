## Why

The current UI requires users to choose between Single run and Monte Carlo before running a simulation. In practice, both views are useful — the single run gives detailed year-by-year insight while Monte Carlo shows probability of success across market conditions. Forcing a choice means users must run twice to see both perspectives.

## What Changes

- **Remove run mode radio buttons** from SimulateSettings — the Simulate button always triggers both simulations concurrently
- **Add tabbed results view** — "Simulation" and "Monte Carlo" tabs replace the conditional single/MC display in SimulateView and the Details page
- **Async MC loading** — single run displays immediately, MC tab shows a spinner until its result arrives
- **MC iterations input** moves to ProfileDrawer's Tax & Advanced section (accessed via `numSimulations` store)
- **Warning text** on MC tab noting that Monte Carlo uses historically-sampled returns, not configured values
- **Details page** also uses tabs instead of `lastRunMode`-based conditional

## Capabilities

### Modified Capabilities
- `simulate-tab-layout`: Remove run mode radio buttons, always run both simulations, display results in tabs
- `monte-carlo`: MC iterations control moves to ProfileDrawer; growth rate override indicator removed from settings since both always run

## Impact

- **Frontend components**: SimulateSettings (remove radio buttons/runMode/numSimulations props), SimulateView (tabbed display with mcLoading), ProfileDrawer (add MC iterations input), +page.svelte (concurrent API calls), details/+page.svelte (tabbed detail view)
- **State management**: Remove `lastRunMode` from `SimulationResultsState`, add `numSimulations` writable store
- **Backend API**: No changes
