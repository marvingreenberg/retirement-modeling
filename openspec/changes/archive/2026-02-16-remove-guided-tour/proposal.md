## Why

The guided tour auto-advances through nav items on first use but isn't very helpful — users can see the navigation themselves. It adds complexity (tourActive store, TourTooltip component, data-tour attributes, timer logic) for minimal value.

## What Changes

- **Remove** GuidedTour.svelte, TourTooltip.svelte, and GuidedTour.test.ts
- **Remove** `tourActive` store and all references to it (SetupView, layout)
- **Remove** `data-tour` attributes from AppBar
- **Remove** tour activation from SetupView (keep the setup flow itself)

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `guided-tour`: **REMOVED** — entire capability deleted
- `first-use-flow`: Remove tour activation from setup completion

## Impact

- **Frontend only**: GuidedTour.svelte, TourTooltip.svelte, AppBar.svelte, SetupView.svelte, stores.ts, +layout.svelte, and associated tests
- **No backend changes**
