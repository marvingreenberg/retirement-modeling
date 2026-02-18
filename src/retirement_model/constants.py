"""Tax constants, IRMAA tiers, and RMD tables for retirement simulation."""

# 2024 Federal Tax Brackets (Married Filing Jointly)
# These are the income limits where each bracket ends
FEDERAL_TAX_BRACKETS_MFJ = [
    {"limit": 23200, "rate": 0.10},
    {"limit": 94300, "rate": 0.12},
    {"limit": 201050, "rate": 0.22},
    {"limit": 383900, "rate": 0.24},
    {"limit": 487450, "rate": 0.32},
    {"limit": 731200, "rate": 0.35},
    {"limit": float("inf"), "rate": 0.37},
]

# Bracket labels for display
BRACKET_LABELS = [
    (487450, "35%+"),
    (383900, "32%"),
    (201050, "24%"),
    (94300, "22%"),
    (23200, "12%"),
    (0, "10%"),
]

# 2024 IRMAA Tiers (Married Filing Jointly)
# Based on MAGI from 2 years prior
IRMAA_TIERS_MFJ = [
    {"limit": 206000, "cost": 0},
    {"limit": 258000, "cost": 1600},
    {"limit": 322000, "cost": 4000},
    {"limit": 386000, "cost": 6400},
    {"limit": 750000, "cost": 8800},
    {"limit": float("inf"), "cost": 11200},
]

# Long-term capital gains tax brackets (Married Filing Jointly)
CAPITAL_GAINS_BRACKETS_MFJ = [
    {"limit": 89250, "rate": 0.0},
    {"limit": 553850, "rate": 0.15},
    {"limit": float("inf"), "rate": 0.20},
]

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

# RMD start age per SECURE 2.0 Act
RMD_START_AGE = 73

# Standard deduction (Married Filing Jointly, 2024)
STANDARD_DEDUCTION_MFJ = 29200

# Social Security taxability threshold (combined income for MFJ)
SS_TAXABLE_THRESHOLD_50 = 32000
SS_TAXABLE_THRESHOLD_85 = 44000

# Default simulation parameters
DEFAULT_INFLATION_RATE = 0.03
DEFAULT_GROWTH_RATE = 0.06
DEFAULT_STATE_TAX_RATE = 0.0575
DEFAULT_SIMULATION_YEARS = 30
