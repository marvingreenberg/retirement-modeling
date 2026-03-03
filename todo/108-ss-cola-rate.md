# 108. Social Security COLA Rate

## Problem

`generate_ss_streams()` creates SS income streams with no `cola_rate`, so benefits stay flat in nominal terms forever. Real SS has annual COLA adjustments (historically ~2-3%).

## Fix

- Add a `cola_rate` field to `SSAutoConfig` (default 0.025 or similar)
- Expose it in Advanced Settings UI alongside existing SS inputs
- `generate_ss_streams()` passes the COLA rate through to the generated `IncomeStream` entries
- The simulation already handles `cola_rate` on income streams, so no simulation changes needed

## Files

- `src/retirement_model/models.py` — add `cola_rate` to `SSAutoConfig`
- `src/retirement_model/social_security.py` — pass `cola_rate` to generated streams
- `ui/src/lib/components/settings/AdvancedSettings.svelte` — add SS COLA input
- `ui/src/lib/types.ts`, `ui/src/lib/schema.ts` — update `SSAutoConfig` type/schema
- Tests for social_security.py and AdvancedSettings
