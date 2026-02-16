## Why

The UI layout needs refinement to match financial app conventions: a color accent bar below the AppBar, spending on its own route, a chart-first landing page, and details that stop after portfolio depletion. These changes improve usability and visual coherence.

## What Changes

- Add a gradient color bar below the AppBar (layout-level)
- Create `/spending` route and add it to AppBar navigation
- Move Budget section out of PortfolioEditor into a compact inline form with link to full spending page
- Reorganize landing page: simulation settings + chart at top, portfolio summary bar, then accounts/income below
- Stop displaying rows in the Details table after fund depletion
- Update GuidedTour to include the new Spending nav step

## Capabilities

### New Capabilities
- `spending-route`: Dedicated `/spending` page for detailed spending plan management

### Modified Capabilities
- `portfolio-editor`: Replace full Budget section with compact annual spending input and link to /spending

## Impact

- `ui/src/routes/+layout.svelte` — color bar addition
- `ui/src/lib/components/AppBar.svelte` — new Spending nav item
- `ui/src/routes/+page.svelte` — full landing page restructure
- `ui/src/routes/spending/+page.svelte` — new route
- `ui/src/routes/details/+page.svelte` — depletion cutoff logic
- `ui/src/lib/components/portfolio/PortfolioEditor.svelte` — compact budget section
- `ui/src/lib/components/GuidedTour.svelte` — new step
- Test files: AppBar.test.ts, GuidedTour.test.ts updated
