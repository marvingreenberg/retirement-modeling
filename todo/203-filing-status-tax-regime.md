# Filing Status: Single vs MFJ Tax Regime

## Problem

The backend hardcodes Married Filing Jointly (MFJ) constants everywhere. When `current_age_spouse == 0` (no spouse), the UI correctly hides spouse fields, but the simulation still uses MFJ brackets, deduction, IRMAA tiers, etc. This produces incorrect results for single filers — bracket widths are roughly 2x what they should be, deduction is $29,200 instead of $14,600, etc.

## Signal

`current_age_spouse == 0` already means "no spouse" — both the frontend and backend agree on this. No new model field needed for the basic case.

## Scope

### 1. Add single-filer constants to `constants.py`

- `FEDERAL_TAX_BRACKETS_SINGLE` (2024 single brackets)
- `STANDARD_DEDUCTION_SINGLE` ($14,600)
- `IRMAA_TIERS_SINGLE` (single thresholds)
- `CAPITAL_GAINS_BRACKETS_SINGLE` (single thresholds)
- `SS_TAXABLE_THRESHOLD_50_SINGLE` / `SS_TAXABLE_THRESHOLD_85_SINGLE`

### 2. Create a filing-status-aware constant selector

Rather than passing raw floats/dicts for brackets and deduction, model these as a typed selection:

```python
class FilingStatus(str, Enum):
    MFJ = "mfj"
    SINGLE = "single"

# Something like:
def tax_constants(status: FilingStatus) -> TaxConstants:
    """Return the complete set of brackets/deduction/tiers for a filing status."""
```

This replaces the pattern of `deduction: float = STANDARD_DEDUCTION_MFJ` with a structured type, making it clear these aren't arbitrary floats — they're one of two (for now) fixed regimes.

### 3. Update `simulation.py` to select regime

At the top of `run_simulation`, determine filing status from `cfg.current_age_spouse == 0` and use that to select the base constants (brackets, deduction, IRMAA, cap gains, SS thresholds). The rest of the simulation just uses whatever was selected.

### 4. Update `taxes.py` function signatures

Remove MFJ defaults from functions like `calculate_income_tax`, `calculate_irmaa_cost`, `calculate_capital_gains_tax`, `calculate_ss_taxable_portion`, `get_effective_tax_rate`. Callers must pass the regime-appropriate values explicitly. This prevents accidentally using the wrong defaults.

### 5. Update `calculate_ss_taxable_portion`

Currently raises `NotImplementedError` for non-MFJ. Implement single thresholds ($25K / $34K for single vs $32K / $44K for MFJ).

### 6. Frontend

Mostly already correct — it hides/shows spouse fields based on `hasSpouse`. No major changes needed. The API request already carries `current_age_spouse: 0` for single filers.

### 7. Unify bracket type on `TaxBracket`, eliminate `BracketDict`

`BracketDict = dict[str, float]` is underspecified — any string key is valid, no IDE completion, no type safety. `TaxBracket` (Pydantic model with `.limit`, `.rate`) is well-defined and unambiguous. Standardize on `TaxBracket` everywhere:

- Replace `BracketDict` usage in `constants.py` (bracket/tier definitions), `taxes.py` (function signatures), `simulation.py` (inflation-adjusted brackets)
- Tax functions should accept `list[TaxBracket]` and use `b.limit`, `b.rate` — not `b["limit"]`
- IRMAA tiers use `cost` instead of `rate` — may need a separate `IRMAATier` type or a shared base with an alias
- Remove `BracketDict` type alias from `constants.py`

### 8. Eliminate magic numbers throughout codebase

This is broader than just bracket thresholds. Bare numeric literals with domain meaning appear across Python source, tests, and frontend code.

**Tax bracket thresholds** (~20+ occurrences each):
- `383900`, `201050`, `206000` in `strategies.py`, `simulation.py`, `output.py`, tests
- Should be named attributes on the `TaxConstants` structure (e.g., `regime.bracket_24_limit`)

**Social Security** (`social_security.py`, `taxes.py`):
- `0.5` (SS benefit multiplier for combined income)
- `32000` / `44000` (SS taxable thresholds — already in constants.py but hardcoded again in taxes.py)
- `6000` (base taxable amount in 85% tier formula)
- `0.85` (max taxable portion of SS)
- `36` (month cutoff for early reduction formula)
- Move `SS_TAXABLE_PCT`, `DELAYED_CREDIT_PER_MONTH`, `EARLY_REDUCTION_FIRST_36`, `EARLY_REDUCTION_BEYOND_36`, `MAX_CLAIMING_AGE`, `DEFAULT_FRA` to constants.py

**Simulation logic** (`simulation.py`):
- `5000` — minimum AGI headroom before attempting Roth conversion
- `0.75` — brokerage withdrawal safety factor for conversion ceiling
- `1.0` — threshold for "close enough to zero" checks (inconsistent: sometimes `> 1.0`, sometimes `<= 1.0`)

**Monte Carlo** (`monte_carlo.py`):
- `5` — block size for historical sampling
- `0.06` / `0.03` — fallback growth/inflation rates
- `0.07` / `0.15` — mean/stddev for return distribution
- `0.03` / `0.015` — mean/stddev for inflation distribution
- `0.05`, `0.25`, `0.75`, `0.95` — percentile values

**Models** (`models.py`):
- `73` — RMD start age (already in constants.py, hardcoded again as field default)
- `120` / `2.0` — max age / fallback divisor in RMD calculation

**Frontend** (`ui/src/`):
- Audit `.svelte` and `.ts` files for bare tax thresholds, bracket values, contribution limits, and other domain constants that should be defined centrally or passed from the backend

### 8. Consistent threshold for "close enough to zero"

Multiple places check `remaining_spend`, `tax_shortfall`, etc. against bare `1.0`. Define a constant like `BALANCE_EPSILON = 1.0` and use it consistently.

## Notes

- This is almost entirely a backend change for filing status; magic numbers span backend, tests, and frontend
- Custom tax brackets provided in the portfolio JSON should still override the defaults (user may have specific brackets)
- The `vary_tax_regimes` Monte Carlo feature also needs to respect filing status when sampling historical regimes
- The `TaxConstants` structure from step 2 naturally addresses the bracket magic numbers — limits become named attributes rather than anonymous numbers
