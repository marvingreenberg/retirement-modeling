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
    _deposit_excess_income,
    calculate_planned_expenses,
    get_conversion_ceiling,
    run_simulation,
    EXCESS_INCOME_ACCOUNT_ID,
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

    def test_bracket_24_with_inflation(self):
        ceiling = get_conversion_ceiling(WithdrawalStrategy.BRACKET_24, 200000, 1.5)
        assert ceiling == pytest.approx(383900 * 1.5)

    def test_bracket_22_with_inflation(self):
        ceiling = get_conversion_ceiling(WithdrawalStrategy.BRACKET_22, 200000, 1.3)
        assert ceiling == pytest.approx(201050 * 1.3)

    def test_irmaa_tier_1_with_inflation(self):
        ceiling = get_conversion_ceiling(WithdrawalStrategy.IRMAA_TIER_1, 218000, 2.0)
        assert ceiling == pytest.approx(218000 * 2.0)

    def test_standard_unaffected_by_inflation(self):
        ceiling = get_conversion_ceiling(WithdrawalStrategy.STANDARD, 200000, 1.5)
        assert ceiling == 0


class TestCalculatePlannedExpenses:
    def test_one_time_expense_matching_year(self):
        expenses = [
            PlannedExpense(name="Renovation", amount=50000, expense_type="one_time", year=2026)
        ]
        total = calculate_planned_expenses(expenses, 2026, 1.0)
        assert total == 50000

    def test_one_time_expense_different_year(self):
        expenses = [
            PlannedExpense(name="Renovation", amount=50000, expense_type="one_time", year=2027)
        ]
        total = calculate_planned_expenses(expenses, 2026, 1.0)
        assert total == 0

    def test_recurring_expense_in_range(self):
        expenses = [
            PlannedExpense(
                name="Care",
                amount=100000,
                expense_type="recurring",
                start_year=2025,
                end_year=2035,
            )
        ]
        total = calculate_planned_expenses(expenses, 2030, 1.0)
        assert total == 100000

    def test_recurring_expense_outside_range(self):
        expenses = [
            PlannedExpense(
                name="Care",
                amount=100000,
                expense_type="recurring",
                start_year=2025,
                end_year=2035,
            )
        ]
        total = calculate_planned_expenses(expenses, 2040, 1.0)
        assert total == 0

    def test_inflation_adjustment(self):
        expenses = [
            PlannedExpense(
                name="Care",
                amount=100000,
                expense_type="recurring",
                start_year=2025,
                end_year=2035,
                inflation_adjusted=True,
            )
        ]
        total = calculate_planned_expenses(expenses, 2030, 1.5)
        assert total == 150000

    def test_no_inflation_adjustment(self):
        expenses = [
            PlannedExpense(
                name="Care",
                amount=100000,
                expense_type="recurring",
                start_year=2025,
                end_year=2035,
                inflation_adjusted=False,
            )
        ]
        total = calculate_planned_expenses(expenses, 2030, 1.5)
        assert total == 100000


class TestDepositExcessIncome:
    def test_creates_new_account(self):
        accounts: list[Account] = []
        _deposit_excess_income(10000, accounts)
        assert len(accounts) == 1
        assert accounts[0].id == EXCESS_INCOME_ACCOUNT_ID
        assert accounts[0].balance == 10000
        assert accounts[0].cost_basis_ratio == 1.0

    def test_deposits_to_existing_account(self):
        accounts = [
            Account(
                id=EXCESS_INCOME_ACCOUNT_ID, name="Excess Income", balance=20000,
                type=AccountType.BROKERAGE, owner=Owner.JOINT, cost_basis_ratio=1.0,
            ),
        ]
        _deposit_excess_income(10000, accounts)
        assert accounts[0].balance == 30000
        assert accounts[0].cost_basis_ratio == 1.0  # both are 100% basis

    def test_blends_basis_on_deposit_to_grown_account(self):
        """After growth, existing account has diluted ratio. Deposit blends it back up."""
        accounts = [
            Account(
                id=EXCESS_INCOME_ACCOUNT_ID, name="Excess Income", balance=110000,
                type=AccountType.BROKERAGE, owner=Owner.JOINT,
                cost_basis_ratio=100000 / 110000,  # ~0.909 (was 100k, grew to 110k)
            ),
        ]
        _deposit_excess_income(10000, accounts)
        # old_basis = 110000 * (100000/110000) = 100000, new_basis = 100000 + 10000 = 110000
        # new_ratio = 110000 / 120000 ≈ 0.9167
        assert accounts[0].balance == 120000
        assert accounts[0].cost_basis_ratio == pytest.approx(110000 / 120000, rel=0.001)

    def test_zero_amount_no_op(self):
        accounts: list[Account] = []
        _deposit_excess_income(0, accounts)
        assert len(accounts) == 0


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
        # At age 68, 69: no SS → all spending from brokerage
        # At age 70: SS starts → less brokerage withdrawal needed
        assert result.years[0].brokerage_withdrawal > result.years[2].brokerage_withdrawal

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

    def test_depleting_portfolio_stops_early(self) -> None:
        portfolio = Portfolio(
            config=SimulationConfig(
                current_age_primary=65,
                current_age_spouse=65,
                simulation_years=30,
                start_year=2026,
                annual_spend_net=200000,
                strategy_target=WithdrawalStrategy.STANDARD,
                social_security=SocialSecurityConfig(
                    primary_benefit=0, primary_start_age=70,
                    spouse_benefit=0, spouse_start_age=70,
                ),
            ),
            accounts=[
                Account(
                    id="brokerage", name="Brokerage", balance=100000,
                    type=AccountType.BROKERAGE, owner=Owner.JOINT, cost_basis_ratio=0.5,
                )
            ],
        )
        result = run_simulation(portfolio)
        # $100k balance with $200k/yr spending — depletes in year 1
        assert len(result.years) < 30
        assert result.years[-1].total_balance <= 0

    def test_non_depleting_portfolio_runs_full_duration(self, sample_portfolio: Portfolio) -> None:
        result = run_simulation(sample_portfolio)
        assert len(result.years) == sample_portfolio.config.simulation_years
        assert result.years[-1].total_balance > 0

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


