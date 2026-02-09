## Why

The simulate settings panel shows 7 inputs in two rows, which is cluttered. Tax rates, RMD age, and IRMAA limit rarely change between runs. Moving them into a collapsible "Advanced" section reduces visual noise and lets users focus on the key assumptions (inflation, growth, conversion strategy).

## What Changes

- Add collapsible "Advanced" disclosure within SimulateSettings for: State Tax %, Cap Gains %, RMD Age, IRMAA Limit
- Primary settings row keeps: Inflation %, Growth %, Conversion Strategy
- Advanced section defaults to collapsed, toggles with a text link
- Summary text in collapsed state includes tax info only if non-default

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `simulate-tab-layout`: Reorganize settings into primary row and collapsible advanced section

## Impact

- `ui/src/lib/components/SimulateSettings.svelte` — Restructure into primary/advanced sections
- Tests updated to reflect collapsed advanced section
