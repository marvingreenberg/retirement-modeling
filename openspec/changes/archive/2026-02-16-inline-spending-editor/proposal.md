## Why

The spending configuration is split across two locations: a minimal Budget collapsible in the PortfolioEditor and a separate `/spending` page. This adds navigation overhead for a simple editor. The planned expenses layout also wastes vertical space by repeating field labels per row. Consolidating everything into the Budget collapsible and using a table layout makes the workflow more compact.

## What Changes

- **Remove the Spending tab** from the AppBar navigation and delete the `/spending` route
- **Move full SpendingEditor** into the Budget collapsible section of PortfolioEditor (replacing the current link to `/spending`)
- **Convert planned expenses to a table layout** with columns: Name, Amount, Type, When (displays year for one-time, start–end year range for recurring), Inflation Adj., and a remove button
- **Remove all references** to the `/spending` route (guided tour step, help content route mapping, tests)

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `portfolio-editor`: Budget section expands to contain the full SpendingEditor with table-based planned expenses instead of linking to a separate page
- `spending-page`: **REMOVED** — all functionality moves into portfolio-editor Budget section

## Impact

- **Frontend**: AppBar.svelte, PortfolioEditor.svelte, SpendingEditor.svelte, GuidedTour.svelte, helpContent.ts, spending route directory
- **Tests**: AppBar.test.ts, PortfolioEditor.test.ts, SpendingEditor.test.ts, any E2E tests referencing `/spending`
- **No backend changes**
