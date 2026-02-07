## Context

The retirement simulator UI has four tabs: Portfolio, Simulate, Monte Carlo, and Compare. The Portfolio tab conflates portfolio definition ("what I have") with simulation assumptions ("how to model it") — inflation rate, growth rate, spending strategy, conversion strategy, and tax rates all live in the Portfolio editor. The Simulate tab is just a button. Monte Carlo is a separate tab doing essentially the same thing with varied returns. Compare uses a cross-product of strategies that confuses users.

The UI uses SvelteKit with Skeleton v4 + Tailwind v4, Svelte 5 runes for state, and writable stores for portfolio data. The backend API accepts a `Portfolio` object (config + accounts) — this contract does not change.

## Goals / Non-Goals

**Goals:**
- Separate "what I have" (Portfolio tab) from "how to model it" (Simulate tab)
- Merge Simulate and Monte Carlo into one tab with run mode selection
- Make simulation settings compact and collapsible so results are prominent
- Replace cross-product Compare with incremental snapshot-based comparison
- Add (i) icon popovers for contextual help on financial terms
- Add Lucide icons and visual polish (separate implementation pass)

**Non-Goals:**
- No backend API changes — the `Portfolio` object sent to the API remains the same; the UI just assembles it from different locations
- No per-account growth rates in this change (future enhancement)
- No "Tweaks" section yet — noted for future change after this refactoring lands
- No changes to the underlying simulation logic or strategies
- No mobile-first layout (laptop-optimized, but responsive)

## Decisions

### Decision 1: State management — keep single Portfolio store

**Choice:** Continue using the single `portfolio` writable store. The Simulate tab reads/writes simulation parameters directly on `$portfolio.config`.

**Why:** The API expects a single `Portfolio` object. Splitting state would mean reassembling at API call time, adding complexity for no backend benefit. The store is the single source of truth — the Simulate tab just edits different fields than the Portfolio tab.

**Alternative considered:** Separate stores for portfolio vs. simulation params, merged at API call time. Rejected — adds state synchronization complexity and the `SimulationConfig` type already bundles everything.

### Decision 2: Tab structure — 3 tabs

**Choice:** Portfolio, Simulate, Compare. Remove Monte Carlo as a separate tab.

**Why:** Monte Carlo is the same simulation with varied returns. A radio button (Single / Monte Carlo [N]) is more intuitive than a separate tab. Reduces cognitive overhead — users don't have to choose between two "run it" tabs.

### Decision 3: Simulate tab layout — collapsible settings with summary

**Choice:** Settings panel renders as a 2-3 row compact grid. After running, it auto-collapses to a single summary line showing key assumptions. Clicking the summary expands back to the full settings. The [Simulate] button stays visible in both states.

**Layout when expanded:**
```
┌─────────────────────────────────────────────────────────────────────┐
│ Inflation [3.0]%  Growth [7.0]%  │ Withdraw [Fixed Dollar▾]        │
│ State Tax [5.75]% Cap Gains [15]%│ Convert  [22% Bracket ▾]        │
│ ○ Single  ○ Monte Carlo [1000] (i)                    [ Simulate ] │
└─────────────────────────────────────────────────────────────────────┘
```

**Layout when collapsed (after run):**
```
┌ ▸ 3% infl, 7% growth, Fixed Dollar, 22% Bracket         [Simulate]┐
└────────────────────────────────────────────────────────────────────-┘
```

**Why:** Laptop-optimized — maximizes vertical space for results. The summary line keeps users oriented on what assumptions produced these results. Same summary text becomes the default name for comparison snapshots.

**Alternative considered:** Always-visible settings above results. Rejected — on a laptop screen, settings + results + chart would require scrolling.

### Decision 4: Comparison — snapshot-based, not cross-product

**Choice:** Remove strategy checkboxes. Instead, after running a simulation, users click "Add to Comparison" which saves a named snapshot (auto-generated name from assumptions, editable). The Compare tab shows a table of snapshots with columns for all key assumptions + outcomes.

