## Why

The application has detailed documentation about how the simulation works (tax indexing, spending strategies, SS benefit formula, income COLA) in `ApplicationDetails.md`, but none of this is surfaced in the UI. Users need a way to understand the assumptions and mechanics behind their simulation results without leaving the app.

## What Changes

- Add a `?` help button in the AppBar (next to profile avatar)
- Create a HelpDrawer component that opens from the right side, displaying topic content from ApplicationDetails.md
- Support maximize toggle to expand the drawer to full-width overlay for readability
- Map each route to a default topic so help opens contextually (e.g., `/spending` → Spending Strategies)
- Internal navigation between topics within the drawer (e.g., link from SS section to Income COLA)
- Content stored as static data in a TypeScript module, sourced from ApplicationDetails.md

## Capabilities

### New Capabilities
- `help-drawer`: Help drawer component with topic display, maximize toggle, contextual topic mapping, and internal topic navigation

### Modified Capabilities
- `app-shell-layout`: Add help button to AppBar toolbar

## Impact

- `ui/src/lib/components/HelpDrawer.svelte` — new component
- `ui/src/lib/components/AppBar.svelte` — add help button
- `ui/src/lib/helpContent.ts` — static topic data
- No backend changes
