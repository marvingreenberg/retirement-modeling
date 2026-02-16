## Why

The landing page layout puts simulation controls above portfolio data, forcing users to scroll past the simulate box to find Accounts/Budget/Income. Advanced settings (tax rates, RMD age, IRMAA) clutter the simulate panel when they're rarely changed. The balance chart shows four separate lines (including a redundant "Total") instead of a stacked area that naturally communicates account composition. Collapsed sections show no summary, so users must expand each to see portfolio state.

## What Changes

- Reorder the landing page: PortfolioEditor (Accounts, Budget, Income) moves above SimulateSettings
- Add collapsed-state summaries to each collapsible section (e.g., "Accounts — Total $1.35M", "Budget — $10,000/mo", "Income — SS at 67, Pension $24K/yr")
- Move Advanced settings (State Tax %, Cap Gains %, RMD Age, IRMAA Limit) from SimulateSettings into the ProfileDrawer
- Keep Growth %, Inflation %, Conversion on one compact row in SimulateSettings
- Convert BalanceChart from line chart to stacked area chart with three series (Pre-tax, Roth, Brokerage) — remove the Total line since stacking shows it implicitly
- Remove the portfolio summary bar from the landing page (redundant with collapsed section summaries)

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `landing-page`: Reorder layout — PortfolioEditor above SimulateSettings; remove portfolio summary bar
- `portfolio-editor`: Add collapsed-state summaries to Accounts, Budget, Income sections
- `simulate-tab-layout`: Remove Advanced subsection from SimulateSettings panel
- `app-shell-layout`: Add Advanced settings (tax, RMD, IRMAA) to ProfileDrawer

## Impact

- `ui/src/routes/+page.svelte` — reorder components, remove summary bar
- `ui/src/lib/components/SimulateSettings.svelte` — remove Advanced section
- `ui/src/lib/components/ProfileDrawer.svelte` — add Advanced settings inputs
- `ui/src/lib/components/portfolio/PortfolioEditor.svelte` — add collapsed summaries
- `ui/src/lib/components/charts/BalanceChart.svelte` — convert to stacked area
- `ui/src/lib/components/CollapsibleSection.svelte` — may need summary slot/prop
- Existing tests for SimulateSettings, PortfolioEditor, SimulateView, landing page E2E
