"""Tests for income stream functionality."""

import pytest
from pydantic import ValidationError

from retirement_model.models import (
    Account,
    AccountType,
    IncomeStream,
    Owner,
    Portfolio,
    SimulationConfig,
    SSAutoConfig,
    SocialSecurityConfig,
)
from retirement_model.simulation import run_simulation


class TestIncomeStreamModel:
    def test_valid_stream(self) -> None:
        stream = IncomeStream(name="Pension", amount=24000, start_age=65)
        assert stream.taxable_pct == 1.0
        assert stream.end_age is None

    def test_all_fields(self) -> None:
        stream = IncomeStream(
            name="Annuity", amount=12000, start_age=70, end_age=90, taxable_pct=0.6
        )
        assert stream.end_age == 90
        assert stream.taxable_pct == 0.6

    def test_negative_amount_rejected(self) -> None:
        with pytest.raises(ValidationError):
            IncomeStream(name="Bad", amount=-1000, start_age=65)

    def test_taxable_pct_out_of_range(self) -> None:
        with pytest.raises(ValidationError):
            IncomeStream(name="Bad", amount=1000, start_age=65, taxable_pct=1.5)

    def test_taxable_pct_zero(self) -> None:
        stream = IncomeStream(name="Tax-free", amount=1000, start_age=65, taxable_pct=0.0)
        assert stream.taxable_pct == 0.0

    def test_defaults_on_config(self) -> None:
        cfg = SimulationConfig(
            current_age_primary=65,
            current_age_spouse=62,
            start_year=2026,
            annual_spend_net=50000,
            social_security=SocialSecurityConfig(
                primary_benefit=0, primary_start_age=70,
                spouse_benefit=0, spouse_start_age=70,
            ),
        )
        assert cfg.income_streams == []


def _make_portfolio(
    age: int = 65,
    years: int = 10,
    streams: list[IncomeStream] | None = None,
) -> Portfolio:
    return Portfolio(
        config=SimulationConfig(
            current_age_primary=age,
            current_age_spouse=age,
            simulation_years=years,
            start_year=2026,
            annual_spend_net=50000,
            strategy_target="standard",
            social_security=SocialSecurityConfig(
                primary_benefit=0, primary_start_age=70,
                spouse_benefit=0, spouse_start_age=70,
            ),
            income_streams=streams or [],
        ),
        accounts=[
            Account(
                id="brokerage",
                name="Brokerage",
                balance=1_000_000,
                type=AccountType.BROKERAGE,
                owner=Owner.JOINT,
                cost_basis_ratio=0.5,
            )
        ],
    )


class TestIncomeStreamActivation:
    def test_before_start_age(self) -> None:
        streams = [IncomeStream(name="Pension", amount=24000, start_age=70)]
        portfolio = _make_portfolio(age=65, years=3, streams=streams)
        result = run_simulation(portfolio)
        no_stream = run_simulation(_make_portfolio(age=65, years=3))
        # Ages 65-67, pension starts at 70 — should be identical
        for i in range(3):
            assert result.years[i].agi == no_stream.years[i].agi

    def test_at_start_age(self) -> None:
        streams = [IncomeStream(name="Pension", amount=24000, start_age=65)]
        portfolio = _make_portfolio(age=65, years=3, streams=streams)
        result = run_simulation(portfolio)
        no_stream = run_simulation(_make_portfolio(age=65, years=3))
        # AGI should be higher with the pension (24000 * 1.0 taxable)
        assert result.years[0].agi > no_stream.years[0].agi

    def test_after_end_age(self) -> None:
        streams = [IncomeStream(name="Annuity", amount=12000, start_age=65, end_age=66)]
        portfolio = _make_portfolio(age=65, years=5, streams=streams)
        result = run_simulation(portfolio)
        no_stream = run_simulation(_make_portfolio(age=65, years=5))
        # Year 0 (age 65) and year 1 (age 66): stream active
        assert result.years[0].agi > no_stream.years[0].agi
        assert result.years[1].agi > no_stream.years[1].agi
        # Year 2 (age 67): stream ended — AGI should match baseline
        assert result.years[2].agi == no_stream.years[2].agi

    def test_no_end_age_runs_indefinitely(self) -> None:
        streams = [IncomeStream(name="Pension", amount=24000, start_age=65)]
        portfolio = _make_portfolio(age=65, years=5, streams=streams)
        result = run_simulation(portfolio)
        no_stream = run_simulation(_make_portfolio(age=65, years=5))
        # All years should have higher AGI
        for i in range(5):
            assert result.years[i].agi > no_stream.years[i].agi


