## Context

The landing page currently renders top-to-bottom: SimulateSettings, results/welcome, portfolio summary bar, PortfolioEditor. Users must scroll past the simulate box to configure their portfolio. Advanced settings (tax rates, RMD, IRMAA) are in a collapsible subsection of SimulateSettings but belong with profile-level configuration. The balance chart uses four line series including a redundant "Total" line. Collapsed sections show no data summary.

## Goals / Non-Goals

**Goals:**
- Reorder landing page: PortfolioEditor above SimulateSettings + results
- Add summary text to each collapsed section (Accounts, Budget, Income)
- Move Advanced settings into ProfileDrawer
- Convert BalanceChart to stacked area (pre-tax, roth, brokerage)
- Remove the redundant portfolio summary bar

**Non-Goals:**
- Changing how simulation is triggered or how results display
- Modifying FanChart or Monte Carlo display
- Changing the mobile/responsive layout approach
- Adding new data fields or API changes

## Decisions

**Decision: CollapsibleSection gets a `summary` snippet**
Add an optional `summary` snippet prop to CollapsibleSection. When collapsed and summary is provided, render it inline after the title. Each section computes its own summary text in PortfolioEditor.

Alternative: Pass a `summaryText` string prop. Rejected — snippet allows richer formatting (bold amounts, icons) without encoding HTML in strings.

**Decision: Stacked area chart replaces line chart**
Change BalanceChart from `type: 'line'` with `fill: false` to `type: 'line'` with `fill: true` and `stacked: true` on the y-axis. Remove the Total dataset. Keep the same three colors (pre-tax red, roth green, brokerage amber) but with alpha fills. The top of the stack implicitly shows the total.

Alternative: Keep line chart and just remove Total. Rejected — stacked area better communicates composition and the total simultaneously.

**Decision: Advanced settings in ProfileDrawer, not a separate component**
Add the four Advanced inputs (State Tax %, Cap Gains %, RMD Age, IRMAA Limit) directly to ProfileDrawer.svelte under a new "Tax & Advanced" section with a separator. These are set-and-forget configuration, not per-simulation parameters.

Alternative: Create a separate AdvancedSettingsDrawer. Rejected — overkill for 4 inputs that logically group with profile.

**Decision: Remove portfolio summary bar entirely**
The collapsed section summaries provide the same information (total balance, spending, income). The summary bar's nav links (Spending, Compare, Details) are redundant with the AppBar. Remove the entire summary bar block from +page.svelte.

## Risks / Trade-offs

- [Section summaries] Summaries must update reactively as users edit. Using `$derived` in PortfolioEditor ensures this.
- [Chart readability] Stacked areas can be harder to read individual series at specific ages. Tooltips showing all three values mitigate this.
- [Profile drawer size] Adding 4 inputs grows the drawer, but it's scrollable and these inputs are compact.
