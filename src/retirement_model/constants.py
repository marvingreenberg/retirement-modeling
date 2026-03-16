"""Tax constants, IRMAA tiers, and RMD tables for retirement simulation."""

import math
from enum import Enum
from typing import NamedTuple


class FilingStatus(str, Enum):
    MFJ = "mfj"
    SINGLE = "single"


class TaxBracket(NamedTuple):
    """A single tax bracket (federal income tax or capital gains)."""

    limit: float
    rate: float


class IRMAATier(NamedTuple):
    """A single IRMAA surcharge tier."""

    limit: float
    cost: float


# Keep BracketDict as a legacy alias for code that still uses dict access
BracketDict = dict[str, float]

# ---------------------------------------------------------------------------
# 2024 Federal Tax Brackets
# ---------------------------------------------------------------------------

FEDERAL_TAX_BRACKETS_MFJ: list[TaxBracket] = [
    TaxBracket(23200, 0.10),
    TaxBracket(94300, 0.12),
    TaxBracket(201050, 0.22),
    TaxBracket(383900, 0.24),
    TaxBracket(487450, 0.32),
    TaxBracket(731200, 0.35),
    TaxBracket(math.inf, 0.37),
]

FEDERAL_TAX_BRACKETS_SINGLE: list[TaxBracket] = [
    TaxBracket(11600, 0.10),
    TaxBracket(47150, 0.12),
    TaxBracket(100525, 0.22),
    TaxBracket(191950, 0.24),
    TaxBracket(243725, 0.32),
    TaxBracket(609350, 0.35),
    TaxBracket(math.inf, 0.37),
]

# Bracket labels for display (MFJ thresholds — used for display only)
BRACKET_LABELS = [
    (487450, "35%+"),
    (383900, "32%"),
    (201050, "24%"),
    (94300, "22%"),
    (23200, "12%"),
    (0, "10%"),
]

# ---------------------------------------------------------------------------
# 2024 IRMAA Tiers
# ---------------------------------------------------------------------------

IRMAA_TIERS_MFJ: list[IRMAATier] = [
    IRMAATier(206000, 0),
    IRMAATier(258000, 1600),
    IRMAATier(322000, 4000),
    IRMAATier(386000, 6400),
    IRMAATier(750000, 8800),
    IRMAATier(math.inf, 11200),
]

IRMAA_TIERS_SINGLE: list[IRMAATier] = [
    IRMAATier(103000, 0),
    IRMAATier(129000, 800),
    IRMAATier(161000, 2000),
    IRMAATier(193000, 3200),
    IRMAATier(500000, 4400),
    IRMAATier(math.inf, 5600),
]

# ---------------------------------------------------------------------------
# Long-term Capital Gains Tax Brackets
# ---------------------------------------------------------------------------

CAPITAL_GAINS_BRACKETS_MFJ: list[TaxBracket] = [
    TaxBracket(89250, 0.0),
    TaxBracket(553850, 0.15),
    TaxBracket(math.inf, 0.20),
]

CAPITAL_GAINS_BRACKETS_SINGLE: list[TaxBracket] = [
    TaxBracket(47025, 0.0),
    TaxBracket(518900, 0.15),
    TaxBracket(math.inf, 0.20),
]

# ---------------------------------------------------------------------------
# Standard Deductions
# ---------------------------------------------------------------------------

STANDARD_DEDUCTION_MFJ = 29200
STANDARD_DEDUCTION_SINGLE = 14600

# ---------------------------------------------------------------------------
# Social Security Taxability Thresholds
# ---------------------------------------------------------------------------

SS_TAXABLE_THRESHOLD_50_MFJ = 32000
SS_TAXABLE_THRESHOLD_85_MFJ = 44000
SS_TAXABLE_THRESHOLD_50_SINGLE = 25000
SS_TAXABLE_THRESHOLD_85_SINGLE = 34000


# ---------------------------------------------------------------------------
# Tax regime bundle — all filing-status-dependent constants in one place
# ---------------------------------------------------------------------------


class TaxRegime(NamedTuple):
    """Complete set of tax constants for a filing status."""

    federal_brackets: list[TaxBracket]
    irmaa_tiers: list[IRMAATier]
    capital_gains_brackets: list[TaxBracket]
    standard_deduction: float
    ss_threshold_50: float
    ss_threshold_85: float


TAX_REGIMES: dict[FilingStatus, TaxRegime] = {
    FilingStatus.MFJ: TaxRegime(
        federal_brackets=FEDERAL_TAX_BRACKETS_MFJ,
        irmaa_tiers=IRMAA_TIERS_MFJ,
        capital_gains_brackets=CAPITAL_GAINS_BRACKETS_MFJ,
        standard_deduction=STANDARD_DEDUCTION_MFJ,
        ss_threshold_50=SS_TAXABLE_THRESHOLD_50_MFJ,
        ss_threshold_85=SS_TAXABLE_THRESHOLD_85_MFJ,
    ),
    FilingStatus.SINGLE: TaxRegime(
        federal_brackets=FEDERAL_TAX_BRACKETS_SINGLE,
        irmaa_tiers=IRMAA_TIERS_SINGLE,
        capital_gains_brackets=CAPITAL_GAINS_BRACKETS_SINGLE,
        standard_deduction=STANDARD_DEDUCTION_SINGLE,
        ss_threshold_50=SS_TAXABLE_THRESHOLD_50_SINGLE,
        ss_threshold_85=SS_TAXABLE_THRESHOLD_85_SINGLE,
    ),
}

# Legacy aliases kept for backward compat with existing references
SS_TAXABLE_THRESHOLD_50 = SS_TAXABLE_THRESHOLD_50_MFJ
SS_TAXABLE_THRESHOLD_85 = SS_TAXABLE_THRESHOLD_85_MFJ

# IRS Uniform Lifetime Table for RMD calculations
# Maps age to distribution period (divisor)
RMD_DIVISOR_TABLE = {
    72: 27.4,
    73: 26.5,
    74: 25.5,
    75: 24.6,
    76: 23.7,
    77: 22.9,
    78: 22.0,
    79: 21.1,
    80: 20.2,
    81: 19.4,
    82: 18.5,
    83: 17.7,
    84: 16.8,
    85: 16.0,
    86: 15.2,
    87: 14.4,
    88: 13.7,
    89: 12.9,
    90: 12.2,
    91: 11.5,
    92: 10.8,
    93: 10.1,
    94: 9.5,
    95: 8.9,
    96: 8.4,
    97: 7.8,
    98: 7.3,
    99: 6.8,
    100: 6.4,
    101: 6.0,
    102: 5.6,
    103: 5.2,
    104: 4.9,
    105: 4.6,
    106: 4.3,
    107: 4.1,
    108: 3.9,
    109: 3.7,
    110: 3.5,
    111: 3.4,
    112: 3.3,
    113: 3.1,
    114: 3.0,
    115: 2.9,
    116: 2.8,
    117: 2.7,
    118: 2.5,
    119: 2.3,
    120: 2.0,
}

# RMD start ages per SECURE 2.0 Act
RMD_START_AGE = 73  # Birth years 1951-1959
RMD_START_AGE_BORN_1960_PLUS = 75
SECURE_ACT_BIRTH_YEAR_CUTOFF = 1960

# Default simulation parameters
DEFAULT_INFLATION_RATE = 0.03
# Per-account growth rate assumptions
EQUITY_RETURN = 0.10
BOND_RETURN = 0.04
CONSERVATIVE_GROWTH_FACTOR = 0.75
DEFAULT_STATE_TAX_RATE = 0.0575
DEFAULT_SIMULATION_YEARS = 30