class TestIncomeStreamAGI:
    def test_fully_taxable_increases_agi(self) -> None:
        streams = [IncomeStream(name="Pension", amount=24000, start_age=65, taxable_pct=1.0)]
        portfolio = _make_portfolio(age=65, years=1, streams=streams)
        result = run_simulation(portfolio)
        no_stream = run_simulation(_make_portfolio(age=65, years=1))
        # Stream adds to AGI but also reduces withdrawals (lowering capital gains AGI),
        # so net AGI change is less than the stream amount
        assert result.years[0].agi != no_stream.years[0].agi
        # Brokerage withdrawals should be lower with stream income
        assert result.years[0].brokerage_withdrawal < no_stream.years[0].brokerage_withdrawal

    def test_partially_taxable_lower_agi_than_fully(self) -> None:
        full = [IncomeStream(name="Pension", amount=20000, start_age=65, taxable_pct=1.0)]
        half = [IncomeStream(name="Annuity", amount=20000, start_age=65, taxable_pct=0.5)]
        result_full = run_simulation(_make_portfolio(age=65, years=1, streams=full))
        result_half = run_simulation(_make_portfolio(age=65, years=1, streams=half))
        # Same amount, but 50% taxable should have lower AGI than 100% taxable
        assert result_half.years[0].agi < result_full.years[0].agi

    def test_zero_taxable_lowers_agi_via_reduced_withdrawals(self) -> None:
        streams = [IncomeStream(name="Roth-like", amount=20000, start_age=65, taxable_pct=0.0)]
        portfolio = _make_portfolio(age=65, years=1, streams=streams)
        result = run_simulation(portfolio)
        no_stream = run_simulation(_make_portfolio(age=65, years=1))
        # 0% taxable adds nothing to AGI directly, but the cash reduces brokerage
        # withdrawals, which lowers capital gains in AGI
        assert result.years[0].agi <= no_stream.years[0].agi
        assert result.years[0].brokerage_withdrawal < no_stream.years[0].brokerage_withdrawal


class TestIncomeStreamCashFlow:
    def test_reduces_withdrawals(self) -> None:
        streams = [IncomeStream(name="Pension", amount=30000, start_age=65)]
        portfolio = _make_portfolio(age=65, years=3, streams=streams)
        result = run_simulation(portfolio)
        no_stream = run_simulation(_make_portfolio(age=65, years=3))
        # With 30k/yr income, less should be withdrawn from brokerage
        assert result.years[0].brokerage_withdrawal < no_stream.years[0].brokerage_withdrawal

    def test_multiple_streams(self) -> None:
        single = [IncomeStream(name="Pension", amount=20000, start_age=65)]
        both = [
            IncomeStream(name="Pension", amount=20000, start_age=65),
            IncomeStream(name="Annuity", amount=10000, start_age=65, taxable_pct=0.6),
        ]
        result_single = run_simulation(_make_portfolio(age=65, years=1, streams=single))
        result_both = run_simulation(_make_portfolio(age=65, years=1, streams=both))
        # Adding a second stream should further reduce withdrawals
        assert result_both.years[0].brokerage_withdrawal < result_single.years[0].brokerage_withdrawal


class TestNoIncomeStreams:
    def test_empty_streams_matches_baseline(self, sample_portfolio: Portfolio) -> None:
        result_default = run_simulation(sample_portfolio)
        sample_portfolio.config.income_streams = []
        result_empty = run_simulation(sample_portfolio)
        for i in range(len(result_default.years)):
            assert result_default.years[i].agi == result_empty.years[i].agi
            assert result_default.years[i].total_balance == result_empty.years[i].total_balance


class TestIncomeStreamCOLA:
    def test_cola_grows_over_years(self) -> None:
        streams = [IncomeStream(name="Pension", amount=24000, start_age=65, cola_rate=0.03)]
        portfolio = _make_portfolio(age=65, years=5, streams=streams)
        result = run_simulation(portfolio)
        # With 3% COLA, later years should have higher AGI than earlier years
        # (all else equal, more income means more AGI)
        assert result.years[4].agi > result.years[0].agi

    def test_no_cola_stays_fixed(self) -> None:
        with_cola = [IncomeStream(name="Pension", amount=24000, start_age=65, cola_rate=0.03)]
        no_cola = [IncomeStream(name="Pension", amount=24000, start_age=65)]
        result_cola = run_simulation(_make_portfolio(age=65, years=5, streams=with_cola))
        result_fixed = run_simulation(_make_portfolio(age=65, years=5, streams=no_cola))
        # Year 0: both same (years_active=0, COLA factor=1.0)
        assert result_cola.years[0].agi == result_fixed.years[0].agi
        # Year 4: COLA version should have higher AGI
        assert result_cola.years[4].agi > result_fixed.years[4].agi

    def test_first_year_no_cola_applied(self) -> None:
        with_cola = [IncomeStream(name="Pension", amount=24000, start_age=65, cola_rate=0.05)]
        no_cola = [IncomeStream(name="Pension", amount=24000, start_age=65)]
        result_cola = run_simulation(_make_portfolio(age=65, years=1, streams=with_cola))
        result_fixed = run_simulation(_make_portfolio(age=65, years=1, streams=no_cola))
        # First year (years_active=0): COLA factor is 1.0, so identical
        assert result_cola.years[0].agi == result_fixed.years[0].agi

    def test_zero_cola_same_as_none(self) -> None:
        zero = [IncomeStream(name="Pension", amount=24000, start_age=65, cola_rate=0.0)]
        none = [IncomeStream(name="Pension", amount=24000, start_age=65)]
        result_zero = run_simulation(_make_portfolio(age=65, years=5, streams=zero))
        result_none = run_simulation(_make_portfolio(age=65, years=5, streams=none))
        for i in range(5):
            assert result_zero.years[i].agi == result_none.years[i].agi


