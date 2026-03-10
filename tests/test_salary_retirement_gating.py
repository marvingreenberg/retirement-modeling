"""Tests for SalaryAutoConfig model and retirement gating behavior."""

import pytest

from retirement_model.models import (
    Account,
    AccountType,
    IncomeKind,
    IncomeStream,
    Owner,
    Portfolio,
    SalaryAutoConfig,
    SimulationConfig,
    SocialSecurityConfig,
)
from retirement_model.simulation import run_simulation


def _make_portfolio(
    age: int = 60,
    years: int = 10,
    streams=None,
    retirement_age=None,
    strategy="standard",
    accounts=None,
):
    return Portfolio(
        config=SimulationConfig(
            current_age_primary=age,
            current_age_spouse=age,
            simulation_years=years,
            start_year=2026,
            annual_spend_net=50000,
            strategy_target=strategy,
            retirement_age=retirement_age,
            social_security=SocialSecurityConfig(
                primary_benefit=0,
                primary_start_age=70,
                spouse_benefit=0,
                spouse_start_age=70,
            ),
            income_streams=streams or [],
        ),
        accounts=accounts
        or [
            Account(
                id="brokerage",
                name="Brokerage",
                balance=1_000_000,
                type=AccountType.BROKERAGE,
                owner=Owner.JOINT,
                cost_basis_ratio=0.5,
            ),
        ],
    )


class TestSalaryAutoModel:
    def test_salary_auto_round_trip(self) -> None:
        sal = SalaryAutoConfig(primary_salary=120000, primary_growth=0.05, primary_end_age=65)
        cfg = SimulationConfig(
            current_age_primary=60,
            current_age_spouse=58,
            start_year=2026,
            annual_spend_net=50000,
            social_security=SocialSecurityConfig(
                primary_benefit=0,
                primary_start_age=70,
                spouse_benefit=0,
                spouse_start_age=70,
            ),
            salary_auto=sal,
        )
        assert cfg.salary_auto is not None
        assert cfg.salary_auto.primary_salary == 120000
        assert cfg.salary_auto.primary_growth == 0.05
        assert cfg.salary_auto.primary_end_age == 65

    def test_salary_auto_defaults(self) -> None:
        sal = SalaryAutoConfig()
        assert sal.primary_salary == 0
        assert sal.primary_growth == 0.03
        assert sal.primary_end_age is None
        assert sal.spouse_salary is None
        assert sal.spouse_growth is None
        assert sal.spouse_end_age is None
        assert sal.primary_pretax_401k == 0
        assert sal.primary_roth_401k == 0
        assert sal.spouse_pretax_401k == 0
        assert sal.spouse_roth_401k == 0

    def test_salary_auto_none_by_default(self) -> None:
        cfg = SimulationConfig(
            current_age_primary=65,
            current_age_spouse=62,
            start_year=2026,
            annual_spend_net=50000,
            social_security=SocialSecurityConfig(
                primary_benefit=0,
                primary_start_age=70,
                spouse_benefit=0,
                spouse_start_age=70,
            ),
        )
        assert cfg.salary_auto is None


