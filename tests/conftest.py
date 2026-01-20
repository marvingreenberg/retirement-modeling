"""Shared test fixtures for retirement_model tests."""

import pytest

from retirement_model.models import (
    Account,
    AccountType,
    Owner,
    PlannedExpense,
    Portfolio,
    SimulationConfig,
    SocialSecurityConfig,
    TaxBracket,
    WithdrawalStrategy,
)


@pytest.fixture
def sample_accounts() -> list[Account]:
    """Sample set of accounts for testing."""
    return [
        Account(
            id="brokerage_1",
            name="Joint Brokerage",
            balance=500000,
            type=AccountType.BROKERAGE,
            owner=Owner.JOINT,
            cost_basis_ratio=0.25,
        ),
        Account(
            id="ira_primary",
            name="Primary IRA",
            balance=300000,
            type=AccountType.PRETAX,
            owner=Owner.PRIMARY,
        ),
        Account(
            id="roth_primary",
            name="Primary Roth",
            balance=100000,
            type=AccountType.ROTH,
            owner=Owner.PRIMARY,
        ),
        Account(
            id="ira_spouse",
            name="Spouse IRA",
            balance=200000,
            type=AccountType.PRETAX,
            owner=Owner.SPOUSE,
            available_at_age=62,
        ),
    ]


@pytest.fixture
def sample_config() -> SimulationConfig:
    """Sample simulation configuration for testing."""
    return SimulationConfig(
        current_age_primary=65,
        current_age_spouse=62,
        simulation_years=10,
        start_year=2026,
        annual_spend_net=100000,
        inflation_rate=0.03,
        investment_growth_rate=0.06,
        strategy_target=WithdrawalStrategy.IRMAA_TIER_1,
        tax_brackets_federal=[
            TaxBracket(limit=23200, rate=0.10),
            TaxBracket(limit=94300, rate=0.12),
            TaxBracket(limit=201050, rate=0.22),
            TaxBracket(limit=383900, rate=0.24),
            TaxBracket(limit=487450, rate=0.32),
        ],
        tax_rate_state=0.05,
        tax_rate_capital_gains=0.15,
        irmaa_limit_tier_1=206000,
        social_security=SocialSecurityConfig(
            primary_benefit=40000,
            primary_start_age=70,
            spouse_benefit=30000,
            spouse_start_age=67,
        ),
        rmd_start_age=73,
    )


@pytest.fixture
def sample_portfolio(sample_accounts: list[Account], sample_config: SimulationConfig) -> Portfolio:
    """Sample portfolio for testing."""
    return Portfolio(config=sample_config, accounts=sample_accounts)


@pytest.fixture
def minimal_portfolio() -> Portfolio:
    """Minimal portfolio for quick tests."""
    return Portfolio(
        config=SimulationConfig(
            current_age_primary=70,
            current_age_spouse=70,
            simulation_years=5,
            start_year=2026,
            annual_spend_net=50000,
            social_security=SocialSecurityConfig(
                primary_benefit=30000,
                primary_start_age=70,
                spouse_benefit=20000,
                spouse_start_age=70,
            ),
        ),
        accounts=[
            Account(
                id="ira",
                name="IRA",
                balance=500000,
                type=AccountType.PRETAX,
                owner=Owner.PRIMARY,
            ),
        ],
    )
