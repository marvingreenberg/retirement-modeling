"""Tests for Pydantic data models."""

import pytest
from pydantic import ValidationError

from retirement_model.models import (
    Account,
    AccountType,
    Owner,
    PlannedExpense,
    Portfolio,
    SimulationConfig,
    SimulationResult,
    SocialSecurityConfig,
    WithdrawalStrategy,
    YearResult,
)


class TestAccount:
    def test_valid_account(self):
        acc = Account(
            id="test",
            name="Test Account",
            balance=100000,
            type=AccountType.BROKERAGE,
            owner=Owner.PRIMARY,
        )
        assert acc.balance == 100000
        assert acc.cost_basis_ratio == 0.0  # default

    def test_balance_rounded(self):
        acc = Account(
            id="test",
            name="Test",
            balance=100000.567,
            type=AccountType.BROKERAGE,
            owner=Owner.PRIMARY,
        )
        assert acc.balance == 100000.57

    def test_negative_balance_rejected(self):
        with pytest.raises(ValidationError):
            Account(
                id="test",
                name="Test",
                balance=-1000,
                type=AccountType.BROKERAGE,
                owner=Owner.PRIMARY,
            )

    def test_invalid_cost_basis_ratio(self):
        with pytest.raises(ValidationError):
            Account(
                id="test",
                name="Test",
                balance=1000,
                type=AccountType.BROKERAGE,
                owner=Owner.PRIMARY,
                cost_basis_ratio=1.5,
            )


class TestSocialSecurityConfig:
    def test_valid_config(self):
        ss = SocialSecurityConfig(
            primary_benefit=40000,
            primary_start_age=70,
            spouse_benefit=30000,
            spouse_start_age=67,
        )
        assert ss.primary_benefit == 40000

    def test_invalid_start_age_too_low(self):
        with pytest.raises(ValidationError):
            SocialSecurityConfig(
                primary_benefit=40000,
                primary_start_age=60,  # too low
                spouse_benefit=30000,
                spouse_start_age=67,
            )

    def test_invalid_start_age_too_high(self):
        with pytest.raises(ValidationError):
            SocialSecurityConfig(
                primary_benefit=40000,
                primary_start_age=75,  # too high
                spouse_benefit=30000,
                spouse_start_age=67,
            )


class TestPlannedExpense:
    def test_one_time_expense(self):
        exp = PlannedExpense(name="Renovation", amount=50000, expense_type="one_time", year=2028)
        assert exp.expense_type == "one_time"
        assert exp.year == 2028

    def test_recurring_expense(self):
        exp = PlannedExpense(
            name="Care",
            amount=100000,
            expense_type="recurring",
            start_year=2030,
            end_year=2045,
        )
        assert exp.expense_type == "recurring"
        assert exp.start_year == 2030

    def test_zero_amount_rejected(self):
        with pytest.raises(ValidationError):
            PlannedExpense(name="Test", amount=0, expense_type="one_time", year=2028)


class TestSimulationConfig:
    def test_valid_config(self, sample_config: SimulationConfig):
        assert sample_config.simulation_years == 10
        assert sample_config.strategy_target == WithdrawalStrategy.IRMAA_TIER_1

    def test_defaults_applied(self):
        cfg = SimulationConfig(
            current_age_primary=65,
            current_age_spouse=62,
            start_year=2026,
            annual_spend_net=100000,
            social_security=SocialSecurityConfig(
                primary_benefit=40000,
                primary_start_age=70,
                spouse_benefit=30000,
                spouse_start_age=67,
            ),
        )
        assert cfg.simulation_years == 30  # default
        assert cfg.inflation_rate == 0.03  # default
        assert cfg.conservative_growth is False  # default

    def test_monthly_spend_property(self):
        cfg = SimulationConfig(
            current_age_primary=65,
            current_age_spouse=62,
            start_year=2026,
            annual_spend_net=120000,
            social_security=SocialSecurityConfig(
                primary_benefit=40000,
                primary_start_age=70,
                spouse_benefit=30000,
                spouse_start_age=67,
            ),
        )
        assert cfg.monthly_spend == 10000.0


class TestPortfolio:
    def test_valid_portfolio(self, sample_portfolio: Portfolio):
        assert len(sample_portfolio.accounts) > 0

    def test_empty_accounts_rejected(self, sample_config: SimulationConfig):
        with pytest.raises(ValidationError):
            Portfolio(config=sample_config, accounts=[])


class TestYearResult:
    def test_year_result_creation(self):
        yr = YearResult(
            year=2026,
            age_primary=65,
            age_spouse=62,
            agi=150000,
            bracket="22%",
            rmd=0,
            surplus=0,
            roth_conversion=50000,
            conversion_tax=10000,
            pretax_withdrawal=0,
            roth_withdrawal=0,
            brokerage_withdrawal=50000,
            total_tax=20000,
            irmaa_cost=0,
            total_balance=1000000,
        )
        assert yr.year == 2026
        assert yr.agi == 150000


class TestSimulationResult:
    def test_simulation_result_properties(self):
        years = [
            YearResult(
                year=2026,
                age_primary=65,
                age_spouse=62,
                agi=150000,
                bracket="22%",
                rmd=0,
                surplus=0,
                roth_conversion=0,
                conversion_tax=0,
                pretax_withdrawal=0,
                roth_withdrawal=0,
                brokerage_withdrawal=50000,
                total_tax=20000,
                irmaa_cost=1600,
                total_balance=900000,
            ),
            YearResult(
                year=2027,
                age_primary=66,
                age_spouse=63,
                agi=160000,
                bracket="22%",
                rmd=0,
                surplus=0,
                roth_conversion=0,
                conversion_tax=0,
                pretax_withdrawal=0,
                roth_withdrawal=0,
                brokerage_withdrawal=50000,
                total_tax=22000,
                irmaa_cost=1600,
                total_balance=950000,
            ),
        ]
        result = SimulationResult(strategy=WithdrawalStrategy.STANDARD, years=years)

        assert result.final_balance == 950000
        assert result.total_taxes_paid == 42000
        assert result.total_irmaa_paid == 3200


class TestWithdrawalStrategy:
    def test_all_strategies_exist(self):
        assert WithdrawalStrategy.STANDARD
        assert WithdrawalStrategy.IRMAA_TIER_1
        assert WithdrawalStrategy.BRACKET_22
        assert WithdrawalStrategy.BRACKET_24

    def test_strategy_values(self):
        assert WithdrawalStrategy.STANDARD.value == "standard"
        assert WithdrawalStrategy.IRMAA_TIER_1.value == "irmaa_tier_1"
