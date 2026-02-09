## Context

The backend `SimulationConfig` now has two new optional fields: `income_streams: list[IncomeStream]` and `ss_auto: SSAutoConfig | None`. When `ss_auto` is present, the backend auto-generates SS income streams using actuarial formulas (early reduction / delayed credits). The legacy `social_security` field still works as a fallback.

The current UI IncomeEditor is a simple form with 4 fields: primary/spouse benefit and start age. It binds to `$portfolio.config.social_security`.

## Goals / Non-Goals

**Goals:**
- Add TS types and Zod schemas for `IncomeStream` and `SSAutoConfig`
- Replace the SS-only editor with: SS section using `ss_auto` (FRA amount + claiming age) and an income streams section (add/remove rows with name, amount, start_age, end_age, COLA, taxability)
- Update samplePortfolio to demonstrate income streams
- Keep `social_security` field populated for backward compat (derive from ss_auto values)

**Non-Goals:**
- Displaying computed SS benefit after actuarial adjustment (that's a backend calculation)
- Income stream categories/types dropdown (keep it simple: name field is freeform)
- Removing the legacy `social_security` field from the data model

## Decisions

### SS Auto as primary input, legacy SS as derived

The IncomeEditor will bind to `ss_auto` fields. On change, it also updates the legacy `social_security` object with the same values (benefit = FRA amount, start age = start age). This keeps backward compat — if the user saves and loads into an older version, SS still works.

**Rationale**: Cleaner than maintaining two separate SS input paths. The backend prefers `ss_auto` when present.

### Income streams as flat list with inline editing

Each income stream is a row: name (text), amount (number), start age (number), end age (optional number), COLA rate (optional number), taxable % (number 0-1). Add/remove buttons like the existing AccountsEditor pattern.

**Rationale**: Matches the AccountsEditor UX pattern the user is already familiar with. Income streams are simpler than accounts (fewer fields), so inline editing is sufficient.

### IncomeEditor stays in portfolio/

The IncomeEditor component stays at `ui/src/lib/components/portfolio/IncomeEditor.svelte` since it's part of the portfolio configuration. It's used by PortfolioEditor in the Income collapsible section.

## Risks / Trade-offs

- **SS FRA amount != actual benefit**: The user enters their FRA benefit, and the backend adjusts for claiming age. The UI doesn't show the adjusted amount. → Acceptable; adding a preview calculation is future work.
- **Spouse toggle interaction**: If no spouse (age 0), SS spouse fields should be hidden. → The IncomeEditor checks portfolio.config.current_age_spouse > 0.
