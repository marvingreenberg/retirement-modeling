# Implementation Decisions

Decisions made during unattended implementation sessions. Each entry identifies the issue, choices considered, and the decision with justification.

---

## BE-3: Capital gains flat_rate vs tiered brackets

**Issue**: `calculate_capital_gains_tax` now accepts inflation-adjusted `brackets`, but the simulation always passes `cfg.tax_rate_capital_gains` (default 0.15) as `flat_rate`, which takes priority over tiered brackets.

**Choices**:
1. Make `tax_rate_capital_gains` optional (None default) so tiered brackets become the default path
2. Keep flat_rate taking priority; tiered brackets are infrastructure for future use
3. Remove flat_rate entirely and always use tiered

**Decision**: Choice 2 — keep flat_rate priority. Simple, updating later is simple. The infrastructure is in place; switching to tiered brackets is a one-line model default change when desired.

---

## BE-3: Standard deduction hardcoded at 30000

**Issue**: `simulation.py` line 316 had `max(0, current_agi - 30000)` but `STANDARD_DEDUCTION_MFJ` is 29200.

**Choices**:
1. Fix to use `STANDARD_DEDUCTION_MFJ` (29200)
2. Update the constant to 30000

**Decision**: Choice 1 — use the correct constant value (29200) and inflate it. The 30000 was a rounding error.

---

## BE-3: Tax function signatures for dict brackets

**Issue**: Tax functions (`get_marginal_tax_rate`, `calculate_income_tax`) accepted `list[TaxBracket]` but `inflate_brackets` returns `list[dict]`.

**Choices**:
1. Convert inflation-adjusted dicts back to TaxBracket objects
2. Widen function signatures to accept both `list[TaxBracket]` and `list[dict]`
3. Change everything to use dicts only

**Decision**: Choice 2 — widen signatures with isinstance check. Simple, backward-compatible, no changes needed to existing callers.

---

## BE-4: Historical regime count (7 vs 8)

**Issue**: Spec called for "approximately 8 regimes." Research identified 7 distinct eras with readily available data (Pre-ERTA 1978, ERTA 1984, TRA86 1988, OBRA93 1993, Bush 2003, ATRA 2013, TCJA 2024).

**Choices**:
1. Include 7 well-documented regimes
2. Add an 8th by splitting an era (e.g., separate EGTRRA and JGTRRA)

**Decision**: Choice 1 — 7 regimes. Each represents a genuinely distinct tax policy era. Splitting one to hit 8 would create two near-identical entries adding noise rather than policy diversity.

---

## BE-4: Regime sequence override vs config brackets priority

**Issue**: When both `tax_regime_sequence` and `cfg.tax_brackets_federal` are provided, which takes precedence?

**Choices**:
1. Regime sequence overrides config brackets (MC path controls tax law)
2. Config brackets override regime sequence (user-specified always wins)

**Decision**: Choice 1 — regime sequence takes priority. The regime sequence is the MC variation mechanism; if someone passes both, the regime sequence is the intentional override. Config brackets remain the default when no regime sequence is provided.

---

## BE-4: Block sampling uses module-level random

**Issue**: `sample_regime_sequence` uses `random.seed()` and `random.choice()`/`random.randint()` at module level, which can affect other random state if called without a seed.

**Choices**:
1. Use `random.Random(seed)` instance for isolation
2. Use module-level random (matches `sample_historical_sequence` pattern)

**Decision**: Choice 2 — module-level random, matching the existing pattern in `monte_carlo.py:sample_historical_sequence`. Both functions are called within MC loops that manage seeds per iteration. Adding instance isolation would be a larger refactor touching both sampling functions.
