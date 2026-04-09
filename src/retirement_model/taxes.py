"""Tax calculation functions for retirement simulation."""

import math
from dataclasses import dataclass, field

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


def calculate_federal_income_tax(
    taxable_income: float,
    brackets: list[TaxBracket] | None = None,
) -> float:
    """Federal ordinary-income tax via progressive brackets.

    `taxable_income` should be ordinary income above the federal standard
    deduction. Long-term capital gains are taxed separately via
    `calculate_capital_gains_tax` and should NOT be included here.
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
    return federal_tax


def calculate_state_income_tax(
    state_taxable_income: float,
    state_rate: float,
) -> float:
    """Flat-rate state income tax on the state-specific taxable base.

    For Virginia, capital gains are taxed as ordinary income at the state
    level, and Social Security is exempt — so the caller should pass:

        state_taxable = AGI - SS_taxable_portion

    where AGI already includes IRA/401k withdrawals, RMDs, pensions,
    capital gains, employment income, and Roth conversions. This is a
    simplified single-rate model; real VA brackets are 2/3/5/5.75%.
    """
    if state_taxable_income <= 0:
        return 0.0
    return state_taxable_income * state_rate


def get_effective_tax_rate(
    agi: float,
    brackets: list[TaxBracket] | None,
    state_rate: float,
    deduction: float,
    ss_taxable: float = 0.0,
) -> float:
    """Get the effective (average) tax rate on AGI for withholding estimates.

    Combines federal + state. Federal applies the standard deduction;
    state (VA-style) applies to (AGI - ss_taxable) with no deduction.
    Pass `ss_taxable` to exclude Social Security from the state base.
    """
    if agi <= 0:
        return 0.0
    federal_taxable = max(0, agi - deduction)
    state_taxable = max(0, agi - ss_taxable)
    fed = calculate_federal_income_tax(federal_taxable, brackets)
    state = calculate_state_income_tax(state_taxable, state_rate)
    return (fed + state) / agi


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
    """Estimate effective tax rate for withholding calculations.

    Combines federal + state. Approximate (doesn't subtract SS).
    """
    taxable = max(0, agi - deduction)
    if taxable <= 0:
        return 0.0
    fed = calculate_federal_income_tax(taxable, brackets)
    state = calculate_state_income_tax(taxable, state_rate)
    return (fed + state) / agi if agi > 0 else 0.0


# ---------------------------------------------------------------------------
# Conversion planner — closed-form, withdrawal-order aware
# ---------------------------------------------------------------------------

# Minimum AGI headroom before attempting a Roth conversion. Below this the
# resulting conversion would be rounding noise.
MIN_CONVERSION_HEADROOM = 5000


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


@dataclass
class ConversionPlan:
    """Result of computing a year's Roth conversion + tax-funding plan.

    `conversion` is the amount to move from IRA-eligible pretax to Roth.
    `tax_payments` is the per-category breakdown of where to draw the
    marginal tax bill from, in walked order. Each entry is a (category, amount)
    tuple where category is one of 'cash', 'brokerage', 'pretax', 'roth'.
    `agi_impact` is the additional AGI created by paying the marginal tax
    (zero for cash/roth, full amount for pretax, gain portion for brokerage).
    `marginal_tax` is the total marginal tax bill T(ceiling) - T(base_agi).
    """

    conversion: float
    tax_payments: list[tuple[str, float]] = field(default_factory=list)
    agi_impact: float = 0.0
    marginal_tax: float = 0.0


# AGI impact factor per category for paying $1 of conversion tax. Cash and
# Roth distributions don't create taxable income; pretax withdrawals are
# fully taxable as ordinary income; brokerage is handled separately because
# its impact depends on per-account basis ratios (handled inline below).
_NON_BROKERAGE_AGI_FACTOR: dict[str, float] = {
    "cash": 0.0,
    "pretax": 1.0,
    "roth": 0.0,
}


def compute_conversion_plan(
    *,
    base_agi: float,
    ceiling: float,
    deduction: float,
    fed_brackets: list[TaxBracket],
    state_rate: float,
    ss_taxable: float,
    available_ira: float,
    withdrawal_order: list[str],
    cash_available: float,
    pretax_available: float,
    roth_available: float,
    brokerage_snapshot: list[tuple[float, float]],
) -> ConversionPlan:
    """Compute a closed-form Roth conversion plan for one simulation year.

    Why this is closed form: given a base AGI and a target ceiling, the
    marginal tax bill `T(ceiling) - T(base)` is fixed by the bracket
    structure regardless of how the marginal income is split between the
    conversion `C` and the tax-funding withdrawals. The "AGI impact" of
    paying that tax depends on which account funds it (zero for cash/Roth,
    full amount for pretax, capital-gain portion for brokerage). Once
    you know the AGI impact, the conversion is whatever's left of the
    headroom: `C = headroom - agi_impact`.

    The tax-funding source follows the configured withdrawal_order — so a
    pretax-first portfolio will fund conversion tax from pretax, a
    brokerage-first portfolio from brokerage, etc. Falls through to the
    next category when one depletes. This matches the user's mental model
    that "pretax first should mean pretax everywhere" and avoids the
    surprise of seeing a brokerage withdrawal that the user didn't expect.

    Conservative AGI semantics: capital gains realized when paying the
    conversion tax from brokerage are counted toward the ceiling, even
    for ordinary-income bracket strategies (BRACKET_22, BRACKET_24).
    Technically those gains have their own LTCG bracket structure and
    don't push you into a higher ordinary bracket — but the user prefers
    the conservative interpretation: the bracket limit is meant to bound
    total tax exposure, and letting gains escape the headroom would just
    trade one kind of tax for another.

    Args:
        base_agi: AGI after forced sources + spending withdrawals already
            booked, before any conversion or conversion-tax withdrawal.
        ceiling: Target AGI ceiling (per the chosen ConversionStrategy).
        deduction: Inflation-adjusted standard deduction.
        fed_brackets: Inflation-adjusted federal income tax brackets.
        state_rate: State income tax rate.
        ss_taxable: Taxable Social Security portion (excluded from VA state
            tax base).
        available_ira: Total IRA-eligible pretax balance available for
            conversion (the source of the conversion itself).
        withdrawal_order: Categories in priority order for funding the
            conversion tax. Strings: 'cash', 'pretax', 'brokerage', 'roth'.
        cash_available: Available cash account balance for tax payment.
        pretax_available: Available pretax balance NOT counted in
            available_ira (e.g., 401k that isn't IRA-eligible for conversion
            but can fund the tax payment as ordinary income).
        roth_available: Available Roth balance for tax payment.
        brokerage_snapshot: Brokerage accounts in withdrawal order as
            (balance, cost_basis_ratio) tuples; basis-aware gains.

    Returns:
        ConversionPlan with the conversion amount, per-category tax
        payment plan, total AGI impact of paying the tax, and the
        marginal tax bill itself.
    """
    if ceiling <= base_agi or available_ira <= 0:
        return ConversionPlan(conversion=0)

    headroom = ceiling - base_agi
    if headroom < MIN_CONVERSION_HEADROOM:
        return ConversionPlan(conversion=0)

    # Step 1: total marginal tax bill IF we use up all the headroom.
    # This is invariant under how the marginal income is split between
    # the conversion and the tax-funding pulls — both add ordinary-income
    # AGI to the same brackets, so T(base + H) is fixed.
    fed_at_ceiling = calculate_federal_income_tax(max(0, ceiling - deduction), fed_brackets)
    state_at_ceiling = calculate_state_income_tax(max(0, ceiling - ss_taxable), state_rate)
    fed_at_base = calculate_federal_income_tax(max(0, base_agi - deduction), fed_brackets)
    state_at_base = calculate_state_income_tax(max(0, base_agi - ss_taxable), state_rate)
    marginal_tax = (fed_at_ceiling + state_at_ceiling) - (fed_at_base + state_at_base)
    if marginal_tax <= 0:
        return ConversionPlan(conversion=0)

    # Step 2: walk withdrawal_order, allocating marginal_tax across categories.
    # For brokerage, the available capacity is the snapshot total and the
    # AGI impact is computed via estimate_withdrawal_gains so the per-account
    # basis ratios are honored.
    total_brokerage = sum(b for b, _ in brokerage_snapshot)
    available_by_cat: dict[str, float] = {
        "cash": max(0.0, cash_available),
        "pretax": max(0.0, pretax_available),
        "brokerage": max(0.0, total_brokerage),
        "roth": max(0.0, roth_available),
    }

    remaining_tax = marginal_tax
    tax_payments: list[tuple[str, float]] = []
    agi_impact = 0.0

    for cat in withdrawal_order:
        if remaining_tax <= 1.0:
            break
        avail = available_by_cat.get(cat, 0.0)
        if avail <= 0:
            continue
        take = min(avail, remaining_tax)
        if cat == "brokerage":
            # Cost-basis-aware gain calculation, walking the snapshot in
            # the order the accounts will actually be drained.
            agi_impact += estimate_withdrawal_gains(take, 0, brokerage_snapshot)
        else:
            agi_impact += take * _NON_BROKERAGE_AGI_FACTOR.get(cat, 0.0)
        tax_payments.append((cat, take))
        remaining_tax -= take

    # Step 3: conversion is what's left of the headroom after the tax
    # payment's AGI impact is accounted for. Capped at IRA availability.
    conversion = max(0.0, headroom - agi_impact)
    conversion = min(conversion, available_ira)

    return ConversionPlan(
        conversion=conversion,
        tax_payments=tax_payments,
        agi_impact=agi_impact,
        marginal_tax=marginal_tax,
    )
