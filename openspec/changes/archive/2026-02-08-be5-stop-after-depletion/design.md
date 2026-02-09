## Context

`run_simulation` loops for `cfg.simulation_years` iterations unconditionally. After all accounts are drained, each subsequent year produces a YearResult with $0 balances, zero withdrawals, and only income-based AGI. These rows add no analytical value.

## Goals / Non-Goals

**Goals:**
- Stop the simulation loop after recording the first year where total balance is $0
- Applies to deterministic and Monte Carlo simulation paths

**Non-Goals:**
- Changing how depletion is detected or reported in Monte Carlo summary stats (already works correctly)
- Adding a "depletion year" field to results (the last year in the list implies it)

## Decisions

### Break after recording the depleted year
After `apply_growth` and appending the YearResult, check `total_balance <= 0`. If so, break. This ensures the depletion year itself is recorded (showing the final drawdown), but no subsequent zero-balance years are generated.

Using `<= 0` rather than `== 0` handles floating-point edge cases where rounding might produce a tiny negative.

### No config flag
This is always-on behavior. There's no reason to continue simulating after depletion — the information is fully captured in the last row. No opt-out needed.

## Risks / Trade-offs

- [Shorter results arrays] → Code that assumes `len(results) == simulation_years` would break. Mitigation: check existing code for such assumptions. The `YearResult` list is already variable-length conceptually.
- [Monte Carlo percentile calculations] → Already handles variable-length runs via depletion tracking. No change needed.
