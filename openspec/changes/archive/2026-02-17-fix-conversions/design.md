## Context

The backend uses a 3-value `AccountType` enum (`pretax`, `roth`, `brokerage`). All pre-tax accounts are treated identically for conversions, but IRL only Traditional/SEP/SIMPLE IRAs can be directly converted to Roth — 401k/403b/457b require rollover first. The account type dropdown offers no automated defaults for cost basis or taxable ratios, and the chart always shows 3 fixed layers regardless of whether accounts of that type exist.

## Goals / Non-Goals

**Goals:**
- Expand AccountType to specific types with a `tax_category()` mapping for grouping
- Auto-fill cost_basis_ratio and lock it when the type determines it
- Restrict Roth conversion sources to IRA-category pre-tax accounts
- Auto-create a `roth_conversion` account during simulation to track conversions separately
- Chart shows up to 4 layers with dynamic visibility based on non-zero balances
- ApplicationDetails.md explains Roth conversions, RMDs, and cost basis rationale

**Non-Goals:**
- Modeling 401k in-service distributions or rollovers (users can manually create an IRA if they've rolled over)
- Changing withdrawal priority order (still brokerage → roth → pretax)
- Changing tax bracket logic or rates

## Decisions

### 1. Expand AccountType enum, add tax_category() helper

Replace the 3-value enum with specific types. Add a `tax_category()` method that returns the grouping used by withdrawal/tax logic:

```python
class AccountType(str, Enum):
    BROKERAGE = "brokerage"
    CASH_CD = "cash_cd"
    ROTH_IRA = "roth_ira"
    ROTH_401K = "roth_401k"
    ROTH_CONVERSION = "roth_conversion"
    TRADITIONAL_401K = "401k"
    TRADITIONAL_403B = "403b"
    TRADITIONAL_457B = "457b"
    IRA = "ira"
    SEP_IRA = "sep_ira"
    SIMPLE_IRA = "simple_ira"

class TaxCategory(str, Enum):
    PRETAX = "pretax"
    ROTH = "roth"
    BROKERAGE = "brokerage"
    CASH = "cash"

def tax_category(account_type: AccountType) -> TaxCategory: ...
def is_conversion_eligible(account_type: AccountType) -> bool: ...
```

The old `pretax`/`roth` values are removed. **BREAKING** — version bumps to 0.10.0. No migration: imported files with old types fail with "Invalid, pre-version 0.10.0 data"; invalid browser localStorage is silently ignored (treated as empty).

### 2. Account type defaults

Each account type has fixed or default values:

| Type | cost_basis_ratio | Editable? | Notes |
|------|-----------------|-----------|-------|
| brokerage | 0.40 (default) | Yes | User can override |
| cash_cd | 1.00 (fixed) | No | Return of principal only |
| roth_ira | 1.00 (fixed) | No | Qualified distributions tax-free |
| roth_401k | 1.00 (fixed) | No | Same as Roth IRA for simulation |
| roth_conversion | 1.00 (fixed) | No | Auto-created during sim |
| 401k, 403b, 457b | 0.00 (fixed) | No | 100% ordinary income |
| ira, sep_ira, simple_ira | 0.00 (fixed) | No | 100% ordinary income |

When the user changes account type in the dropdown, cost_basis_ratio auto-fills. If fixed, the Cost Basis % input is disabled/greyed out.

### 3. Conversion source restriction

`simulation.py` conversion section: filter pre-tax accounts to only those where `is_conversion_eligible(account.type)` returns True — i.e., `ira`, `sep_ira`, `simple_ira`. Tax payment still comes from brokerage accounts (unchanged).

### 4. Auto-create Roth Conversions account

During simulation setup (before the yearly loop), if a conversion strategy is active and IRA-eligible accounts exist, create a `roth_conversion` type account with balance 0. Conversion deposits go to this account instead of existing Roth accounts. This lets the chart show conversion growth separately.

### 5. Chart: 4 layers with dynamic visibility

YearResult gets a new field `roth_conversion_balance`. BalanceChart renders up to 4 datasets:
- Pre-tax (red) — sum of all pretax-category accounts
- Roth Conversions (purple) — roth_conversion accounts only
- Roth (green) — roth_ira + roth_401k accounts
- Brokerage (gold) — brokerage + cash_cd accounts

Datasets where every year's value is 0 are excluded from the chart entirely (no line, no legend entry). Order bottom-to-top: Pre-tax, Roth Conversions, Roth, Brokerage.

### 6. Version bump to 0.10.0

`pyproject.toml` version → 0.10.0. Sample portfolio in `stores.ts` updated to use specific types. Invalid stored data (localStorage, imported files) is rejected or ignored — no migration path.

## Risks / Trade-offs

- **Breaking stored data**: Acceptable pre-1.0. Files fail with clear message; localStorage silently reset.
- **Enum expansion complexity**: More types means more cases in UI dropdowns and test matrices, but the `tax_category()` abstraction keeps backend logic simple.
- **Cash/CD as separate category**: Could be grouped with brokerage for withdrawal ordering. Decision: treat cash as brokerage-priority (withdrawn first) since it has no tax impact.
