## Why

Spending configuration is split across two components: SpendingEditor (annual spending + planned expenses, inside PortfolioEditor) and SimulateSettings (spending strategy dropdown + conditional params like guardrails/withdrawal rate). The `/spending` route is a placeholder. Consolidating all spending controls onto the dedicated spending page gives them room to breathe and simplifies both the portfolio editor and simulate settings panel.

## What Changes

- Move the SpendingEditor content (annual spending, planned expenses) from PortfolioEditor to the `/spending` page
- Move the spending strategy selector and its conditional parameters (withdrawal rate, guardrails config) from SimulateSettings to the `/spending` page
- Remove the Spending Plan collapsible section from PortfolioEditor
- Simplify SimulateSettings by removing spending-related inputs
- Replace the `/spending` placeholder with the consolidated spending configuration page

## Capabilities

### New Capabilities
- `spending-page`: Dedicated spending configuration page consolidating spending amount, planned expenses, spending strategy selection, and strategy-specific parameters

### Modified Capabilities
- `simulate-tab-layout`: Spending strategy and conditional params removed from the simulation settings panel
- `portfolio-editor`: Spending Plan collapsible section removed

## Impact

- `ui/src/routes/spending/+page.svelte` — rewritten from placeholder to spending config page
- `ui/src/lib/components/portfolio/SpendingEditor.svelte` — moved or refactored for use on spending page
- `ui/src/lib/components/portfolio/PortfolioEditor.svelte` — Spending Plan section removed
- `ui/src/lib/components/SimulateSettings.svelte` — spending strategy dropdown and conditional params removed
- Tests updated for all modified components
