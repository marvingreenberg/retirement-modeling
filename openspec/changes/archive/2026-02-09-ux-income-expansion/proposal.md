## Why

The backend now supports generic `IncomeStream` objects (pension, annuity, rental, etc.) with per-stream COLA and taxability, plus `SSAutoConfig` for actuarially-adjusted Social Security. The UI still uses the legacy `SocialSecurityConfig` (4 fixed fields) and has no way to add other income types. This limits the tool to SS-only income, missing a major planning dimension.

## What Changes

- Add `IncomeStream` and `SSAutoConfig` TypeScript types matching the backend models
- Add `income_streams` and `ss_auto` fields to `SimulationConfig` type
- Replace the legacy SS-only IncomeEditor with a richer income section: SS config using `ss_auto` (FRA amount + claiming age), plus an income streams list for pensions/annuities/other
- Add Zod schemas for the new types
- Update sample data to use `ss_auto` and include example income streams
- Keep legacy `social_security` field for backward compatibility (backend still accepts it)

## Capabilities

### New Capabilities
- `income-editor`: Income configuration UI with SS auto-generation and generic income streams

### Modified Capabilities
- `portfolio-editor`: Income section uses new IncomeEditor with SS auto + streams

## Impact

- `ui/src/lib/types.ts` — new interfaces: IncomeStream, SSAutoConfig
- `ui/src/lib/schema.ts` — new Zod schemas
- `ui/src/lib/stores.ts` — updated defaultPortfolio and samplePortfolio
- `ui/src/lib/components/portfolio/IncomeEditor.svelte` — rewritten
- `ui/src/lib/components/portfolio/PortfolioEditor.svelte` — updated Income section binding
- Tests for new IncomeEditor component
