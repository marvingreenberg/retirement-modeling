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
