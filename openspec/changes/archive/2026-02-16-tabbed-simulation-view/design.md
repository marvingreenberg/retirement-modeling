## Context

The retirement simulator UI has a Simulate tab with radio buttons to choose between Single run and Monte Carlo modes. Only one mode runs at a time. Users frequently want to see both perspectives without re-running.

## Goals / Non-Goals

**Goals:**
- Always run both single and Monte Carlo simulations on every Simulate click
- Display results in tabs so users can switch between views without re-running
- Show MC results asynchronously (spinner while loading)
- Keep MC iteration count configurable but move it to the profile drawer

**Non-Goals:**
- No backend API changes
- No changes to simulation logic or strategies
- No changes to comparison snapshot behavior (both tabs still have Add to Comparison)

## Decisions

### Decision 1: Concurrent execution with independent loading states

**Choice:** Fire both API calls concurrently. Single run result displays immediately when it resolves (typically faster). MC tab shows a spinner until its result arrives.

**Why:** Single run is fast and users expect immediate feedback. MC takes longer, so showing it asynchronously avoids blocking the primary result.

### Decision 2: Simple tab bar, not Skeleton TabGroup

**Choice:** Two styled buttons with active/inactive states and a border-bottom indicator, matching existing UI patterns.

**Why:** Keeps it lightweight. No new component library dependencies. Consistent with the minimal styling approach used elsewhere.

### Decision 3: MC iterations in ProfileDrawer via store

**Choice:** Add a `numSimulations` writable store. ProfileDrawer binds to it in the Tax & Advanced section. +page.svelte reads it via `get()` when firing the MC call.

**Why:** The iterations count is a rarely-changed setting. Moving it to the drawer declutters the main settings panel.
