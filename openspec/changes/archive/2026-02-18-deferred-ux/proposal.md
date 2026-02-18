## Why

Age-based inputs in the Income and Account editors are abstract — users think in terms of calendar years ("I'll start my pension in 2032"), not ages. Showing years with age hints makes the UI more intuitive. Additionally, there are no guards against nonsensical values like start ages past expected lifespan.

## What Changes

- Income editor: show SS and stream ages as years with age hint (e.g., "2032 (age 72)")
- Account editor: show `available_at_age` as year with age hint
- Pass `config` to AccountsEditor so it can compute age-to-year conversions
- Add validation warnings for unreasonable age/year values

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `income-editor`: Age fields display as year inputs with age hints
- `portfolio-editor`: AccountsEditor receives config for age-to-year conversion

## Impact

- `ui/src/lib/components/portfolio/IncomeEditor.svelte` — age-to-year display
- `ui/src/lib/components/portfolio/AccountsEditor.svelte` — available_at_age as year, accept config prop
- `ui/src/lib/components/portfolio/PortfolioEditor.svelte` — pass config to AccountsEditor
- Unit tests for both editors