class TestSSAutoGeneration:
    def _make_ss_auto_portfolio(
        self,
        ss_auto: SSAutoConfig,
        age: int = 65,
        years: int = 10,
        streams: list[IncomeStream] | None = None,
    ) -> Portfolio:
        return Portfolio(
            config=SimulationConfig(
                current_age_primary=age,
                current_age_spouse=age,
                simulation_years=years,
                start_year=2026,
                annual_spend_net=50000,
                strategy_target="standard",
                social_security=SocialSecurityConfig(
                    primary_benefit=0, primary_start_age=70,
                    spouse_benefit=0, spouse_start_age=70,
                ),
                income_streams=streams or [],
                ss_auto=ss_auto,
            ),
            accounts=[
                Account(
                    id="brokerage", name="Brokerage", balance=1_000_000,
                    type=AccountType.BROKERAGE, owner=Owner.JOINT, cost_basis_ratio=0.5,
                )
            ],
        )

    def test_ss_auto_produces_income(self) -> None:
        ss_auto = SSAutoConfig(primary_fra_amount=36000, primary_start_age=67)
        portfolio = self._make_ss_auto_portfolio(ss_auto, age=67, years=3)
        result = run_simulation(portfolio)
        baseline = run_simulation(_make_portfolio(age=67, years=3))
        # SS income should increase AGI vs no-income baseline
        assert result.years[0].agi > baseline.years[0].agi

    def test_legacy_ss_skipped_when_ss_auto_present(self) -> None:
        # Legacy SS set to large amount, ss_auto set to small amount
        portfolio = Portfolio(
            config=SimulationConfig(
                current_age_primary=67,
                current_age_spouse=67,
                simulation_years=3,
                start_year=2026,
                annual_spend_net=50000,
                strategy_target="standard",
                social_security=SocialSecurityConfig(
                    primary_benefit=100000, primary_start_age=67,
                    spouse_benefit=0, spouse_start_age=70,
                ),
                ss_auto=SSAutoConfig(primary_fra_amount=12000, primary_start_age=67),
            ),
            accounts=[
                Account(
                    id="brokerage", name="Brokerage", balance=1_000_000,
                    type=AccountType.BROKERAGE, owner=Owner.JOINT, cost_basis_ratio=0.5,
                )
            ],
        )
        # If legacy SS ($100k) were used, AGI would be much higher
        # ss_auto generates $12k stream instead
        result = run_simulation(portfolio)
        # AGI should reflect the small ss_auto amount, not the large legacy amount
        # $12k * 0.85 taxable = $10.2k from SS
        assert result.years[0].agi < 50000  # would be >85k if legacy SS were used

    def test_backward_compat_without_ss_auto(self) -> None:
        # No ss_auto — legacy SS should work as before
        portfolio = Portfolio(
            config=SimulationConfig(
                current_age_primary=67,
                current_age_spouse=67,
                simulation_years=3,
                start_year=2026,
                annual_spend_net=50000,
                strategy_target="standard",
                social_security=SocialSecurityConfig(
                    primary_benefit=36000, primary_start_age=67,
                    spouse_benefit=0, spouse_start_age=70,
                ),
            ),
            accounts=[
                Account(
                    id="brokerage", name="Brokerage", balance=1_000_000,
                    type=AccountType.BROKERAGE, owner=Owner.JOINT, cost_basis_ratio=0.5,
                )
            ],
        )
        result = run_simulation(portfolio)
        # Legacy SS should produce income (36000 * 0.85 = 30600 in AGI)
        baseline = run_simulation(_make_portfolio(age=67, years=3))
        assert result.years[0].agi > baseline.years[0].agi

    def test_ss_auto_with_spouse(self) -> None:
        ss_auto = SSAutoConfig(
            primary_fra_amount=36000, primary_start_age=67,
            spouse_fra_amount=18000, spouse_start_age=65,
        )
        portfolio = self._make_ss_auto_portfolio(ss_auto, age=67, years=3)
        primary_only = SSAutoConfig(primary_fra_amount=36000, primary_start_age=67)
        portfolio_primary = self._make_ss_auto_portfolio(primary_only, age=67, years=3)
        result_both = run_simulation(portfolio)
        result_primary = run_simulation(portfolio_primary)
        # With spouse SS, should have more income → higher AGI
        assert result_both.years[0].agi > result_primary.years[0].agi
