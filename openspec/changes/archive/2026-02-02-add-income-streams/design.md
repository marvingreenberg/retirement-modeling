## Context

The simulation currently models Social Security as the only income source. All other cash comes from portfolio withdrawals (RMDs, brokerage, Roth). This understates available income for retirees with pensions or annuities, leading to overstated withdrawal projections.

Social Security is modeled as a dedicated config object with primary/spouse fields. Income streams take a different approach — a flat list of generic stream objects — since the number and types vary per user.

## Goals / Non-Goals

**Goals:**
- Add a generic `IncomeStream` model to `SimulationConfig`
- Integrate streams into the simulation loop (AGI, cash flow, withdrawals)
- Accept streams through CLI (input.json) and API
- Test coverage for income stream behavior

**Non-Goals:**
- Inflation/COLA adjustment on income streams (future work)
- Per-owner tagging for survivor scenarios (future work)
- Variable or step-function amounts (future work)
- Replacing the existing Social Security model with an income stream

## Future Considerations

These are intentionally deferred to keep the first iteration simple:
- **Inflation adjustment**: Pensions are typically nominal, but some have COLA. An optional `inflation_adjusted` flag (like planned expenses already support) would handle this.
- **Owner assignment**: Tagging streams as primary/spouse would allow streams to stop when that person's simulation ends. Requires survivor modeling which doesn't exist yet.
- **Variable amounts**: Some annuities change over time. Could be modeled as multiple streams or a schedule.

## Decisions

### Decision 1: Generic list model vs. dedicated pension/annuity types

Using a single `IncomeStream` type with a `taxable_pct` field rather than separate `Pension` and `Annuity` models. The tax treatment difference (pensions ~100% taxable, non-qualified annuities use exclusion ratio) is fully captured by `taxable_pct`. Separate types would add complexity without functional benefit at this stage.

### Decision 2: Income streams keyed to primary owner age only

Streams activate based on `age_primary` rather than having a per-stream owner field. This matches the current Social Security implementation pattern and avoids introducing owner-awareness before survivor modeling exists.

### Decision 3: Placement in simulation loop

Income streams are calculated immediately after Social Security (step 5→6 in the processing order). They contribute to AGI and cash flow identically to SS — taxable portion goes to AGI, net-of-tax amount goes to cash in hand.

## Risks / Trade-offs

- **Simplified tax treatment**: Using a flat `taxable_pct` is an approximation. Annuity exclusion ratios change over time as basis is recovered. Acceptable for a first iteration.
- **No inflation adjustment**: Fixed-dollar streams will understate real value over long simulations. Noted in future considerations above.
