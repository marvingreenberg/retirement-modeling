## Context

The landing page has functional portfolio editing and simulation results but no guidance about portfolio health. Users can run a simulation with $0 spending and get confusing results.

## Goals / Non-Goals

**Goals:**
- Show portfolio summary before simulation is run (total balance, spending, coverage)
- Warn about common configuration issues
- Smooth loading experience
- Guide users to the Details page after results appear

**Non-Goals:**
- Full validation rework (existing Zod validation is fine)
- Chart tabs or additional visualizations

## Decisions

1. **Portfolio summary in WelcomeState**: When the portfolio has accounts but no results yet, show total balance, annual spending, and estimated coverage years (balance / spending) as context.

2. **Warning banner in +page.svelte**: Computed from portfolio state. Show warnings for: no spending set ($0), no income streams, no spouse SS configured when spouse exists. Styled as a yellow warning card above results area.

3. **Loading spinner**: Replace "Running simulation..." text with an animated spinner using Skeleton UI's ProgressRadial or a simple CSS animation.

4. **"View Details" link**: After results appear in SimulateView, show a text link to /details for the year-by-year table.

## Risks / Trade-offs

- Warnings are heuristic and may show for valid configurations (e.g., someone testing with $0 spend on purpose). Acceptable — they're warnings, not blockers.
