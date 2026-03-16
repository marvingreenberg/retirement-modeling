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
