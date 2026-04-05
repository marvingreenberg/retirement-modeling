"""Tax calculation functions for retirement simulation."""

import math

from retirement_model.constants import (
    BRACKET_LABELS,
    CAPITAL_GAINS_BRACKETS_MFJ,
    FEDERAL_TAX_BRACKETS_MFJ,
    IRMAA_TIERS_MFJ,
    RMD_DIVISOR_TABLE,
    RMD_START_AGE,
    RMD_START_AGE_BORN_1960_PLUS,
    SECURE_ACT_BIRTH_YEAR_CUTOFF,
    SS_TAXABLE_THRESHOLD_50_MFJ,
    SS_TAXABLE_THRESHOLD_50_SINGLE,
    SS_TAXABLE_THRESHOLD_85_MFJ,
    SS_TAXABLE_THRESHOLD_85_SINGLE,
    STANDARD_DEDUCTION_MFJ,
    FilingStatus,
    IRMAATier,
    TaxBracket,
)


def inflate_brackets(brackets: list[TaxBracket], factor: float) -> list[TaxBracket]:
    """Scale bracket limits by an inflation factor."""
    return [
        TaxBracket(b.limit * factor if not math.isinf(b.limit) else b.limit, b.rate)
        for b in brackets
    ]


def inflate_irmaa_tiers(tiers: list[IRMAATier], factor: float) -> list[IRMAATier]:
    """Scale IRMAA tier limits by an inflation factor."""
    return [
        IRMAATier(t.limit * factor if not math.isinf(t.limit) else t.limit, t.cost) for t in tiers
    ]


def get_marginal_tax_rate(income: float, brackets: list[TaxBracket] | None = None) -> float:
    """Get the marginal federal tax rate for a given income level."""
    bracket_list = brackets or FEDERAL_TAX_BRACKETS_MFJ
    for bracket in bracket_list:
        if income < bracket.limit:
            return bracket.rate
    return bracket_list[-1].rate


def get_bracket_label(income: float, inflation_factor: float = 1.0) -> str:
    """Get a display label for the tax bracket at a given income level."""
    for threshold, label in BRACKET_LABELS:
        if income > threshold * inflation_factor:
            return label
    return "10%"


def calculate_irmaa_cost(agi: float, tiers: list[IRMAATier] | None = None) -> float:
    """Calculate annual IRMAA surcharge based on AGI (2-year lookback in practice)."""
    tier_list = tiers or IRMAA_TIERS_MFJ
    for tier in tier_list:
        if agi <= tier.limit:
            return tier.cost
    return tier_list[-1].cost


def calculate_capital_gains_tax(
    gains: float,
    ordinary_income: float,
    brackets: list[TaxBracket] | None = None,
) -> float:
    """Calculate capital gains tax using progressive stacking.

    Gains are stacked on top of ordinary_income and taxed progressively
    through 0%/15%/20% brackets. Each slice of gains within a bracket
    is taxed at that bracket's rate.
    """
    if gains <= 0:
        return 0.0

    bracket_list = brackets or CAPITAL_GAINS_BRACKETS_MFJ
    tax = 0.0
    gains_remaining = gains
    income_floor = ordinary_income

    for bracket in bracket_list:
        if gains_remaining <= 0:
            break
        if income_floor >= bracket.limit:
            continue
        taxable_in_bracket = min(gains_remaining, bracket.limit - income_floor)
        tax += taxable_in_bracket * bracket.rate
        gains_remaining -= taxable_in_bracket
        income_floor += taxable_in_bracket

    return tax


def rmd_start_age_for_birth_year(birth_year: int) -> int:
    """Return the RMD start age based on birth year per SECURE Act 2.0."""
    if birth_year >= SECURE_ACT_BIRTH_YEAR_CUTOFF:
        return RMD_START_AGE_BORN_1960_PLUS
    return RMD_START_AGE


