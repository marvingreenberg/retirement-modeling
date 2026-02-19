## Context

The main page (`/`) caches simulation results in local component state (`singleResult`, `mcResult`) and in the `simulationResults` store. When a user changes inputs (accounts, income, expenses, loads a file), the stale results remain visible until the user clicks Simulate again. This is confusing — users may think the displayed charts reflect current inputs.

The Settings page has a "Done" button in the footer that just does `goto('/')`. This duplicates the Overview nav item in the top AppBar. The sample data dropdown lives in Basic Info, but logically belongs with Load/Save operations.

## Goals / Non-Goals

**Goals:**
- Clear simulation results whenever portfolio inputs change, returning to "Ready to simulate" state
- Replace Done button with a lighter "Overview" navigation link
- Move sample data loading to the Load/Save section
- Update the first-use welcome message to mention Load/Save for saved/sample data

**Non-Goals:**
- Debouncing or throttling the clear (instant is fine — the user re-simulates when ready)
- Preserving comparison snapshots across changes (they should also clear)
- Backend changes (this is entirely frontend)

## Decisions

### 1. Use `$effect` on serialized portfolio to detect changes

**Decision**: Add a `$effect` in `+page.svelte` that watches `$portfolio` (via `JSON.stringify`) and clears both component-local results and the `simulationResults` store when the value changes.

**Alternatives considered**:
- Watch individual fields — fragile, easy to miss new fields
- Debounce — unnecessary complexity for a simple clear operation
- Store middleware — too invasive for a UI-only concern

**Rationale**: `JSON.stringify` gives a stable deep comparison. The effect runs after any store mutation. Clearing is cheap (set nulls). We skip the initial mount by tracking whether a previous value existed.

### 2. Replace Done with Overview nav link

**Decision**: Replace the `<button>Done</button>` footer with an `<a href="/">` styled link using the LayoutDashboard icon and "Overview" label, matching the AppBar nav style.

**Rationale**: Consistent with the rest of the navigation. Less prominent than a filled button, which is appropriate since the AppBar already provides the same navigation.

### 3. Move sample data to Load/Save section

**Decision**: Move the sample scenario dropdown from Basic Info to the Load/Save panel, between Load and Save. Remove the duplicate from Basic Info. Update the first-use welcome banner to say "Or use Load / Save to load previously saved data or sample data."

**Rationale**: Sample data is a data-loading operation, not profile configuration.

## Risks / Trade-offs

- [Serializing portfolio on every change] → Cost is minimal for this data size. If it becomes a concern, could switch to a generation counter.
- [Clearing results may surprise users who made minor tweaks] → This is the correct behavior. Stale results are worse than no results.