**Snapshot data structure:**
```typescript
interface ComparisonSnapshot {
  id: string;
  name: string;              // "3% infl, 7% growth, Fixed Dollar, 22%"
  runType: 'single' | 'monte_carlo';
  numSimulations?: number;   // for MC runs
  // Assumptions (captured at run time)
  inflationRate: number;
  growthRate: number;
  spendingStrategy: string;
  conversionStrategy: string;
  taxRateState: number;
  taxRateCapitalGains: number;
  // Outcomes
  finalBalance: number;      // median for MC
  totalTaxes: number;
  totalIrmaa: number;
  totalRothConversions: number;
  successRate?: number;       // MC only
}
```

**Why:** More intuitive than cross-product. Users build comparisons incrementally. Each row is a specific set of assumptions they chose, not a combinatorial explosion. MC runs use median values with success rate shown as an extra column.

**Alternative considered:** Keep cross-product but add "Add to Comparison" alongside. Rejected — maintaining both adds complexity and the cross-product UX was identified as confusing.

**Migration note:** The existing `/api/compare` endpoint is no longer needed from the UI. It can remain for API users but the UI will call `/api/simulate` (or `/api/monte-carlo`) for each individual run.

### Decision 5: Info (i) popovers — click-to-open, click-anywhere-to-dismiss

**Choice:** Clickable (i) icon (from Lucide: `Info` or `HelpCircle`) that opens a popover with plain-language explanation. Dismissed by clicking anywhere outside.

**Why:** User preference — mouseover tooltips can be annoying. Click-to-open is more intentional. The text will be concise (a few dozen words max). Works well on both desktop and mobile.

**Implementation:** Create a reusable `InfoPopover.svelte` component. Content passed as a prop (string or snippet). Uses Skeleton's popover or a simple absolute-positioned div.

### Decision 6: Visual polish — Lucide icons, separate pass

**Choice:** Install `lucide-svelte`. Add icons to:
- Section headers (People, Accounts, Income, Spending)
- Account type indicators (colored circles with type-specific icons)
- Run mode indicators
- Info popovers

**Why:** Addresses the "blandness" feedback. Lucide is Skeleton's recommended icon library — tree-shakable, 700+ icons, works as Svelte components.

**Implementation order:** Visual polish is a separate implementation pass after structural changes land. This avoids mixing layout refactoring with cosmetic changes.

### Decision 7: What stays on Portfolio tab vs. moves to Simulate

**Stays on Portfolio ("what I have"):**
- People & Timeline (ages, years)
- Accounts (balances, types, owners)
- Income (Social Security)
- Annual Spending amount + Planned Expenses

**Moves to Simulate ("how to model it"):**
- `inflation_rate`
- `investment_growth_rate`
- `spending_strategy` + conditional params (withdrawal_rate, guardrails_config)
- `strategy_target` (conversion strategy)
- `tax_rate_state`
- `tax_rate_capital_gains`
- `rmd_start_age`
- `irmaa_limit_tier_1`

**Why:** The Portfolio tab becomes "describe your financial situation." The Simulate tab becomes "choose your assumptions and run." This matches the mental model: portfolio is relatively stable, assumptions are what you tweak between runs.

**Note:** The `SpendingEditor` component splits — `annual_spend_net` and `planned_expenses` stay, everything else moves. The `TaxEditor` and `StrategyEditor` components move entirely to Simulate. The `SpendingEditor` on the Portfolio tab becomes simpler (just spend amount + expenses).

## Risks / Trade-offs

**[Risk] Settings not visible when viewing results** → Mitigation: Collapsible summary line preserves context. Users can always expand. Summary text serves as a label.

**[Risk] Losing the cross-product comparison feature** → Mitigation: Users can manually run multiple combinations and add each to comparison. More work per comparison, but each is intentional and understood. Could add a "batch compare" feature later if missed.

**[Risk] State split across tabs could confuse saved/loaded portfolios** → Mitigation: Save/load still captures the full `Portfolio` object. Loading a file populates both tabs. The split is purely UI — the underlying data model doesn't change.

**[Risk] Conditional spending strategy inputs (guardrails params) need space in compact layout** → Mitigation: When guardrails is selected, the settings panel gets an extra row. The collapsed summary still works — it just says "Guardrails" without showing all sub-params.

**[Trade-off] Removing separate Monte Carlo tab loses dedicated MC parameter space (seed, iteration count)** → The seed field is primarily a developer/reproducibility concern. It can go into an advanced section or be dropped from the UI. Iteration count fits inline with the radio button.