def calculate_rmd_amount(age: int, balance: float, rmd_start_age: int = RMD_START_AGE) -> float:
    """Calculate Required Minimum Distribution for a given age and account balance."""
    if age < rmd_start_age:
        return 0.0
    if balance <= 0:
        return 0.0

    divisor = RMD_DIVISOR_TABLE.get(age, 5.0)
    if age > 120:
        divisor = 2.0
    return balance / divisor


def calculate_income_tax(
    taxable_income: float,
    brackets: list[TaxBracket] | None = None,
    state_rate: float = 0.0,
) -> float:
    """Calculate total income tax (federal + state) on taxable income.

    Uses progressive bracket calculation for federal tax.
    """
    if taxable_income <= 0:
        return 0.0

    bracket_list = brackets or FEDERAL_TAX_BRACKETS_MFJ

    federal_tax = 0.0
    prev_limit = 0.0

    for bracket in bracket_list:
        if taxable_income <= prev_limit:
            break
        bracket_income = min(taxable_income, bracket.limit) - prev_limit
        if bracket_income > 0:
            federal_tax += bracket_income * bracket.rate
        prev_limit = bracket.limit

    state_tax = taxable_income * state_rate
    return federal_tax + state_tax


def get_effective_tax_rate(
    agi: float,
    brackets: list[TaxBracket] | None,
    state_rate: float,
    deduction: float,
) -> float:
    """Get the effective (average) tax rate on AGI, accounting for deduction and progressive brackets."""
    if agi <= 0:
        return 0.0
    taxable = max(0, agi - deduction)
    tax = calculate_income_tax(taxable, brackets, state_rate)
    return tax / agi


SS_BENEFIT_COMBINED_INCOME_FACTOR = 0.5
SS_MAX_TAXABLE_FRACTION = 0.85
SS_50_PCT_TAXABLE_FRACTION = 0.5


def calculate_ss_taxable_portion(
    ss_income: float,
    other_income: float,
    filing_status: FilingStatus = FilingStatus.MFJ,
) -> float:
    """Calculate the taxable portion of Social Security benefits.

    Uses IRS tiered formula based on combined income (other income + half of SS).
    Thresholds differ by filing status:
    - MFJ: $32K / $44K
    - Single: $25K / $34K
    """
    if filing_status == FilingStatus.SINGLE:
        threshold_50 = SS_TAXABLE_THRESHOLD_50_SINGLE
        threshold_85 = SS_TAXABLE_THRESHOLD_85_SINGLE
    else:
        threshold_50 = SS_TAXABLE_THRESHOLD_50_MFJ
        threshold_85 = SS_TAXABLE_THRESHOLD_85_MFJ

    combined_income = other_income + (ss_income * SS_BENEFIT_COMBINED_INCOME_FACTOR)
    base_50_range = threshold_85 - threshold_50

    if combined_income <= threshold_50:
        return 0.0
    elif combined_income <= threshold_85:
        return min(
            ss_income * SS_50_PCT_TAXABLE_FRACTION,
            (combined_income - threshold_50) * SS_50_PCT_TAXABLE_FRACTION,
        )
    else:
        base_taxable = min(
            ss_income * SS_50_PCT_TAXABLE_FRACTION,
            base_50_range * SS_50_PCT_TAXABLE_FRACTION,
        )
        additional = min(
            ss_income * SS_MAX_TAXABLE_FRACTION - base_taxable,
            (combined_income - threshold_85) * SS_MAX_TAXABLE_FRACTION,
        )
        return min(base_taxable + additional, ss_income * SS_MAX_TAXABLE_FRACTION)


def estimate_effective_tax_rate(
    agi: float,
    brackets: list[TaxBracket] | None = None,
    state_rate: float = 0.0,
    deduction: float = STANDARD_DEDUCTION_MFJ,
) -> float:
    """Estimate effective tax rate for withholding calculations."""
    taxable = max(0, agi - deduction)
    if taxable <= 0:
        return 0.0

    tax = calculate_income_tax(taxable, brackets, state_rate)
    return tax / agi if agi > 0 else 0.0


# ---------------------------------------------------------------------------
# Conversion solver — accounts for the tax-withdrawal feedback loop
# ---------------------------------------------------------------------------

