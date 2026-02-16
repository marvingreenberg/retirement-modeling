## Context

The retirement simulator UI uses SvelteKit route-based navigation with AppBar, guided tour, and collapsible portfolio editor sections. The current layout uses a two-column split (inputs left, results right) on the landing page. Spending is embedded as a "Budget" collapsible section within the portfolio editor. The details page renders all simulation years regardless of depletion.

## Goals / Non-Goals

**Goals:**
- Add visual accent (color bar) matching financial app conventions
- Give spending its own route for better navigation and focus
- Put simulation results (chart) at the top of the landing page for a "results-first" experience
- Stop showing irrelevant rows in the details table after portfolio depletion
- Keep all existing functionality working (simulation, comparison, import)

**Non-Goals:**
- Full landing page redesign with "Add to Compare" checkbox or refresh-with-dirty-tracking
- Configuration page (/config route)
- What-if scenarios or historical presets
- Advanced strategy toggle

## Decisions

1. **Color bar as CSS gradient** — A single `<div>` with `bg-gradient-to-r` using Skeleton's pine theme tokens (primary, tertiary, success). Placed in `+layout.svelte` between AppBar and main content. Simple, no new dependencies.

2. **Spending route reuses SpendingEditor** — The existing `SpendingEditor.svelte` component moves to `/spending/+page.svelte` with a page wrapper. The portfolio editor retains a compact budget input (annual spending + link to full page) so the simulation gate (`annual_spend_net === 0`) still works from the landing page.

3. **Landing page single-column layout** — Replace the `grid-cols-[2fr_3fr]` two-column layout with a vertical flow: SimulateSettings → results/chart → summary bar → PortfolioEditor. This is simpler and works better on mobile.

4. **Details depletion cutoff via array slicing** — Use `findIndex` to locate the first year with `total_balance <= 0`, then `slice` the array to that point. Show a depletion message below the table. This avoids Svelte `#each` loop-break hacks.

5. **Navigation ordering** — Overview, Spending, Compare, Details — groups related pages (inputs before outputs).

## Risks / Trade-offs

- [Budget section duplication] The annual spending input appears both on the landing page (compact) and the /spending page (full). This is intentional — the landing page version gates simulation, while /spending handles detailed expense planning. → Acceptable since both bind to the same store value.
- [Test updates needed] Adding a nav item changes test assertions for AppBar and GuidedTour. → Tests updated alongside implementation.
