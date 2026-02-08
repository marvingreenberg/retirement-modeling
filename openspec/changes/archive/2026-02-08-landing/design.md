## Context

After the `ux-shell` change, the `/` route renders PortfolioEditor and SimulateView in a 50/50 grid. The portfolio editor contains four collapsible sections (People & Timeline, Accounts, Income, Spending Plan) plus FileControls (Load/Save). SimulateView contains settings (run mode, assumptions), a Simulate button, and results (summary cards, charts, detail table, Add to Comparison).

The app starts with hardcoded defaults (age 65, one Traditional IRA at $500k, etc.) — there's no "getting started" guidance for new users.

## Goals / Non-Goals

**Goals:**
- Clear visual hierarchy: portfolio config on left, simulation results on right
- First-use experience with "Load Sample Data" to populate a realistic scenario
- Welcome/empty state in the results panel before first simulation
- Simulation controls (Simulate button, run mode) prominently placed
- Existing functionality preserved — this is a layout and UX change, not feature removal

**Non-Goals:**
- Moving simulation settings (inflation, growth, strategies) to a config drawer (deferred to `ux-config-spending`)
- Redesigning the SimulateSettings component internals
- Changing the SimulateView results display (charts, tables, summary cards)
- Mobile/responsive layout optimization

## Decisions

### Landing page layout

```
┌─────────────────────────────────────────────────────────────┐
│                        AppBar                                │
├──────────────────────┬──────────────────────────────────────┤
│  Portfolio Editor    │  Results Panel                        │
│                      │                                       │
│  [Load Sample Data]  │  (before run: WelcomeState)           │
│  [Load] [Save]       │  (after run: SimulateView results)    │
│                      │                                       │
│  ▸ People & Timeline │  [chart / summary / table]            │
│  ▸ Accounts          │                                       │
│  ▸ Income            │                                       │
│  ▸ Spending Plan     │                                       │
│                      │                                       │
│  ── SimulateSettings─┤                                       │
│  [● Single ○ MC]     │                                       │
│  [   Simulate   ]    │                                       │
└──────────────────────┴──────────────────────────────────────┘
```

Left panel (~40%): PortfolioEditor with FileControls, then SimulateSettings and Simulate button below.
Right panel (~60%): Results area — WelcomeState before first run, SimulateView results after.

**Rationale**: Keeps the edit→run→view flow reading left-to-right/top-to-bottom. The Simulate button sits at the bottom of the left panel, acting as the bridge between editing and viewing results.

**Alternative considered**: Simulate button in its own horizontal bar between the two panels — rejected because it wastes vertical space and breaks the natural column flow.

### Sample data

A `samplePortfolio` constant alongside `defaultPortfolio` in the stores module. Represents a realistic two-person household scenario with multiple account types, reasonable income, and planned expenses.

The "Load Sample Data" button appears in the FileControls area alongside Load/Save. It calls `portfolio.set(structuredClone(samplePortfolio))`.

**Rationale**: Putting sample data in the stores module keeps data close to the default. A button alongside Load/Save is discoverable without adding UI complexity.

### Welcome/empty state

A `WelcomeState.svelte` component shown in the right panel when no simulation has been run. Contains:
- A brief message ("Configure your portfolio and run a simulation")
- Visual hint (chart placeholder or icon)

After the first simulation run, it's replaced by SimulateView results and never shown again (until page reload resets state).

**Rationale**: An empty right panel looks broken. A welcome state guides the user toward the primary action.

### Component restructuring

The current `+page.svelte` imports PortfolioEditor and SimulateView. The redesign keeps both but reorganizes:

- `+page.svelte` — layout wrapper, controls the two-panel grid, manages the "has run" state
- `PortfolioEditor` — unchanged (left panel content)
- `SimulateSettings` — moved from inside SimulateView to the page level (below PortfolioEditor in left panel)
- `SimulateView` — results only (right panel), with SimulateSettings extracted
- `WelcomeState.svelte` — new, shown when no results exist

The simulation state (loading, error, results) stays in SimulateView or gets lifted to the page level as needed.

## Risks / Trade-offs

- **SimulateView refactoring scope**: Extracting SimulateSettings from SimulateView requires adjusting props/state flow. → Mitigation: SimulateSettings already accepts bindable props, so the lift is mostly moving the import and passing state through the page.
- **Two-column layout on narrow screens**: The `lg:grid-cols-2` breakpoint means single-column on mobile/tablet, which may feel like a long scroll. → Mitigation: Acceptable for MVP; mobile optimization is a non-goal.
- **Sample data maintenance**: If backend schema changes, sample data needs updating. → Mitigation: Sample data uses the same `Portfolio` type, so TypeScript will catch mismatches.
