## Why

The UI currently conflates "what I have" (portfolio, accounts, income) with "how to model it" (inflation, growth rate, spending strategy, conversion strategy). Simulation parameters like `inflation_rate` and `investment_growth_rate` live in the Spending section of the Portfolio tab, which is unintuitive. The Simulate tab has only a "Run Simulation" button with no inputs. Monte Carlo is a separate tab despite being the same action with varied returns. The Compare tab uses a cross-product of strategies that confuses users. These UX issues make the tool harder to use and understand.

## What Changes

- **Move simulation parameters** from Portfolio tab to Simulate tab: `inflation_rate`, `investment_growth_rate`, `spending_strategy` (and its conditional params), `strategy_target` (conversion strategy), and tax assumption rates (`tax_rate_state`, `tax_rate_capital_gains`)
- **Merge Monte Carlo into Simulate tab** as a run mode (radio: Single run / Monte Carlo with iteration count), eliminating the separate Monte Carlo tab
- **Collapsible settings panel** on Simulate tab that auto-collapses to a summary line after running, maximizing result visibility on laptop screens
- **Snapshot-based Comparison tab** replacing the cross-product approach — users click "Add to Comparison" from simulation results to build up named comparison rows incrementally
- **Info (i) icon popovers** for financial terms throughout the UI, providing plain-language explanations on click
- **Visual polish pass** adding Lucide icons and richer visual treatment (account type icons, visual hierarchy) — separate implementation pass after structural changes
- **Tweaks section** on Portfolio tab for what-if scenario adjustments (e.g., "what if medical expenses of $100K for 5 years?", "what if tax rates increase 10%?") — appears contextually

## Capabilities

### New Capabilities
- `simulate-tab-layout`: Unified Simulate tab with collapsible settings panel, run mode selection (single/Monte Carlo), and auto-collapse summary
- `snapshot-comparison`: Snapshot-based comparison where simulation results are added incrementally with named runs, replacing cross-product strategy comparison
- `info-popovers`: Clickable (i) icon system for contextual help text on financial terms, dismissed by clicking anywhere
- `visual-polish`: Lucide icon integration and richer visual treatment for accounts, sections, and controls

### Modified Capabilities
- `simulation-orchestration`: UI parameter location changes — inflation, growth, strategies, tax rates move from Portfolio editor to Simulate tab inputs. No backend logic changes.
- `monte-carlo`: UI merges into Simulate tab as a run mode rather than separate tab. No backend logic changes.

## Impact

- **Frontend components**: Major restructuring of `PortfolioEditor.svelte` (remove simulation params), `SimulateView.svelte` (add settings panel, run mode, collapsible UI), `CompareView.svelte` (replace with snapshot-based approach), remove `MonteCarloView.svelte` as separate component
- **Tab navigation**: Reduce from 4 tabs (Portfolio, Simulate, Monte Carlo, Compare) to 3 tabs (Portfolio, Simulate, Compare)
- **State management**: Simulation parameters move from Portfolio state to Simulate tab state; comparison state changes from strategy selections to a list of saved snapshots
- **Dependencies**: Add `lucide-svelte` package for icons
- **Backend API**: No changes — the same `Portfolio` object is still sent to the API, just assembled from different UI locations
- **Schema/validation**: Zod schemas may need restructuring to reflect the UI split, but the API contract remains the same
