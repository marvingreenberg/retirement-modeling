"""Pydantic models for retirement simulation data structures."""

from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from retirement_model.constants import (
    DEFAULT_GROWTH_RATE,
    DEFAULT_INFLATION_RATE,
    DEFAULT_SIMULATION_YEARS,
    DEFAULT_STATE_TAX_RATE,
)


class AccountType(str, Enum):
    BROKERAGE = "brokerage"
    PRETAX = "pretax"
    ROTH = "roth"


class Owner(str, Enum):
    PRIMARY = "primary"
    SPOUSE = "spouse"
    JOINT = "joint"


class ConversionStrategy(str, Enum):
    """Controls Roth conversion ceiling - how aggressively to convert pre-tax to Roth."""

    STANDARD = "standard"
    IRMAA_TIER_1 = "irmaa_tier_1"
    BRACKET_22 = "22_percent_bracket"
    BRACKET_24 = "24_percent_bracket"


class SpendingStrategy(str, Enum):
    """Controls annual spending calculation method."""

    FIXED_DOLLAR = "fixed_dollar"
    PERCENT_OF_PORTFOLIO = "percent_of_portfolio"
    GUARDRAILS = "guardrails"
    RMD_BASED = "rmd_based"


# Backwards compatibility alias
WithdrawalStrategy = ConversionStrategy


class GuardrailsConfig(BaseModel):
    """Configuration for guardrails (Guyton-Klinger) spending strategy."""

    initial_withdrawal_rate: float = Field(default=0.05, ge=0.01, le=0.15)
    floor_percent: float = Field(default=0.80, ge=0.5, le=1.0)
    ceiling_percent: float = Field(default=1.20, ge=1.0, le=2.0)
    adjustment_percent: float = Field(default=0.10, ge=0.01, le=0.25)


class Account(BaseModel):
    """A single investment account."""

    id: str
    name: str
    balance: float = Field(ge=0)
    type: AccountType
    owner: Owner
    cost_basis_ratio: float = Field(default=1.0, ge=0, le=1.0)
    available_at_age: int = Field(default=0, ge=0)

    @field_validator("balance", mode="before")
    @classmethod
    def round_balance(cls, v: float) -> float:
        return round(v, 2)


class SocialSecurityConfig(BaseModel):
    """Social Security benefit configuration."""

    primary_benefit: float = Field(ge=0)
    primary_start_age: int = Field(ge=62, le=70)
    spouse_benefit: float = Field(ge=0)
    spouse_start_age: int = Field(ge=62, le=70)


class TaxBracket(BaseModel):
    """A single tax bracket definition."""

    limit: float
    rate: float = Field(ge=0, le=1.0)


class PlannedExpense(BaseModel):
    """A planned future expense (one-time or recurring)."""

    name: str
    amount: float = Field(gt=0)
    expense_type: Literal["one_time", "recurring"] = "one_time"
    year: int | None = None
    start_age: int | None = None
    end_age: int | None = None
    inflation_adjusted: bool = True

    @field_validator("year", "start_age", "end_age", mode="before")
    @classmethod
    def validate_timing(cls, v: int | None) -> int | None:
        if v is not None and v < 0:
            raise ValueError("Timing values must be non-negative")
        return v


class SimulationConfig(BaseModel):
    """Configuration for the retirement simulation."""

    current_age_primary: int = Field(ge=0, le=120)
    current_age_spouse: int = Field(ge=0, le=120)
    simulation_years: int = Field(default=DEFAULT_SIMULATION_YEARS, ge=1, le=100)
    start_year: int = Field(ge=2000, le=2100)

    annual_spend_net: float = Field(gt=0)
    inflation_rate: float = Field(default=DEFAULT_INFLATION_RATE, ge=0, le=0.5)
    investment_growth_rate: float = Field(default=DEFAULT_GROWTH_RATE, ge=-0.5, le=0.5)

    # Conversion strategy (Roth conversion ceiling)
    strategy_target: ConversionStrategy = ConversionStrategy.IRMAA_TIER_1

    # Spending strategy (annual withdrawal calculation)
    spending_strategy: SpendingStrategy = SpendingStrategy.FIXED_DOLLAR
    withdrawal_rate: float = Field(default=0.04, ge=0.01, le=0.15)
    guardrails_config: GuardrailsConfig = Field(default_factory=GuardrailsConfig)

    tax_brackets_federal: list[TaxBracket] = Field(default_factory=list)
    tax_rate_state: float = Field(default=DEFAULT_STATE_TAX_RATE, ge=0, le=0.2)
    tax_rate_capital_gains: float = Field(default=0.15, ge=0, le=0.3)

    irmaa_limit_tier_1: float = Field(default=206000, gt=0)

    social_security: SocialSecurityConfig

    rmd_start_age: int = Field(default=73, ge=70, le=80)

    planned_expenses: list[PlannedExpense] = Field(default_factory=list)


class Portfolio(BaseModel):
    """Complete portfolio with accounts and configuration."""

    config: SimulationConfig
    accounts: list[Account]

    @field_validator("accounts")
    @classmethod
    def validate_accounts(cls, v: list[Account]) -> list[Account]:
        if not v:
            raise ValueError("Portfolio must have at least one account")
        return v


class YearResult(BaseModel):
    """Results for a single simulation year."""

    year: int
    age_primary: int
    age_spouse: int
    agi: float
    bracket: str
    rmd: float
    surplus: float
    roth_conversion: float
    conversion_tax: float
    pretax_withdrawal: float
    roth_withdrawal: float
    brokerage_withdrawal: float
    total_tax: float
    irmaa_cost: float
    total_balance: float

    # Spending info
    spending_target: float = 0.0

    # Account balances by type
    pretax_balance: float = 0.0
    roth_balance: float = 0.0
    brokerage_balance: float = 0.0


class SimulationResult(BaseModel):
    """Complete results from a simulation run."""

    strategy: ConversionStrategy
    spending_strategy: SpendingStrategy = SpendingStrategy.FIXED_DOLLAR
    years: list[YearResult]

    @property
    def final_balance(self) -> float:
        return self.years[-1].total_balance if self.years else 0.0

    @property
    def total_taxes_paid(self) -> float:
        return sum(y.total_tax for y in self.years)

    @property
    def total_irmaa_paid(self) -> float:
        return sum(y.irmaa_cost for y in self.years)

    @property
    def total_roth_conversions(self) -> float:
        return sum(y.roth_conversion for y in self.years)
