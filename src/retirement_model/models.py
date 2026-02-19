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
    CASH_CD = "cash_cd"
    ROTH_IRA = "roth_ira"
    ROTH_401K = "roth_401k"
    ROTH_CONVERSION = "roth_conversion"
    TRADITIONAL_401K = "401k"
    TRADITIONAL_403B = "403b"
    TRADITIONAL_457B = "457b"
    IRA = "ira"
    SEP_IRA = "sep_ira"
    SIMPLE_IRA = "simple_ira"


class TaxCategory(str, Enum):
    PRETAX = "pretax"
    ROTH = "roth"
    BROKERAGE = "brokerage"
    CASH = "cash"


TAX_CATEGORY_MAP: dict[AccountType, TaxCategory] = {
    AccountType.BROKERAGE: TaxCategory.BROKERAGE,
    AccountType.CASH_CD: TaxCategory.CASH,
    AccountType.ROTH_IRA: TaxCategory.ROTH,
    AccountType.ROTH_401K: TaxCategory.ROTH,
    AccountType.ROTH_CONVERSION: TaxCategory.ROTH,
    AccountType.TRADITIONAL_401K: TaxCategory.PRETAX,
    AccountType.TRADITIONAL_403B: TaxCategory.PRETAX,
    AccountType.TRADITIONAL_457B: TaxCategory.PRETAX,
    AccountType.IRA: TaxCategory.PRETAX,
    AccountType.SEP_IRA: TaxCategory.PRETAX,
    AccountType.SIMPLE_IRA: TaxCategory.PRETAX,
}

_IRA_TYPES = frozenset(
    {
        AccountType.IRA,
        AccountType.SEP_IRA,
        AccountType.SIMPLE_IRA,
        AccountType.TRADITIONAL_401K,
        AccountType.TRADITIONAL_403B,
        AccountType.TRADITIONAL_457B,
    }
)

ACCOUNT_TYPE_DEFAULTS: dict[AccountType, dict] = {
    AccountType.BROKERAGE: {"cost_basis_ratio": 0.40, "editable": True, "default_available_age": 0},
    AccountType.CASH_CD: {"cost_basis_ratio": 1.00, "editable": False, "default_available_age": 0},
    AccountType.ROTH_IRA: {
        "cost_basis_ratio": 1.00,
        "editable": False,
        "default_available_age": 60,
    },
    AccountType.ROTH_401K: {
        "cost_basis_ratio": 1.00,
        "editable": False,
        "default_available_age": 60,
    },
    AccountType.ROTH_CONVERSION: {
        "cost_basis_ratio": 1.00,
        "editable": False,
        "default_available_age": 60,
    },
    AccountType.TRADITIONAL_401K: {
        "cost_basis_ratio": 0.00,
        "editable": False,
        "default_available_age": 60,
    },
    AccountType.TRADITIONAL_403B: {
        "cost_basis_ratio": 0.00,
        "editable": False,
        "default_available_age": 60,
    },
    AccountType.TRADITIONAL_457B: {
        "cost_basis_ratio": 0.00,
        "editable": False,
        "default_available_age": 60,
    },
    AccountType.IRA: {"cost_basis_ratio": 0.00, "editable": False, "default_available_age": 60},
    AccountType.SEP_IRA: {"cost_basis_ratio": 0.00, "editable": False, "default_available_age": 60},
    AccountType.SIMPLE_IRA: {
        "cost_basis_ratio": 0.00,
        "editable": False,
        "default_available_age": 60,
    },
}


def tax_category(account_type: AccountType) -> TaxCategory:
    return TAX_CATEGORY_MAP[account_type]


def is_conversion_eligible(account_type: AccountType) -> bool:
    return account_type in _IRA_TYPES


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
    cost_basis_ratio: float = Field(default=0.0, ge=0, le=1.0)
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
    start_year: int | None = None
    end_year: int | None = None
    inflation_adjusted: bool = True

    @field_validator("year", "start_year", "end_year", mode="before")
    @classmethod
    def validate_timing(cls, v: int | None) -> int | None:
        if v is not None and v < 0:
            raise ValueError("Timing values must be non-negative")
        return v


class IncomeStream(BaseModel):
    """A periodic income source (e.g. pension, annuity, rental income)."""

    name: str
    amount: float = Field(ge=0)
    start_age: int = Field(ge=0)
    end_age: int | None = Field(default=None, ge=0)
    taxable_pct: float = Field(default=1.0, ge=0.0, le=1.0)
    cola_rate: float | None = Field(default=None)
    owner: Owner = Owner.PRIMARY


class SSAutoConfig(BaseModel):
    """Auto-generate Social Security income streams from profile data."""

    primary_fra_amount: float = Field(ge=0)
    primary_start_age: int = Field(ge=62, le=70)
    spouse_fra_amount: float | None = Field(default=None, ge=0)
    spouse_start_age: int | None = Field(default=None, ge=62, le=70)
    fra_age: int = Field(default=67, ge=62, le=70)


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

    irmaa_limit_tier_1: float = Field(default=206000, gt=0)

    social_security: SocialSecurityConfig

    rmd_start_age: int = Field(default=73, ge=70, le=80)

    planned_expenses: list[PlannedExpense] = Field(default_factory=list)

    income_streams: list[IncomeStream] = Field(default_factory=list)

    ss_auto: SSAutoConfig | None = None

    vary_tax_regimes: bool = Field(default=False)

    @property
    def monthly_spend(self) -> float:
        return self.annual_spend_net / 12


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


class AccountWithdrawal(BaseModel):
    """Per-account withdrawal detail for a simulation year."""

    account_id: str
    account_name: str
    amount: float
    purpose: str  # "rmd", "spending", "conversion"


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
    conversion_tax_from_brokerage: float = 0.0
    pretax_withdrawal: float
    roth_withdrawal: float
    brokerage_withdrawal: float
    total_tax: float
    irmaa_cost: float
    total_balance: float

    # Spending & income info
    spending_target: float = 0.0
    planned_expense: float = 0.0
    total_income: float = 0.0
    income_tax: float = 0.0

    # Account balances by type
    pretax_balance: float = 0.0
    roth_balance: float = 0.0
    roth_conversion_balance: float = 0.0
    brokerage_balance: float = 0.0

    # Per-account withdrawal details
    withdrawal_details: list[AccountWithdrawal] = []


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
