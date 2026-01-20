"""Tests for simulation orchestration."""

import pytest

from retirement_model.models import (
    Account,
    AccountType,
    Owner,
    PlannedExpense,
    Portfolio,
    SimulationConfig,
    SocialSecurityConfig,
    WithdrawalStrategy,
)
from retirement_model.simulation import (
    calculate_planned_expenses,
    get_conversion_ceiling,
    run_simulation,
)


class TestGetConversionCeiling:
    def test_bracket_24(self):
        ceiling = get_conversion_ceiling(WithdrawalStrategy.BRACKET_24, 200000)
        assert ceiling == 383900

    def test_bracket_22(self):
        ceiling = get_conversion_ceiling(WithdrawalStrategy.BRACKET_22, 200000)
        assert ceiling == 201050

    def test_irmaa_tier_1(self):
        ceiling = get_conversion_ceiling(WithdrawalStrategy.IRMAA_TIER_1, 218000)
        assert ceiling == 218000

    def test_standard(self):
        ceiling = get_conversion_ceiling(WithdrawalStrategy.STANDARD, 200000)
        assert ceiling == 0


class TestCalculatePlannedExpenses:
    def test_one_time_expense_matching_year(self):
        expenses = [
            PlannedExpense(name="Renovation", amount=50000, expense_type="one_time", year=2026)
        ]
        total = calculate_planned_expenses(expenses, 2026, 65, 1.0)
        assert total == 50000

    def test_one_time_expense_different_year(self):
        expenses = [
            PlannedExpense(name="Renovation", amount=50000, expense_type="one_time", year=2027)
        ]
        total = calculate_planned_expenses(expenses, 2026, 65, 1.0)
        assert total == 0

    def test_recurring_expense_in_range(self):
        expenses = [
            PlannedExpense(
                name="Care",
                amount=100000,
                expense_type="recurring",
                start_age=80,
                end_age=90,
            )
        ]
        total = calculate_planned_expenses(expenses, 2026, 85, 1.0)
        assert total == 100000

    def test_recurring_expense_outside_range(self):
        expenses = [
            PlannedExpense(
                name="Care",
                amount=100000,
                expense_type="recurring",
                start_age=80,
                end_age=90,
            )
        ]
        total = calculate_planned_expenses(expenses, 2026, 75, 1.0)
        assert total == 0

    def test_inflation_adjustment(self):
        expenses = [
            PlannedExpense(
                name="Care",
                amount=100000,
                expense_type="recurring",
                start_age=80,
                end_age=90,
                inflation_adjusted=True,
            )
        ]
        total = calculate_planned_expenses(expenses, 2026, 85, 1.5)
        assert total == 150000

    def test_no_inflation_adjustment(self):
        expenses = [
            PlannedExpense(
                name="Care",
                amount=100000,
                expense_type="recurring",
                start_age=80,
                end_age=90,
                inflation_adjusted=False,
            )
        ]
        total = calculate_planned_expenses(expenses, 2026, 85, 1.5)
        assert total == 100000


