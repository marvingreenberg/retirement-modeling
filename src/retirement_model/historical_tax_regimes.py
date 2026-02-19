"""Historical federal tax regime data for Monte Carlo tax policy variation.

All dollar amounts normalized to 2024 purchasing power using CPI-U adjustment.
Each regime has a uniform 7-bracket federal structure, 3-tier capital gains,
6-tier IRMAA, and standard deduction — matching the format in constants.py.

Eras with fewer brackets are padded by repeating the top rate.
Pre-IRMAA eras use float("inf") limits with $0 cost.
Eras with >7 brackets are consolidated to 7 representative breakpoints.
"""

import copy
import random

HISTORICAL_TAX_REGIMES = [
    {
        "name": "Pre-ERTA 1978 (High Tax)",
        "federal_brackets": [
            {"limit": 15000, "rate": 0.14},
            {"limit": 48000, "rate": 0.21},
            {"limit": 95000, "rate": 0.32},
            {"limit": 170000, "rate": 0.45},
            {"limit": 302000, "rate": 0.55},
            {"limit": 565000, "rate": 0.64},
            {"limit": float("inf"), "rate": 0.70},
        ],
        "capital_gains_brackets": [
            {"limit": 89250, "rate": 0.35},
            {"limit": 553850, "rate": 0.35},
            {"limit": float("inf"), "rate": 0.35},
        ],
        "standard_deduction": 15000,
        "irmaa_tiers": [
            {"limit": float("inf"), "cost": 0},
            {"limit": float("inf"), "cost": 0},
            {"limit": float("inf"), "cost": 0},
            {"limit": float("inf"), "cost": 0},
            {"limit": float("inf"), "cost": 0},
            {"limit": float("inf"), "cost": 0},
        ],
    },
    {
        "name": "ERTA 1984 (Reagan Cuts)",
        "federal_brackets": [
            {"limit": 10500, "rate": 0.11},
            {"limit": 23600, "rate": 0.16},
            {"limit": 49600, "rate": 0.22},
            {"limit": 76300, "rate": 0.28},
            {"limit": 142000, "rate": 0.38},
            {"limit": 265000, "rate": 0.45},
            {"limit": float("inf"), "rate": 0.50},
        ],
        "capital_gains_brackets": [
            {"limit": 89250, "rate": 0.20},
            {"limit": 553850, "rate": 0.20},
            {"limit": float("inf"), "rate": 0.20},
        ],
        "standard_deduction": 10500,
        "irmaa_tiers": [
            {"limit": float("inf"), "cost": 0},
            {"limit": float("inf"), "cost": 0},
            {"limit": float("inf"), "cost": 0},
            {"limit": float("inf"), "cost": 0},
            {"limit": float("inf"), "cost": 0},
            {"limit": float("inf"), "cost": 0},
        ],
    },
    {
        "name": "TRA86 1988 (Tax Reform)",
        "federal_brackets": [
            {"limit": 80300, "rate": 0.15},
            {"limit": 194100, "rate": 0.28},
            {"limit": 403000, "rate": 0.33},
            {"limit": 500000, "rate": 0.28},
            {"limit": 600000, "rate": 0.28},
            {"limit": 750000, "rate": 0.28},
            {"limit": float("inf"), "rate": 0.28},
        ],
        "capital_gains_brackets": [
            {"limit": 89250, "rate": 0.28},
            {"limit": 553850, "rate": 0.28},
            {"limit": float("inf"), "rate": 0.28},
        ],
        "standard_deduction": 13500,
        "irmaa_tiers": [
            {"limit": float("inf"), "cost": 0},
            {"limit": float("inf"), "cost": 0},
            {"limit": float("inf"), "cost": 0},
            {"limit": float("inf"), "cost": 0},
            {"limit": float("inf"), "cost": 0},
            {"limit": float("inf"), "cost": 0},
        ],
    },
    {
        "name": "OBRA93 1993 (Clinton)",
        "federal_brackets": [
            {"limit": 81200, "rate": 0.15},
            {"limit": 196100, "rate": 0.28},
            {"limit": 308000, "rate": 0.31},
            {"limit": 550000, "rate": 0.36},
            {"limit": 650000, "rate": 0.396},
            {"limit": 800000, "rate": 0.396},
            {"limit": float("inf"), "rate": 0.396},
        ],
        "capital_gains_brackets": [
            {"limit": 89250, "rate": 0.28},
            {"limit": 553850, "rate": 0.28},
            {"limit": float("inf"), "rate": 0.28},
        ],
        "standard_deduction": 13600,
        "irmaa_tiers": [
            {"limit": float("inf"), "cost": 0},
            {"limit": float("inf"), "cost": 0},
            {"limit": float("inf"), "cost": 0},
            {"limit": float("inf"), "cost": 0},
            {"limit": float("inf"), "cost": 0},
            {"limit": float("inf"), "cost": 0},
        ],
    },
    {
        "name": "Bush 2003 (EGTRRA/JGTRRA)",
        "federal_brackets": [
            {"limit": 23800, "rate": 0.10},
            {"limit": 96600, "rate": 0.15},
            {"limit": 194900, "rate": 0.25},
            {"limit": 297000, "rate": 0.28},
            {"limit": 530300, "rate": 0.33},
            {"limit": 700000, "rate": 0.35},
            {"limit": float("inf"), "rate": 0.35},
        ],
        "capital_gains_brackets": [
            {"limit": 96600, "rate": 0.0},
            {"limit": 553850, "rate": 0.15},
            {"limit": float("inf"), "rate": 0.15},
        ],
        "standard_deduction": 16200,
        "irmaa_tiers": [
            {"limit": float("inf"), "cost": 0},
            {"limit": float("inf"), "cost": 0},
            {"limit": float("inf"), "cost": 0},
            {"limit": float("inf"), "cost": 0},
            {"limit": float("inf"), "cost": 0},
            {"limit": float("inf"), "cost": 0},
        ],
    },
    {
        "name": "ATRA 2013 (Fiscal Cliff)",
        "federal_brackets": [
            {"limit": 24100, "rate": 0.10},
            {"limit": 97900, "rate": 0.15},
            {"limit": 197600, "rate": 0.25},
            {"limit": 301100, "rate": 0.28},
            {"limit": 537800, "rate": 0.33},
            {"limit": 607500, "rate": 0.35},
            {"limit": float("inf"), "rate": 0.396},
        ],
        "capital_gains_brackets": [
            {"limit": 97900, "rate": 0.0},
            {"limit": 553850, "rate": 0.15},
            {"limit": float("inf"), "rate": 0.20},
        ],
        "standard_deduction": 16500,
        "irmaa_tiers": [
            {"limit": 206000, "cost": 0},
            {"limit": 258000, "cost": 1600},
            {"limit": 322000, "cost": 4000},
            {"limit": 386000, "cost": 6400},
            {"limit": 750000, "cost": 8800},
            {"limit": float("inf"), "cost": 11200},
        ],
    },
    {
        "name": "TCJA 2024 (Current Law)",
        "federal_brackets": [
            {"limit": 23200, "rate": 0.10},
            {"limit": 94300, "rate": 0.12},
            {"limit": 201050, "rate": 0.22},
            {"limit": 383900, "rate": 0.24},
            {"limit": 487450, "rate": 0.32},
            {"limit": 731200, "rate": 0.35},
            {"limit": float("inf"), "rate": 0.37},
        ],
        "capital_gains_brackets": [
            {"limit": 89250, "rate": 0.0},
            {"limit": 553850, "rate": 0.15},
            {"limit": float("inf"), "rate": 0.20},
        ],
        "standard_deduction": 29200,
        "irmaa_tiers": [
            {"limit": 206000, "cost": 0},
            {"limit": 258000, "cost": 1600},
            {"limit": 322000, "cost": 4000},
            {"limit": 386000, "cost": 6400},
            {"limit": 750000, "cost": 8800},
            {"limit": float("inf"), "cost": 11200},
        ],
    },
]


TaxRegime = dict[str, object]


def get_historical_regimes() -> list[TaxRegime]:
    """Return a copy of the historical tax regime list."""
    return copy.deepcopy(HISTORICAL_TAX_REGIMES)


def sample_regime_sequence(
    num_years: int, regimes: list[TaxRegime] | None = None, seed: int | None = None
) -> list[TaxRegime]:
    """Sample a tax regime sequence for Monte Carlo simulation.

    Selects a regime uniformly at random and holds it for 2-4 consecutive years
    (simulating political cycles), then selects a new regime.
    """
    if seed is not None:
        random.seed(seed)

    regime_list = regimes or HISTORICAL_TAX_REGIMES
    sequence: list[TaxRegime] = []
    i = 0
    while i < num_years:
        regime = random.choice(regime_list)
        block_len = random.randint(2, 4)
        for _ in range(min(block_len, num_years - i)):
            sequence.append(regime)
        i += block_len

    return sequence[:num_years]