class TestRetirementGating:
    def test_no_spending_withdrawals_pre_retirement(self) -> None:
        """Pre-retirement years with salary covering expenses should have no spending withdrawals."""
        streams = [
            IncomeStream(
                name="Salary",
                kind="employment",
                amount=120000,
                start_age=60,
                end_age=64,
                taxable_pct=1.0,
            )
        ]
        portfolio = _make_portfolio(age=60, years=10, streams=streams, retirement_age=65)
        result = run_simulation(portfolio)

        # Years 0-4 (ages 60-64): pre-retirement, salary covers expenses
        for i in range(5):
            yr = result.years[i]
            assert (
                yr.pretax_withdrawal == 0
            ), f"Year {i} (age {yr.age_primary}): unexpected pretax withdrawal"
            assert (
                yr.roth_withdrawal == 0
            ), f"Year {i} (age {yr.age_primary}): unexpected roth withdrawal"

        # Years 5+ (ages 65+): retired, withdrawals should occur to cover spending
        has_withdrawal = False
        for i in range(5, len(result.years)):
            yr = result.years[i]
            if yr.brokerage_withdrawal > 0 or yr.pretax_withdrawal > 0 or yr.roth_withdrawal > 0:
                has_withdrawal = True
                break
        assert has_withdrawal, "Expected spending withdrawals after retirement"

    def test_withdrawals_start_at_retirement(self) -> None:
        """The first year at retirement age should have withdrawals if needed."""
        streams = [
            IncomeStream(
                name="Salary",
                kind="employment",
                amount=120000,
                start_age=60,
                end_age=64,
                taxable_pct=1.0,
            )
        ]
        portfolio = _make_portfolio(age=60, years=10, streams=streams, retirement_age=65)
        result = run_simulation(portfolio)

        # Year 5 = age 65, salary ended at 64 so no income, must withdraw
        yr_65 = result.years[5]
        assert yr_65.age_primary == 65
        total_wd = yr_65.brokerage_withdrawal + yr_65.pretax_withdrawal + yr_65.roth_withdrawal
        assert total_wd > 0, "Expected withdrawals at retirement age"

    def test_roth_conversions_suppressed_pre_retirement(self) -> None:
        """Roth conversions should not occur pre-retirement, but should post-retirement."""
        streams = [
            IncomeStream(
                name="Salary",
                kind="employment",
                amount=120000,
                start_age=60,
                end_age=64,
                taxable_pct=1.0,
            )
        ]
        accounts = [
            Account(
                id="brokerage",
                name="Brokerage",
                balance=500_000,
                type=AccountType.BROKERAGE,
                owner=Owner.JOINT,
                cost_basis_ratio=0.5,
            ),
            Account(
                id="ira",
                name="IRA",
                balance=500_000,
                type=AccountType.IRA,
                owner=Owner.PRIMARY,
            ),
        ]
        portfolio = _make_portfolio(
            age=60,
            years=10,
            streams=streams,
            retirement_age=65,
            strategy="irmaa_tier_1",
            accounts=accounts,
        )
        result = run_simulation(portfolio)

        # Pre-retirement: no Roth conversions
        for i in range(5):
            yr = result.years[i]
            assert (
                yr.roth_conversion == 0
            ), f"Year {i} (age {yr.age_primary}): unexpected Roth conversion {yr.roth_conversion}"

        # Post-retirement: conversions should happen (IRA has money, strategy allows it)
        any_conversion = any(
            result.years[i].roth_conversion > 0 for i in range(5, len(result.years))
        )
        assert any_conversion, "Expected Roth conversions after retirement"

    def test_retirement_age_none_means_always_retired(self) -> None:
        """With retirement_age=None (default), withdrawals happen from year 0."""
        portfolio = _make_portfolio(age=60, years=5, retirement_age=None)
        result = run_simulation(portfolio)

        # Year 0 should have withdrawals to cover spending (no income streams)
        yr0 = result.years[0]
        total_wd = yr0.brokerage_withdrawal + yr0.pretax_withdrawal + yr0.roth_withdrawal
        assert total_wd > 0, "Expected withdrawals from year 0 when retirement_age is None"

    def test_employment_income_flows_pre_retirement(self) -> None:
        """Employment income should appear in income_details during pre-retirement."""
        streams = [
            IncomeStream(
                name="Salary",
                kind="employment",
                amount=100000,
                start_age=60,
                end_age=64,
                taxable_pct=1.0,
            )
        ]
        portfolio = _make_portfolio(age=60, years=10, streams=streams, retirement_age=65)
        result = run_simulation(portfolio)

        # Pre-retirement years should show salary in income_details
        for i in range(5):
            yr = result.years[i]
            salary_income = [d for d in yr.income_details if d.name == "Salary"]
            assert len(salary_income) > 0, f"Year {i}: expected Salary in income_details"
            assert salary_income[0].amount > 0, f"Year {i}: salary amount should be positive"

        # Post-retirement (age 65+): salary ended at 64, should not appear
        for i in range(5, len(result.years)):
            yr = result.years[i]
            salary_income = [d for d in yr.income_details if d.name == "Salary"]
            assert (
                len(salary_income) == 0
            ), f"Year {i} (age {yr.age_primary}): salary should not appear after end_age"

    def test_tax_shortfall_uses_only_liquid_pre_retirement(self) -> None:
        """Pre-retirement tax shortfall should be covered from brokerage only, not pretax/roth."""
        # High employment income to generate a tax liability, with pretax and roth accounts
        streams = [
            IncomeStream(
                name="Salary",
                kind="employment",
                amount=200000,
                start_age=60,
                end_age=64,
                taxable_pct=1.0,
            )
        ]
        accounts = [
            Account(
                id="brokerage",
                name="Brokerage",
                balance=500_000,
                type=AccountType.BROKERAGE,
                owner=Owner.JOINT,
                cost_basis_ratio=0.5,
            ),
            Account(
                id="ira",
                name="IRA",
                balance=500_000,
                type=AccountType.IRA,
                owner=Owner.PRIMARY,
            ),
            Account(
                id="roth",
                name="Roth IRA",
                balance=200_000,
                type=AccountType.ROTH_IRA,
                owner=Owner.PRIMARY,
            ),
        ]
        portfolio = _make_portfolio(
            age=60,
            years=10,
            streams=streams,
            retirement_age=65,
            accounts=accounts,
        )
        result = run_simulation(portfolio)

        # Pre-retirement years: no pretax or roth withdrawals for tax shortfall
        for i in range(5):
            yr = result.years[i]
            assert yr.pretax_withdrawal == 0, (
                f"Year {i} (age {yr.age_primary}): pretax withdrawal {yr.pretax_withdrawal} "
                "should be 0 pre-retirement"
            )
            assert yr.roth_withdrawal == 0, (
                f"Year {i} (age {yr.age_primary}): roth withdrawal {yr.roth_withdrawal} "
                "should be 0 pre-retirement"
            )
