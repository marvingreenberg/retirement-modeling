"""Tests for Monte Carlo simulation."""

import pytest

from retirement_model.historical_returns import (
    get_historical_inflation,
    get_historical_returns,
    get_return_statistics,
)
from retirement_model.models import (
    Account,
    AccountType,
    Owner,
    Portfolio,
    SimulationConfig,
    SocialSecurityConfig,
    SpendingStrategy,
)
from retirement_model.monte_carlo import (
    MonteCarloResult,
    format_monte_carlo_result,
    run_monte_carlo,
    run_single_simulation,
    sample_historical_sequence,
)


class TestHistoricalReturns:
    def test_get_historical_returns(self):
        returns = get_historical_returns()
        assert len(returns) > 90
        assert all(isinstance(r, float) for r in returns)

    def test_get_historical_inflation(self):
        inflation = get_historical_inflation()
        assert len(inflation) > 90
        assert all(isinstance(i, float) for i in inflation)

    def test_return_statistics(self):
        stats = get_return_statistics()
        assert "mean" in stats
        assert "std_dev" in stats
        assert 0.05 < stats["mean"] < 0.15
        assert 0.10 < stats["std_dev"] < 0.25


class TestSampleHistoricalSequence:
    def test_correct_length(self):
        returns = get_historical_returns()
        inflation = get_historical_inflation()
        sampled_r, sampled_i = sample_historical_sequence(30, returns, inflation, seed=42)
        assert len(sampled_r) == 30
        assert len(sampled_i) == 30

    def test_reproducible_with_seed(self):
        returns = get_historical_returns()
        inflation = get_historical_inflation()
        seq1_r, seq1_i = sample_historical_sequence(10, returns, inflation, seed=123)
        seq2_r, seq2_i = sample_historical_sequence(10, returns, inflation, seed=123)
        assert seq1_r == seq2_r
        assert seq1_i == seq2_i

    def test_different_without_seed(self):
        returns = get_historical_returns()
        inflation = get_historical_inflation()
        seq1_r, _ = sample_historical_sequence(10, returns, inflation, seed=1)
        seq2_r, _ = sample_historical_sequence(10, returns, inflation, seed=2)
        assert seq1_r != seq2_r


@pytest.fixture
def simple_portfolio() -> Portfolio:
    return Portfolio(
        config=SimulationConfig(
            current_age_primary=65,
            current_age_spouse=65,
            simulation_years=30,
            start_year=2026,
            annual_spend_net=100000,
            spending_strategy=SpendingStrategy.FIXED_DOLLAR,
            social_security=SocialSecurityConfig(
                primary_benefit=0,
                primary_start_age=70,
                spouse_benefit=0,
                spouse_start_age=70,
            ),
        ),
        accounts=[
            Account(
                id="brokerage",
                name="Brokerage",
                balance=2500000,
                type=AccountType.BROKERAGE,
                owner=Owner.JOINT,
                cost_basis_ratio=0.5,
            )
        ],
    )


class TestRunSingleSimulation:
    def test_basic_simulation(self, simple_portfolio: Portfolio):
        returns_seq = [0.06] * 30
        inflation_seq = [0.03] * 30
        path = run_single_simulation(simple_portfolio, returns_seq, inflation_seq)
        assert path.final_balance > 0
        assert not path.depleted
        assert len(path.year_balances) > 0

    def test_depleting_portfolio(self, simple_portfolio: Portfolio):
        simple_portfolio.config.annual_spend_net = 500000
        returns_seq = [0.0] * 30
        inflation_seq = [0.03] * 30
        path = run_single_simulation(simple_portfolio, returns_seq, inflation_seq)
        assert path.depleted
        assert path.depletion_age is not None

    def test_negative_returns(self, simple_portfolio: Portfolio):
        returns_seq = [-0.10] * 30
        inflation_seq = [0.03] * 30
        path = run_single_simulation(simple_portfolio, returns_seq, inflation_seq)
        assert path.depleted or path.final_balance < simple_portfolio.accounts[0].balance


class TestRunMonteCarlo:
    def test_basic_monte_carlo(self, simple_portfolio: Portfolio):
        result = run_monte_carlo(simple_portfolio, num_simulations=100, seed=42)
        assert result.num_simulations == 100
        assert 0 <= result.success_rate <= 1
        assert len(result.final_balances) == 100

    def test_reproducible_with_seed(self, simple_portfolio: Portfolio):
        result1 = run_monte_carlo(simple_portfolio, num_simulations=50, seed=123)
        result2 = run_monte_carlo(simple_portfolio, num_simulations=50, seed=123)
        assert result1.success_rate == result2.success_rate
        assert result1.median_final_balance == result2.median_final_balance

    def test_percentiles_ordered(self, simple_portfolio: Portfolio):
        result = run_monte_carlo(simple_portfolio, num_simulations=100, seed=42)
        assert result.percentile_5 <= result.percentile_25
        assert result.percentile_25 <= result.median_final_balance
        assert result.median_final_balance <= result.percentile_75
        assert result.percentile_75 <= result.percentile_95


class TestMonteCarloResult:
    def test_failure_rate(self):
        result = MonteCarloResult(
            num_simulations=100,
            success_rate=0.85,
            median_final_balance=1000000,
            percentile_5=100000,
            percentile_25=500000,
            percentile_75=1500000,
            percentile_95=2000000,
            depletion_ages=[80, 82, 85, 88, 90, 85, 87, 89, 92, 83, 84, 86, 88, 90, 91],
            final_balances=[100000] * 100,
        )
        assert result.failure_rate == pytest.approx(0.15)

    def test_depletion_risk_by_age(self):
        result = MonteCarloResult(
            num_simulations=100,
            success_rate=0.90,
            median_final_balance=1000000,
            percentile_5=100000,
            percentile_25=500000,
            percentile_75=1500000,
            percentile_95=2000000,
            depletion_ages=[80, 82, 85, 88, 90, 85, 87, 89, 92, 83],
            final_balances=[100000] * 100,
        )
        risk_85 = result.depletion_risk_by_age(85)
        risk_90 = result.depletion_risk_by_age(90)
        assert risk_85 < risk_90

    def test_no_depletion(self):
        result = MonteCarloResult(
            num_simulations=100,
            success_rate=1.0,
            median_final_balance=1000000,
            percentile_5=100000,
            percentile_25=500000,
            percentile_75=1500000,
            percentile_95=2000000,
            depletion_ages=[],
            final_balances=[100000] * 100,
        )
        assert result.depletion_risk_by_age(90) == 0.0


class TestFormatMonteCarloResult:
    def test_format_includes_key_info(self, simple_portfolio: Portfolio):
        result = run_monte_carlo(simple_portfolio, num_simulations=50, seed=42)
        formatted = format_monte_carlo_result(result, simple_portfolio)
        assert "Monte Carlo" in formatted
        assert "Success Rate" in formatted
        assert "Median" in formatted
        assert "Percentile" in formatted

    def test_format_includes_depletion_risk(self, simple_portfolio: Portfolio):
        simple_portfolio.config.annual_spend_net = 200000
        result = run_monte_carlo(simple_portfolio, num_simulations=50, seed=42)
        if result.depletion_ages:
            formatted = format_monte_carlo_result(result, simple_portfolio)
            assert "Depletion" in formatted
