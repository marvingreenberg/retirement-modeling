"""Tax constants, IRMAA tiers, and RMD tables for retirement simulation."""

from enum import Enum
from typing import NamedTuple

BracketDict = dict[str, float]


class FilingStatus(str, Enum):
    MFJ = "mfj"
    SINGLE = "single"


# ---------------------------------------------------------------------------
# 2024 Federal Tax Brackets
# ---------------------------------------------------------------------------

FEDERAL_TAX_BRACKETS_MFJ: list[BracketDict] = [
    {"limit": 23200, "rate": 0.10},
    {"limit": 94300, "rate": 0.12},
    {"limit": 201050, "rate": 0.22},
    {"limit": 383900, "rate": 0.24},
    {"limit": 487450, "rate": 0.32},
    {"limit": 731200, "rate": 0.35},
    {"limit": float("inf"), "rate": 0.37},
]

FEDERAL_TAX_BRACKETS_SINGLE: list[BracketDict] = [
    {"limit": 11600, "rate": 0.10},
    {"limit": 47150, "rate": 0.12},
    {"limit": 100525, "rate": 0.22},
    {"limit": 191950, "rate": 0.24},
    {"limit": 243725, "rate": 0.32},
    {"limit": 609350, "rate": 0.35},
    {"limit": float("inf"), "rate": 0.37},
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

IRMAA_TIERS_MFJ: list[BracketDict] = [
    {"limit": 206000, "cost": 0},
    {"limit": 258000, "cost": 1600},
    {"limit": 322000, "cost": 4000},
    {"limit": 386000, "cost": 6400},
    {"limit": 750000, "cost": 8800},
    {"limit": float("inf"), "cost": 11200},
]

IRMAA_TIERS_SINGLE: list[BracketDict] = [
    {"limit": 103000, "cost": 0},
    {"limit": 129000, "cost": 800},
    {"limit": 161000, "cost": 2000},
    {"limit": 193000, "cost": 3200},
    {"limit": 500000, "cost": 4400},
    {"limit": float("inf"), "cost": 5600},
]

# ---------------------------------------------------------------------------
# Long-term Capital Gains Tax Brackets
# ---------------------------------------------------------------------------

CAPITAL_GAINS_BRACKETS_MFJ: list[BracketDict] = [
    {"limit": 89250, "rate": 0.0},
    {"limit": 553850, "rate": 0.15},
    {"limit": float("inf"), "rate": 0.20},
]

CAPITAL_GAINS_BRACKETS_SINGLE: list[BracketDict] = [
    {"limit": 47025, "rate": 0.0},
    {"limit": 518900, "rate": 0.15},
    {"limit": float("inf"), "rate": 0.20},
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

    federal_brackets: list[BracketDict]
    irmaa_tiers: list[BracketDict]
    capital_gains_brackets: list[BracketDict]
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

# Standard deduction (Married Filing Jointly, 2024)
STANDARD_DEDUCTION_MFJ = 29200

# Social Security taxability threshold (combined income for MFJ)
SS_TAXABLE_THRESHOLD_50 = 32000
SS_TAXABLE_THRESHOLD_85 = 44000

# Default simulation parameters
DEFAULT_INFLATION_RATE = 0.03
# Per-account growth rate assumptions
EQUITY_RETURN = 0.10
BOND_RETURN = 0.04
CONSERVATIVE_GROWTH_FACTOR = 0.75
DEFAULT_STATE_TAX_RATE = 0.0575
DEFAULT_SIMULATION_YEARS = 30
