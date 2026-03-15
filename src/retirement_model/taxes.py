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
    STANDARD_DEDUCTION_MFJ,
    BracketDict,
)


def inflate_brackets(brackets: list[BracketDict], factor: float) -> list[BracketDict]:
    """Scale limit/threshold fields in bracket/tier dicts by an inflation factor."""
    result = []
    for entry in brackets:
        adjusted = dict(entry)
        if "limit" in adjusted and not math.isinf(adjusted["limit"]):
            adjusted["limit"] = adjusted["limit"] * factor
        result.append(adjusted)
    return result


def get_marginal_tax_rate(income: float, brackets: list[BracketDict] | None = None) -> float:
    """Get the marginal federal tax rate for a given income level."""
    bracket_list = brackets or FEDERAL_TAX_BRACKETS_MFJ

    for bracket in bracket_list:
        if income < bracket["limit"]:
            return bracket["rate"]
    return bracket_list[-1]["rate"]


def get_bracket_label(income: float, inflation_factor: float = 1.0) -> str:
    """Get a display label for the tax bracket at a given income level."""
    for threshold, label in BRACKET_LABELS:
        if income > threshold * inflation_factor:
            return label
    return "10%"


def calculate_irmaa_cost(agi: float, tiers: list[dict[str, float]] | None = None) -> float:
    """Calculate annual IRMAA surcharge based on AGI (2-year lookback in practice)."""
    tier_list = tiers or IRMAA_TIERS_MFJ
    for tier in tier_list:
        if agi <= tier["limit"]:
            return tier["cost"]
    return tier_list[-1]["cost"]


def calculate_capital_gains_tax(
    gains: float,
    ordinary_income: float,
    brackets: list[BracketDict] | None = None,
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
        bracket_limit = bracket["limit"]
        if income_floor >= bracket_limit:
            continue
        taxable_in_bracket = min(gains_remaining, bracket_limit - income_floor)
        tax += taxable_in_bracket * bracket["rate"]
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
    brackets: list[BracketDict] | None = None,
    state_rate: float = 0.0,
) -> float:
    """
    Calculate total income tax (federal + state) on taxable income.

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
        bracket_income = min(taxable_income, bracket["limit"]) - prev_limit
        if bracket_income > 0:
            federal_tax += bracket_income * bracket["rate"]
        prev_limit = bracket["limit"]

    state_tax = taxable_income * state_rate
    return federal_tax + state_tax


def get_effective_tax_rate(
    agi: float,
    brackets: list[BracketDict] | None,
    state_rate: float,
    deduction: float,
) -> float:
    """Get the effective (average) tax rate on AGI, accounting for deduction and progressive brackets."""
    if agi <= 0:
        return 0.0
    taxable = max(0, agi - deduction)
    tax = calculate_income_tax(taxable, brackets, state_rate)
    return tax / agi


def calculate_ss_taxable_portion(
    ss_income: float, other_income: float, filing_status: str = "mfj"
) -> float:
    """
    Calculate the taxable portion of Social Security benefits.

    For MFJ:
    - Below $32,000 combined income: 0% taxable
    - $32,000-$44,000: up to 50% taxable
    - Above $44,000: up to 85% taxable
    """
    if filing_status != "mfj":
        raise NotImplementedError("Only MFJ filing status currently supported")

    combined_income = other_income + (ss_income * 0.5)

    if combined_income <= 32000:
        return 0.0
    elif combined_income <= 44000:
        return min(ss_income * 0.5, (combined_income - 32000) * 0.5)
    else:
        base_taxable = min(ss_income * 0.5, 6000)
        additional = min(ss_income * 0.85 - base_taxable, (combined_income - 44000) * 0.85)
        return min(base_taxable + additional, ss_income * 0.85)


def estimate_effective_tax_rate(
    agi: float,
    brackets: list[BracketDict] | None = None,
    state_rate: float = 0.0,
    deduction: float = STANDARD_DEDUCTION_MFJ,
) -> float:
    """Estimate effective tax rate for withholding calculations."""
    taxable = max(0, agi - deduction)
    if taxable <= 0:
        return 0.0

    tax = calculate_income_tax(taxable, brackets, state_rate)
    return tax / agi if agi > 0 else 0.0
