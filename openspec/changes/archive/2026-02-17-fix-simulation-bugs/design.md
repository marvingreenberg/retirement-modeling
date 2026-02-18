## Context

The simulation engine has 14 correctness bugs identified in todo/002-identified-issues.md. These range from using flat marginal rates instead of progressive brackets (overtaxes all income) to the Monte Carlo API silently using a simplified model that ignores taxes entirely. The fixes span `simulation.py`, `taxes.py`, `withdrawals.py`, `monte_carlo.py`, `models.py`, `constants.py`, and `api.py`, plus frontend removal of the flat capital gains field.

## Goals / Non-Goals

**Goals:**
- Correct all tax calculations to use progressive brackets
- Track absolute cost basis on brokerage accounts
- Gate income streams by the correct owner's age
- Wire the Monte Carlo API to the full simulation
- Remove the flat capital gains rate field (pre-1.0, no backward compatibility)

**Non-Goals:**
- LIFO/FIFO cost basis tracking (out of scope — use proportional)
- Post-RMD Roth conversions (deferred to 200-additional-improvements)
- Tax withholding reconciliation redesign (deferred to 100-withdrawal-plan)
- Pre-retirement accumulation phase (deferred to 201-start-year-exploration)

## Decisions

### D1: Absolute cost basis tracking
Track `cost_basis` as a dollar amount on Account, not just a ratio. The ratio is derived: `ratio = basis / balance`. This simplifies updates:
- Growth: basis unchanged, ratio decreases naturally
- Deposit: `basis += deposit`
- Withdrawal: `basis -= withdrawal * ratio` (proportional reduction)

**Alternative considered:** Keep ratio and update it after every operation. Rejected because ratio math accumulates rounding errors and is harder to reason about.

**Migration:** Compute initial `cost_basis = balance * cost_basis_ratio` at simulation start. The `cost_basis_ratio` field remains on the model for user input but is converted to absolute at the start of simulation.

### D2: Dedicated excess_income account for surplus
Surplus cash (income exceeding spending) goes to a new `excess_income` brokerage account rather than an arbitrary existing brokerage. This account is auto-created (like `roth_conversion`) with `cost_basis_ratio=1.0` since deposits are already-taxed income. Owner is JOINT if spouse exists, PRIMARY otherwise.

### D3: Remove flat capital gains entirely
Delete `tax_rate_capital_gains` from `SimulationConfig`, Pydantic model, Zod schema, TypeScript types, stores/defaults, and the Advanced Settings UI. The `calculate_capital_gains_tax()` function always uses progressive tiered brackets. Pre-1.0 — no migration path needed.

### D4: Progressive capital gains stacking
Capital gains are stacked on top of ordinary income to determine the starting bracket. Each slice of gains is taxed at the rate for its bracket. Example: $80K ordinary + $50K gains → first $9,250 of gains at 0% (up to $89,250), remaining $40,750 at 15%.

### D5: Wire API to full Monte Carlo
Replace `run_monte_carlo` (which calls simplified `run_single_simulation`) with `run_full_monte_carlo` in the API's `/monte-carlo` endpoint. This makes MC results consistent with single-run results. The simplified `run_monte_carlo` and `run_single_simulation` functions remain in the codebase (used by CLI, tests) but are no longer the API default.

### D6: Income stream owner field
Add `owner: Owner = Owner.PRIMARY` to `IncomeStream`. The simulation uses `age_primary` for primary-owned streams and `age_spouse` for spouse-owned streams when checking start_age/end_age. The `ss_auto` generation tags streams with the appropriate owner.

## Risks / Trade-offs

- **Performance**: Full Monte Carlo is slower than simplified (~100x per iteration). With 1000 iterations this could be 30-60 seconds. Mitigation: The API already supports configurable iteration count; users can reduce if needed.
- **Breaking change**: Removing `tax_rate_capital_gains` will cause validation failures for saved portfolios that include it. Mitigation: Pre-1.0, and the Zod schema already rejects unknown fields gracefully. The `saveFileSchema` can use `.passthrough()` or `.strip()` to ignore unknown fields.
- **Cost basis initialization**: Existing portfolios have `cost_basis_ratio` but not `cost_basis`. Mitigation: Convert at simulation start (`basis = balance * ratio`), don't change the stored model.
