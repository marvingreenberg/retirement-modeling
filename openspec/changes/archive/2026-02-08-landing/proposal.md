## Why

The landing page currently shows PortfolioEditor and SimulateView in a 50/50 side-by-side grid. This treats editing and results as equal, but the primary user flow is: configure portfolio → run simulation → view results. The page needs a clear visual hierarchy that guides first-time users and makes the simulation chart the focal point. A "Load Sample Data" option eliminates the cold-start problem where new users see default placeholder values.

## What Changes

- Redesign the `/` page layout with portfolio editing on the left and a chart-focused results area on the right
- Add a "Load Sample Data" button that populates the portfolio with a realistic example scenario
- Move the Simulate button into a prominent position between the editor and results
- Show a welcome/empty state in the results area before first simulation
- Keep "Add to Comparison" as a button below results (deferred checkbox approach to later change)

## Capabilities

### New Capabilities
- `landing-page`: Landing page layout, first-use experience, sample data loading, and simulation flow

### Modified Capabilities
- `app-shell-layout`: Home route content description updated to reflect redesigned landing page
- `simulate-tab-layout`: Simulation controls and results display adapted for landing page context (no longer a separate tab)

## Impact

- **Routes**: Only `/` route page changes; other routes unaffected
- **Components**: New `WelcomeState.svelte` for empty results area; `+page.svelte` restructured; `SimulateView.svelte` and `SimulateSettings.svelte` may need prop adjustments
- **Stores**: New sample portfolio data added to stores or a data module
- **Tests**: Landing page layout tests, sample data loading tests
- **No API changes**: Backend is unaffected