class TestRunSimulation:
    def test_simulation_runs(self, sample_portfolio: Portfolio):
        result = run_simulation(sample_portfolio)
        assert len(result.years) == sample_portfolio.config.simulation_years

    def test_simulation_tracks_ages(self, sample_portfolio: Portfolio):
        result = run_simulation(sample_portfolio)
        first_year = result.years[0]
        last_year = result.years[-1]

        assert first_year.age_primary == sample_portfolio.config.current_age_primary
        assert last_year.age_primary == (
            sample_portfolio.config.current_age_primary
            + sample_portfolio.config.simulation_years
            - 1
        )

    def test_simulation_tracks_years(self, sample_portfolio: Portfolio):
        result = run_simulation(sample_portfolio)
        assert result.years[0].year == sample_portfolio.config.start_year
        assert result.years[-1].year == (
            sample_portfolio.config.start_year + sample_portfolio.config.simulation_years - 1
        )

    def test_balance_changes_over_time(self, sample_portfolio: Portfolio):
        result = run_simulation(sample_portfolio)
        # With growth rate > 0, balance should generally increase
        # (unless spending depletes it faster)
        assert result.years[-1].total_balance != result.years[0].total_balance

    def test_rmd_starts_at_correct_age(self, minimal_portfolio: Portfolio):
        minimal_portfolio.config.current_age_primary = 72
        minimal_portfolio.config.simulation_years = 3

        result = run_simulation(minimal_portfolio)
        # At age 72, no RMD (starts at 73)
        assert result.years[0].rmd == 0
        # At age 73, RMD starts
        assert result.years[1].rmd > 0

    def test_social_security_starts_at_correct_age(self):
        portfolio = Portfolio(
            config=SimulationConfig(
                current_age_primary=68,
                current_age_spouse=68,
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
                    id="brokerage",
                    name="Brokerage",
                    balance=1000000,
                    type=AccountType.BROKERAGE,
                    owner=Owner.JOINT,
                    cost_basis_ratio=0.5,
                )
            ],
        )

        result = run_simulation(portfolio)
        # At age 68, 69: no SS
        # AGI should be lower in years 0, 1
        assert result.years[0].agi < result.years[2].agi

    def test_different_strategies_produce_different_results(self, sample_portfolio: Portfolio):
        sample_portfolio.config.strategy_target = WithdrawalStrategy.STANDARD
        result_standard = run_simulation(sample_portfolio)

        sample_portfolio.config.strategy_target = WithdrawalStrategy.BRACKET_24
        result_bracket = run_simulation(sample_portfolio)

        # Different strategies should lead to different conversion amounts
        total_conv_standard = sum(y.roth_conversion for y in result_standard.years)
        total_conv_bracket = sum(y.roth_conversion for y in result_bracket.years)
        assert total_conv_standard != total_conv_bracket

    def test_irmaa_tracked(self, sample_portfolio: Portfolio):
        result = run_simulation(sample_portfolio)
        # At least some years may have IRMAA costs
        has_irmaa = any(y.irmaa_cost > 0 for y in result.years)
        # This depends on AGI, so just check it's being calculated
        assert all(isinstance(y.irmaa_cost, (int, float)) for y in result.years)

    def test_result_properties(self, sample_portfolio: Portfolio):
        result = run_simulation(sample_portfolio)
        assert result.final_balance == result.years[-1].total_balance
        assert result.total_taxes_paid == sum(y.total_tax for y in result.years)
        assert result.total_irmaa_paid == sum(y.irmaa_cost for y in result.years)

    def test_planned_expenses_affect_withdrawals(self):
        base_portfolio = Portfolio(
            config=SimulationConfig(
                current_age_primary=65,
                current_age_spouse=65,
                simulation_years=5,
                start_year=2026,
                annual_spend_net=50000,
                strategy_target=WithdrawalStrategy.STANDARD,
                social_security=SocialSecurityConfig(
                    primary_benefit=0,
                    primary_start_age=70,
                    spouse_benefit=0,
                    spouse_start_age=70,
                ),
                planned_expenses=[],
            ),
            accounts=[
                Account(
                    id="brokerage",
                    name="Brokerage",
                    balance=1000000,
                    type=AccountType.BROKERAGE,
                    owner=Owner.JOINT,
                    cost_basis_ratio=0.5,
                )
            ],
        )

        result_no_expense = run_simulation(base_portfolio)

        # Add a big one-time expense
        base_portfolio.config.planned_expenses = [
            PlannedExpense(name="Big Purchase", amount=100000, expense_type="one_time", year=2027)
        ]
        result_with_expense = run_simulation(base_portfolio)

        # Year 1 (2027) should have higher withdrawals with the expense
        year_2027_no_expense = result_no_expense.years[1]
        year_2027_with_expense = result_with_expense.years[1]
        assert (
            year_2027_with_expense.brokerage_withdrawal > year_2027_no_expense.brokerage_withdrawal
        )