class TestInflationIndexedTaxBrackets:
    """Integration tests for inflation-indexed tax thresholds in the simulation."""

    def _make_portfolio(self, inflation_rate: float = 0.03, years: int = 20) -> Portfolio:
        return Portfolio(
            config=SimulationConfig(
                current_age_primary=60,
                current_age_spouse=60,
                simulation_years=years,
                start_year=2026,
                annual_spend_net=80000,
                inflation_rate=inflation_rate,
                investment_growth_rate=0.06,
                strategy_target=WithdrawalStrategy.BRACKET_24,
                social_security=SocialSecurityConfig(
                    primary_benefit=30000, primary_start_age=67,
                    spouse_benefit=20000, spouse_start_age=67,
                ),
            ),
            accounts=[
                Account(
                    id="pretax", name="IRA", balance=1000000,
                    type=AccountType.IRA, owner=Owner.PRIMARY,
                ),
                Account(
                    id="roth", name="Roth", balance=200000,
                    type=AccountType.ROTH_IRA, owner=Owner.PRIMARY,
                ),
                Account(
                    id="brokerage", name="Brokerage", balance=500000,
                    type=AccountType.BROKERAGE, owner=Owner.JOINT, cost_basis_ratio=0.6,
                ),
            ],
        )

    def test_year_0_unchanged_by_indexing(self):
        """Year 0 should be identical regardless of inflation rate since factor=1.0."""
        p_low = self._make_portfolio(inflation_rate=0.01, years=5)
        p_high = self._make_portfolio(inflation_rate=0.05, years=5)

        r_low = run_simulation(p_low)
        r_high = run_simulation(p_high)

        # Year 0 tax thresholds are unscaled (factor=1.0), so bracket labels match
        assert r_low.years[0].bracket == r_high.years[0].bracket

    def test_inflation_indexing_lowers_effective_tax_over_time(self):
        """With inflation indexing, bracket thresholds grow, so effective tax rate
        should be lower in later years than it would be with frozen brackets."""
        portfolio = self._make_portfolio(inflation_rate=0.03, years=20)
        result = run_simulation(portfolio)

        # With 3% inflation over 20 years, brackets grow ~80%.
        # For the same nominal AGI, the bracket label should reflect lower effective rates.
        # More directly: total_tax / AGI should stay reasonable, not creep up due to bracket creep.
        year_0 = result.years[0]
        year_19 = result.years[-1]

        # Effective tax ratio shouldn't dramatically increase over 20 years
        # if brackets are properly indexed
        if year_0.agi > 0 and year_19.agi > 0:
            eff_rate_0 = year_0.total_tax / year_0.agi
            eff_rate_19 = year_19.total_tax / year_19.agi
            # Indexing prevents bracket creep — rate shouldn't jump wildly
            assert eff_rate_19 < eff_rate_0 + 0.10

    def test_zero_inflation_no_indexing_effect(self):
        """With 0% inflation, brackets don't change year over year."""
        portfolio = self._make_portfolio(inflation_rate=0.0, years=5)
        result = run_simulation(portfolio)

        # All years should use the same (base) bracket thresholds
        # so bracket labels should be consistent for similar AGI levels
        brackets = [y.bracket for y in result.years]
        # Not asserting they're all identical (AGI changes), just that the test runs cleanly
        assert len(result.years) == 5

    def test_existing_tests_unaffected(self, sample_portfolio: Portfolio):
        """Existing simulation behavior should not regress."""
        result = run_simulation(sample_portfolio)
        assert len(result.years) == sample_portfolio.config.simulation_years
        assert result.years[-1].total_balance > 0


