## Why

The QFX/OFX import currently supports only a single file at a time. Users with multiple brokerage accounts at different institutions must import each file separately — tedious and error-prone. Additionally, there's no way to share or demo the app without exposing real financial data.

## What Changes

- Enable multi-file selection in the QFX/OFX file picker (`multiple` attribute + loop over all selected files)
- Add `.csv` to accepted file types (parser already exists in `csvParser.ts` but isn't wired up)
- Add a "Randomize Balances" button in Advanced settings that scales all account balances by a random factor (0.2–0.5x) and generates placeholder owner names, enabling safe demos

## Capabilities

### New Capabilities
- `demo-mode`: Randomize account balances and owner names for privacy-safe demos

### Modified Capabilities
- `portfolio-import-ui`: Multi-file selection, CSV support, file type filtering

## Impact

- `ui/src/lib/components/portfolio/ImportPortfolio.svelte` — multi-file handling, CSV integration
- `ui/src/lib/components/FileControls.svelte` or `ProfileDrawer.svelte` — randomize balances button
- `ui/src/lib/stores.ts` — randomization helper
- Tests for multi-file import and balance randomization
