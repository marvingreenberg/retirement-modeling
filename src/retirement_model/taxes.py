"""Tax calculation functions for retirement simulation."""

from retirement_model.constants import (
    BRACKET_LABELS,
    CAPITAL_GAINS_BRACKETS_MFJ,
    FEDERAL_TAX_BRACKETS_MFJ,
    IRMAA_TIERS_MFJ,
    RMD_DIVISOR_TABLE,
    RMD_START_AGE,
    STANDARD_DEDUCTION_MFJ,
)
from retirement_model.models import TaxBracket

import math


def inflate_brackets(brackets: list[dict], factor: float) -> list[dict]:
    """Scale limit/threshold fields in bracket/tier dicts by an inflation factor."""
    result = []
    for entry in brackets:
        adjusted = dict(entry)
        if "limit" in adjusted and not math.isinf(adjusted["limit"]):
            adjusted["limit"] = adjusted["limit"] * factor
        result.append(adjusted)
    return result


def get_marginal_tax_rate(income: float, brackets: list | None = None) -> float:
    """Get the marginal federal tax rate for a given income level."""
    if brackets:
        if isinstance(brackets[0], dict):
            bracket_list = brackets
        else:
            bracket_list = [{"limit": b.limit, "rate": b.rate} for b in brackets]
    else:
        bracket_list = FEDERAL_TAX_BRACKETS_MFJ

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
    total_income: float,
    flat_rate: float | None = None,
    brackets: list[dict] | None = None,
) -> float:
    """
    Calculate capital gains tax on realized gains.

    If flat_rate is provided, uses that rate (legacy behavior).
    Otherwise, uses tiered rates based on total income (inflation-adjustable via brackets).
    """
    if flat_rate is not None:
        return gains * flat_rate

    bracket_list = brackets or CAPITAL_GAINS_BRACKETS_MFJ
    for bracket in bracket_list:
        if total_income < bracket["limit"]:
            return gains * bracket["rate"]
    return gains * bracket_list[-1]["rate"]


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
    brackets: list | None = None,
    state_rate: float = 0.0,
) -> float:
    """
    Calculate total income tax (federal + state) on taxable income.

    Uses progressive bracket calculation for federal tax.
    """
    if taxable_income <= 0:
        return 0.0

    if brackets:
        if isinstance(brackets[0], dict):
            bracket_list = brackets
        else:
            bracket_list = [{"limit": b.limit, "rate": b.rate} for b in brackets]
    else:
        bracket_list = FEDERAL_TAX_BRACKETS_MFJ

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
    brackets: list | None = None,
    state_rate: float = 0.0,
    deduction: float = STANDARD_DEDUCTION_MFJ,
) -> float:
    """Estimate effective tax rate for withholding calculations."""
    taxable = max(0, agi - deduction)
    if taxable <= 0:
        return 0.0

    tax = calculate_income_tax(taxable, brackets, state_rate)
    return tax / agi if agi > 0 else 0.0