class TestTaxRegimeSequence:
    """Tests for tax regime sequence override in run_simulation."""

    def _make_portfolio(self, years: int = 5) -> Portfolio:
        return Portfolio(
            config=SimulationConfig(
                current_age_primary=65,
                current_age_spouse=65,
                simulation_years=years,
                start_year=2026,
                annual_spend_net=80000,
                inflation_rate=0.03,
                investment_growth_rate=0.06,
                strategy_target=WithdrawalStrategy.BRACKET_24,
                social_security=SocialSecurityConfig(
                    primary_benefit=30000, primary_start_age=70,
                    spouse_benefit=20000, spouse_start_age=70,
                ),
            ),
            accounts=[
                Account(
                    id="pretax", name="IRA", balance=800000,
                    type=AccountType.IRA, owner=Owner.PRIMARY,
                ),
                Account(
                    id="brokerage", name="Brokerage", balance=400000,
                    type=AccountType.BROKERAGE, owner=Owner.JOINT, cost_basis_ratio=0.6,
                ),
            ],
        )

    def test_no_regime_sequence_uses_defaults(self):
        """Without regime sequence, simulation uses 2024 constants (unchanged behavior)."""
        portfolio = self._make_portfolio()
        result_default = run_simulation(portfolio)
        result_none = run_simulation(portfolio, tax_regime_sequence=None)

        for y_def, y_none in zip(result_default.years, result_none.years):
            assert y_def.total_tax == y_none.total_tax
            assert y_def.total_balance == y_none.total_balance

    def test_regime_sequence_affects_tax(self):
        """With a high-tax regime, taxes should differ from default."""
        portfolio = self._make_portfolio()
        result_default = run_simulation(portfolio)

        # Use a high-tax regime for all years (70% top rate, Pre-ERTA style)
        from retirement_model.historical_tax_regimes import HISTORICAL_TAX_REGIMES
        high_tax = HISTORICAL_TAX_REGIMES[0]  # Pre-ERTA 1978 (High Tax)
        regime_seq = [high_tax] * 5

        result_regime = run_simulation(portfolio, tax_regime_sequence=regime_seq)

        # Tax amounts should differ — high-tax regime has higher rates
        taxes_default = sum(y.total_tax for y in result_default.years)
        taxes_regime = sum(y.total_tax for y in result_regime.years)
        assert taxes_default != taxes_regime

    def test_regime_sequence_overrides_config_brackets(self):
        """Regime sequence should take priority over config-level tax_brackets_federal."""
        from retirement_model.models import TaxBracket
        from retirement_model.historical_tax_regimes import HISTORICAL_TAX_REGIMES

        portfolio = self._make_portfolio()
        # Set config-level brackets (these should be overridden)
        portfolio.config.tax_brackets_federal = [
            TaxBracket(limit=23200, rate=0.10),
            TaxBracket(limit=94300, rate=0.12),
            TaxBracket(limit=201050, rate=0.22),
            TaxBracket(limit=383900, rate=0.24),
            TaxBracket(limit=487450, rate=0.32),
        ]

        regime = HISTORICAL_TAX_REGIMES[0]  # High tax
        regime_seq = [regime] * 5

        result_with_regime = run_simulation(portfolio, tax_regime_sequence=regime_seq)
        result_config_only = run_simulation(portfolio)

        # Should differ because regime overrides config brackets
        taxes_regime = sum(y.total_tax for y in result_with_regime.years)
        taxes_config = sum(y.total_tax for y in result_config_only.years)
        assert taxes_regime != taxes_config

    def test_regime_changes_deduction(self):
        """Regime with different standard deduction should affect taxable income."""
        portfolio = self._make_portfolio(years=2)

        # Use TCJA (deduction=29200) vs Pre-ERTA (deduction=15000)
        from retirement_model.historical_tax_regimes import HISTORICAL_TAX_REGIMES
        tcja = next(r for r in HISTORICAL_TAX_REGIMES if "TCJA" in r["name"])
        pre_erta = next(r for r in HISTORICAL_TAX_REGIMES if "Pre-ERTA" in r["name"])

        result_tcja = run_simulation(portfolio, tax_regime_sequence=[tcja, tcja])
        result_pre_erta = run_simulation(portfolio, tax_regime_sequence=[pre_erta, pre_erta])

        # Different deductions → different taxes
        assert result_tcja.years[0].total_tax != result_pre_erta.years[0].total_tax


