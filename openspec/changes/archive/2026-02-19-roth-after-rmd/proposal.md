## Why

Roth conversions are currently restricted to before RMD age (`age_primary < cfg.rmd_start_age`). In practice, conversions can continue after RMD age — take the mandatory RMD first, then convert additional pre-tax funds to Roth. Post-RMD conversions reduce future RMDs and leave tax-free Roth assets to heirs. The AGI headroom calculation already accounts for RMD income, so the restriction is unnecessarily conservative.

## What Changes

- Remove the `age_primary < cfg.rmd_start_age` guard in `simulation.py` so conversions execute at any age when AGI headroom exists
- Update the UI conversion strategy dropdown to remain enabled regardless of age (remove the disable-at-RMD-age logic)
- Update tests to cover post-RMD conversion scenarios

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `roth-conversions`: Remove the RMD-age timing restriction on conversions; allow conversions at any age. Also remove the UI gating that disables the conversion dropdown at/past RMD age.

## Impact

- `src/retirement_model/simulation.py` — remove age guard on conversion block
- `ui/src/lib/components/SimulateSettings.svelte` — remove disabled state on conversion dropdown
- `tests/` — update or add tests for post-RMD conversions