# Minimum AGI headroom before attempting a Roth conversion
MIN_CONVERSION_HEADROOM = 5000
# Binary search convergence threshold (dollars)
CONVERSION_SOLVER_TOLERANCE = 1.0
# Maximum binary search iterations (2^50 precision — far more than needed)
CONVERSION_SOLVER_MAX_ITER = 50


def estimate_withdrawal_gains(
    tax_amount: float,
    cash_available: float,
    brokerage_snapshot: list[tuple[float, float]],
) -> float:
    """Estimate capital gains from paying a tax bill using cash then brokerage.

    Walks brokerage accounts in order, computing gains at each account's
    cost_basis_ratio. Handles account depletion (piecewise gains).

    This is read-only — does not modify any account balances.

    Args:
        tax_amount: Tax bill to pay.
        cash_available: Cash balance available (withdrawn first, no gains).
        brokerage_snapshot: Available brokerage accounts in withdrawal order,
            each as (balance, cost_basis_ratio).

    Returns:
        Estimated capital gains from the brokerage withdrawals.
    """
    if tax_amount <= 0:
        return 0.0

    remaining = max(0, tax_amount - cash_available)
    gains = 0.0
    for balance, basis_ratio in brokerage_snapshot:
        if remaining <= 0:
            break
        withdrawal = min(balance, remaining)
        gains += withdrawal * (1 - basis_ratio)
        remaining -= withdrawal
    return gains


def solve_max_conversion(
    base_agi: float,
    ceiling: float,
    deduction: float,
    fed_brackets: list[TaxBracket],
    state_rate: float,
    cash_available: float,
    brokerage_snapshot: list[tuple[float, float]],
    available_ira: float,
) -> float:
    """Find the maximum Roth conversion that keeps total AGI at or below ceiling.

    Accounts for the feedback loop: converting C creates an income tax bill,
    paying that tax from cash/brokerage realizes capital gains, those gains
    increase AGI, reducing conversion headroom.

    The solver walks the brokerage accounts in withdrawal order, respecting
    per-account cost basis ratios and account depletion boundaries.

    Works for all conversion strategies (IRMAA, 22% bracket, 24% bracket).

    Args:
        base_agi: AGI before any conversion (SS, pensions, RMDs, etc.).
        ceiling: Target AGI limit (IRMAA threshold, bracket limit, etc.).
        deduction: Inflation-adjusted standard deduction.
        fed_brackets: Inflation-adjusted federal income tax brackets.
        state_rate: State income tax rate.
        cash_available: Cash balance for paying conversion tax (no gains).
        brokerage_snapshot: Brokerage accounts in withdrawal order as
            (balance, cost_basis_ratio) tuples.
        available_ira: Total pre-tax IRA balance eligible for conversion.

    Returns:
        Maximum conversion amount (floored to $0) that satisfies the
        AGI constraint. Returns 0 if headroom < MIN_CONVERSION_HEADROOM.
    """
    if ceiling <= base_agi or available_ira <= 0:
        return 0.0

    max_headroom = ceiling - base_agi
    if max_headroom < MIN_CONVERSION_HEADROOM:
        return 0.0

    upper = min(max_headroom, available_ira)
    lower = 0.0

    tax_before = calculate_income_tax(max(0, base_agi - deduction), fed_brackets, state_rate)

    for _ in range(CONVERSION_SOLVER_MAX_ITER):
        mid = (lower + upper) / 2

        # Income tax delta from converting mid
        tax_after = calculate_income_tax(
            max(0, base_agi + mid - deduction), fed_brackets, state_rate
        )
        tax_bill = tax_after - tax_before

        # Gains from paying that tax out of cash/brokerage
        gains = estimate_withdrawal_gains(tax_bill, cash_available, brokerage_snapshot)

        # Total AGI including conversion + gains from tax payment
        total_agi = base_agi + mid + gains

        if total_agi <= ceiling:
            lower = mid
        else:
            upper = mid

        if upper - lower < CONVERSION_SOLVER_TOLERANCE:
            break

    return lower
