## Context

The guided tour was added as part of FE-1 UX refactoring. It uses a `tourActive` writable store triggered by SetupView on first-use completion, rendering tooltip overlays via GuidedTour + TourTooltip components mounted in +layout.svelte.

## Goals / Non-Goals

**Goals:**
- Remove all guided tour code and references
- Keep the first-use setup flow intact (just remove tour activation)

**Non-Goals:**
- Replacing the tour with something else
- Changing the setup flow behavior beyond removing `tourActive.set(true)`

## Decisions

**1. Delete components outright**: GuidedTour.svelte and TourTooltip.svelte are only used by the tour. Delete both.

**2. Remove tourActive store**: Only used by GuidedTour and SetupView. Remove from stores.ts.

**3. Strip data-tour attributes**: These are only consumed by GuidedTour's querySelector. Remove from AppBar.

## Risks / Trade-offs

- Minimal risk — the tour is self-contained with no dependencies from other features.
