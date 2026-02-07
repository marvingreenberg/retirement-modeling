## 1. Tab Structure & Navigation

- [x] 1.1 Update TabNav to show 3 tabs (Portfolio, Simulate, Compare) — remove Monte Carlo tab
- [x] 1.2 Update +page.svelte to remove MonteCarloView import and tab case
- [x] 1.3 Write tests for TabNav rendering 3 tabs

## 2. Portfolio Tab Slimming

- [x] 2.1 Remove inflation_rate and investment_growth_rate inputs from SpendingEditor
- [x] 2.2 Remove spending_strategy dropdown and conditional params (withdrawal_rate, guardrails_config) from SpendingEditor — keep only annual_spend_net and planned_expenses
- [x] 2.3 Remove StrategyEditor section from PortfolioEditor (conversion strategy moves to Simulate)
- [x] 2.4 Remove TaxEditor section from PortfolioEditor (tax assumptions move to Simulate)
- [x] 2.5 Update PortfolioEditor collapsible sections to only show: People & Timeline, Accounts, Income, Spending Plan
- [x] 2.6 Write tests verifying Portfolio tab no longer contains simulation assumption inputs

## 3. Simulate Tab — Settings Panel

- [x] 3.1 Create SimulateSettings.svelte component with compact grid layout for all assumption inputs (inflation, growth, strategies, tax rates, RMD age, IRMAA limit)
- [x] 3.2 Add run mode radio buttons (Single / Monte Carlo with iteration count input)
- [x] 3.3 Add Simulate button inline with run mode selection
- [x] 3.4 Implement collapsible behavior — auto-collapse to summary line after run, expand on click
- [x] 3.5 Generate summary text from current assumptions (e.g., "3% infl, 7% growth, Fixed Dollar, 22% Bracket")
- [x] 3.6 Handle conditional spending strategy inputs (show guardrails params when selected)
- [x] 3.7 Write tests for SimulateSettings rendering, collapsing, summary text generation

## 4. Simulate Tab — Unified Run Logic

- [x] 4.1 Refactor SimulateView to accept run mode and dispatch to runSimulation or runMonteCarlo API calls
- [x] 4.2 Move Monte Carlo result display (success rate, percentiles, fan chart, depletion) into SimulateView
- [x] 4.3 Conditionally render single-run results or Monte Carlo results based on last run mode
- [x] 4.4 Add "Add to Comparison" button in results area (both modes)
- [x] 4.5 Write tests for run mode dispatch and result display switching

## 5. Snapshot-Based Comparison

- [x] 5.1 Define ComparisonSnapshot type and create comparison store (writable array of snapshots)
- [x] 5.2 Implement addSnapshot function that captures current assumptions + results into a snapshot
- [x] 5.3 Implement auto-generated snapshot names from assumptions
- [x] 5.4 Rewrite CompareView to display snapshot table (name, type, assumptions, outcomes)
- [x] 5.5 Add best-value highlighting across snapshot rows
- [x] 5.6 Add remove button per snapshot row
- [x] 5.7 Add empty state message when no snapshots exist
- [x] 5.8 Allow inline editing of snapshot names on Compare tab
- [x] 5.9 Write tests for snapshot store, name generation, comparison table rendering

## 6. Info Popovers

- [x] 6.1 Create InfoPopover.svelte reusable component (click to open, click-outside to dismiss, only one open at a time)
- [x] 6.2 Add info popovers to Simulate tab assumptions (inflation, growth, spending strategy, conversion strategy, Monte Carlo)
- [x] 6.3 Add info popovers to Portfolio tab inputs (cost basis ratio, IRMAA limit, RMD start age)
- [x] 6.4 Write tests for InfoPopover open/close/dismiss behavior

## 7. Visual Polish — Lucide Icons

- [ ] 7.1 Install lucide-svelte package
- [ ] 7.2 Add icons to Portfolio tab section headers (People, Accounts, Income, Spending)
- [ ] 7.3 Add colored account type indicators with icons in AccountsEditor
- [ ] 7.4 Add icons to Simulate tab run mode options and result sections
- [ ] 7.5 Verify build succeeds and icons render correctly in light/dark mode

## 8. Cleanup & Verification

- [ ] 8.1 Remove unused MonteCarloView.svelte component file (or keep as dead code if needed for reference)
- [ ] 8.2 Remove unused strategy fetching and compare API calls from CompareView
- [ ] 8.3 Run full test suite and verify all tests pass
- [ ] 8.4 Run pnpm build and verify production build succeeds
- [ ] 8.5 Verify pnpm check passes (TypeScript/Svelte checks)