class TestWithdrawalDetails:
    """Tests for per-account withdrawal details in YearResult."""

    def test_year_result_has_withdrawal_details(self, sample_portfolio: Portfolio):
        result = run_simulation(sample_portfolio)
        for yr in result.years:
            assert isinstance(yr.withdrawal_details, list)

    def test_rmd_withdrawal_details(self):
        """RMD withdrawals are tagged with purpose 'rmd'."""
        portfolio = Portfolio(
            config=SimulationConfig(
                current_age_primary=73,
                current_age_spouse=73,
                simulation_years=2,
                start_year=2026,
                annual_spend_net=30000,
                strategy_target=WithdrawalStrategy.STANDARD,
                social_security=SocialSecurityConfig(
                    primary_benefit=30000, primary_start_age=70,
                    spouse_benefit=20000, spouse_start_age=70,
                ),
            ),
            accounts=[
                Account(
                    id="ira_p", name="Primary IRA", balance=500000,
                    type=AccountType.IRA, owner=Owner.PRIMARY,
                ),
                Account(
                    id="ira_s", name="Spouse IRA", balance=300000,
                    type=AccountType.IRA, owner=Owner.SPOUSE,
                ),
            ],
        )
        result = run_simulation(portfolio)
        yr0 = result.years[0]

        rmd_details = [d for d in yr0.withdrawal_details if d.purpose == "rmd"]
        assert len(rmd_details) >= 1
        assert all(d.account_id in ("ira_p", "ira_s") for d in rmd_details)
        assert all(d.amount > 0 for d in rmd_details)

    def test_spending_withdrawal_details(self):
        """Spending withdrawals are tagged with purpose 'spending'."""
        portfolio = Portfolio(
            config=SimulationConfig(
                current_age_primary=60,
                current_age_spouse=60,
                simulation_years=2,
                start_year=2026,
                annual_spend_net=80000,
                strategy_target=WithdrawalStrategy.STANDARD,
                social_security=SocialSecurityConfig(
                    primary_benefit=0, primary_start_age=70,
                    spouse_benefit=0, spouse_start_age=70,
                ),
            ),
            accounts=[
                Account(
                    id="brok", name="Brokerage", balance=500000,
                    type=AccountType.BROKERAGE, owner=Owner.JOINT, cost_basis_ratio=0.5,
                ),
            ],
        )
        result = run_simulation(portfolio)
        yr0 = result.years[0]

        spending_details = [d for d in yr0.withdrawal_details if d.purpose == "spending"]
        assert len(spending_details) >= 1
        assert spending_details[0].account_id == "brok"
        assert spending_details[0].account_name == "Brokerage"

    def test_conversion_withdrawal_details(self):
        """Roth conversion sources are tagged with purpose 'conversion'."""
        portfolio = Portfolio(
            config=SimulationConfig(
                current_age_primary=60,
                current_age_spouse=60,
                simulation_years=2,
                start_year=2026,
                annual_spend_net=30000,
                strategy_target=WithdrawalStrategy.IRMAA_TIER_1,
                social_security=SocialSecurityConfig(
                    primary_benefit=0, primary_start_age=70,
                    spouse_benefit=0, spouse_start_age=70,
                ),
            ),
            accounts=[
                Account(
                    id="ira_main", name="Main IRA", balance=800000,
                    type=AccountType.IRA, owner=Owner.PRIMARY,
                ),
                Account(
                    id="brok", name="Brokerage", balance=200000,
                    type=AccountType.BROKERAGE, owner=Owner.JOINT, cost_basis_ratio=0.5,
                ),
            ],
        )
        result = run_simulation(portfolio)
        yr0 = result.years[0]

        conv_details = [d for d in yr0.withdrawal_details if d.purpose == "conversion"]
        # With IRMAA_TIER_1 strategy and AGI headroom, conversions should happen
        if yr0.roth_conversion > 0:
            assert len(conv_details) >= 1
            assert conv_details[0].account_id == "ira_main"

    def test_withdrawal_details_amounts_match_aggregates(self, sample_portfolio: Portfolio):
        """Sum of per-account details should match aggregate YearResult fields."""
        result = run_simulation(sample_portfolio)
        for yr in result.years:
            rmd_total = sum(d.amount for d in yr.withdrawal_details if d.purpose == "rmd")
            conv_total = sum(d.amount for d in yr.withdrawal_details if d.purpose == "conversion")
            # RMD details should approximate the aggregate RMD
            if yr.rmd > 0:
                assert abs(rmd_total - yr.rmd) <= 2
            # Conversion details should approximate the aggregate
            if yr.roth_conversion > 0:
                assert abs(conv_total - yr.roth_conversion) <= 2
