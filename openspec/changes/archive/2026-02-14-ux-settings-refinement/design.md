## Context

SimulateSettings currently has: primary row (inflation, growth, conversion) → strategy dropdown + conditional params → Advanced toggle → run mode + Simulate. The whole panel collapses to a single summary line after a run. The avatar button in the AppBar is a static icon with no behavior. DarkModeToggle sits in the AppBar trail.

## Goals / Non-Goals

**Goals:**
- Strategy and Advanced become independently collapsible subsections within the expanded settings panel
- Each subsection shows a succinct summary when collapsed
- Avatar shows user initials and opens a profile drawer
- Profile drawer contains people/timeline config and dark mode toggle
- Names captured in setup flow for avatar initials

**Non-Goals:**
- Authentication or multi-user support
- Save/load to file (future work)
- Changing what the Advanced section contains

## Decisions

1. **Collapsible subsection pattern**: Both Strategy and Advanced use the same UX pattern — a clickable header row that toggles between summary (collapsed) and full controls (expanded). The header shows: `▸ Section Name — summary text` when collapsed, `▾ Section Name` when expanded.

2. **Strategy summary formats**:
   - Fixed Dollar: `"Withdrawal Strategy — Fixed $140K"`
   - % of Portfolio: `"Withdrawal Strategy — 4.0% of Portfolio"`
   - Guardrails: `"Withdrawal Strategy — Guardrails 4.5%, (80/120)"`
   - RMD-Based: `"Withdrawal Strategy — RMD-Based"`

3. **Advanced summary format**:
   - All defaults: `"Advanced — defaults"`
   - Any non-default: `"Advanced — custom"` (keeps it short; user expands to see details)
   - What counts as "default": compare against defaultPortfolio values for tax_rate_state, tax_rate_capital_gains, rmd_start_age, irmaa_limit_tier_1

4. **Strategy expanded layout**: Dropdown and conditional params on the same row when space allows. For guardrails (4 extra fields), use two rows:
   - Row 1: `[Strategy dropdown ▾]  Init. WD Rate [___]`
   - Row 2: `Floor % [___]  Ceiling % [___]  Adjust % [___]`
   For fixed_dollar and rmd_based: just the dropdown, no extra fields.
   For percent_of_portfolio: `[Strategy dropdown ▾]  Withdrawal Rate [___]`

5. **Default collapse state**: Both Strategy and Advanced start collapsed. The primary row (inflation, growth, conversion) remains always visible in the expanded panel. This keeps the settings compact — the most common thing to change (growth rate) is always visible, while strategy and world params are one click away.

6. **Profile store**: Add a separate `profileStore` (not in portfolio config, since names aren't simulation inputs):
   ```typescript
   interface UserProfile {
     primaryName: string;    // first name, e.g. "Mike"
     spouseName: string;     // first name, e.g. "Karen", empty if no spouse
   }
   ```
   Ages and simulation_years stay in portfolio.config where they are now.

7. **Avatar initials**: Derive from profileStore names. "M,K" if both names set. "M" if only primary. Generic person icon if no name yet (pre-setup state).

8. **Profile drawer contents** (top to bottom):
   - Names (primary, spouse) — text inputs
   - Ages (primary, spouse) — number inputs, bound to portfolio.config
   - Simulation years — number input, bound to portfolio.config
   - Dark/Light mode toggle
   - (Future: save/load, profile switching)

9. **SetupView changes**: Add a "Your Name" text input above "Your Age". Add "Spouse Name" when spouse checkbox is checked. Names go to profileStore, ages go to portfolio.config as before.

10. **Drawer component**: Use Skeleton's Drawer or a simple slide-out panel from the right. Opened by clicking the avatar, closed by clicking outside or an X button.

## Layout Sketch

```
Expanded settings panel:
┌──────────────────────────────────────────────────────────────┐
│  Inflation %  [3.0]   Growth %  [7.0]   Conversion  [IRMAA] │  ← always visible
│                                                              │
│  ▸ Withdrawal Strategy — Fixed $140K                         │  ← collapsed
│  ▸ Advanced — defaults                                       │  ← collapsed
│                                                              │
│  ○ Single run  ○ Monte Carlo (i)         [Simulate]          │
└──────────────────────────────────────────────────────────────┘

Strategy expanded:
│  ▾ Withdrawal Strategy                                       │
│    [Fixed Dollar ▾]                                          │
│  ▸ Advanced — defaults                                       │

Strategy expanded (guardrails):
│  ▾ Withdrawal Strategy                                       │
│    [Guardrails ▾]       Init. WD Rate [4.5]                  │
│    Floor % [80]  Ceiling % [120]  Adjust % [10]              │
│  ▸ Advanced — defaults                                       │

AppBar:
┌──────────────────────────────────────────────────────────────┐
│  Retirement Simulator    Home  Budget  Compare  Details  [M,K]│
└──────────────────────────────────────────────────────────────┘
                                                            ↑
                                                     avatar with initials
                                                     click → drawer opens
```

## Risks / Trade-offs

- Adding names to the setup flow adds one more field before the user can start. Acceptable since it's just a first name and it personalizes the experience (avatar initials).
- Strategy and Advanced both collapsed by default means two clicks to see everything. Acceptable since the primary row has the most-changed values, and the collapsed summaries show the current state at a glance.
- profileStore is separate from portfolio — names won't be saved/loaded with portfolio data. This is intentional (names are a UI preference, not a simulation input) but means save/load needs to handle both stores when implemented.
