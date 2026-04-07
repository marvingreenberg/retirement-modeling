"""FE/BE boundary tests: verify that UI input changes produce different API responses.

Tests that different parameter values sent to /simulate and /monte-carlo produce
meaningfully different results, confirming the full request pipeline works end-to-end.
"""

import copy

import pytest
from fastapi.testclient import TestClient

from retirement_model.api import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def base_portfolio() -> dict:
    """Baseline portfolio used for comparative tests."""
    return {
        "config": {
            "current_age_primary": 65,
            "current_age_spouse": 62,
            "simulation_years": 30,
            "start_year": 2026,
            "annual_spend_net": 100000,
            "inflation_rate": 0.03,
            "strategy_target": "irmaa_tier_1",
            "spending_strategy": "fixed_dollar",
            "withdrawal_rate": 0.04,
            "tax_rate_state": 0.05,
            "irmaa_limit_tier_1": 206000,
            "rmd_start_age": 73,
            "social_security": {
                "primary_benefit": 36000,
                "primary_start_age": 70,
                "spouse_benefit": 18000,
                "spouse_start_age": 67,
            },
        },
        "accounts": [
            {
                "id": "pretax",
                "name": "401k",
                "balance": 1000000,
                "type": "ira",
                "owner": "primary",
            },
            {
                "id": "roth",
                "name": "Roth IRA",
                "balance": 200000,
                "type": "roth_ira",
                "owner": "primary",
            },
            {
                "id": "brokerage",
                "name": "Brokerage",
                "balance": 500000,
                "type": "brokerage",
                "owner": "joint",
                "cost_basis_ratio": 0.6,
            },
        ],
    }


def _simulate(client: TestClient, portfolio: dict) -> dict:
    resp = client.post("/api/v1/simulate", json={"portfolio": portfolio})
    assert resp.status_code == 200, f"Simulate failed: {resp.text}"
    return resp.json()


def _monte_carlo(client: TestClient, portfolio: dict, seed: int = 42, n: int = 50) -> dict:
    resp = client.post(
        "/api/v1/monte-carlo",
        json={"portfolio": portfolio, "num_simulations": n, "seed": seed},
    )
    assert resp.status_code == 200, f"Monte Carlo failed: {resp.text}"
    return resp.json()


def _set_config(portfolio: dict, key: str, value) -> dict:
    p = copy.deepcopy(portfolio)
    p["config"][key] = value
    return p


class TestSpendingChangesAffectSimulation:
    """Changing spending parameters should produce different simulation results."""

    def test_different_annual_spend(self, client, base_portfolio):
        low = _simulate(client, _set_config(base_portfolio, "annual_spend_net", 60000))
        high = _simulate(client, _set_config(base_portfolio, "annual_spend_net", 140000))
        assert low["summary"]["final_balance"] > high["summary"]["final_balance"]

    def test_spending_strategy_fixed_vs_percent(self, client, base_portfolio):
        fixed = _set_config(base_portfolio, "spending_strategy", "fixed_dollar")
        pct = _set_config(base_portfolio, "spending_strategy", "percent_of_portfolio")
        r_fixed = _simulate(client, fixed)
        r_pct = _simulate(client, pct)
        assert r_fixed["summary"]["spending_strategy"] == "fixed_dollar"
        assert r_pct["summary"]["spending_strategy"] == "percent_of_portfolio"
        assert (
            r_fixed["summary"]["initial_annual_spend"] != r_pct["summary"]["initial_annual_spend"]
        )

    def test_spending_strategy_guardrails(self, client, base_portfolio):
        base = _simulate(client, base_portfolio)
        gw = _set_config(base_portfolio, "spending_strategy", "guardrails")
        gw["config"]["guardrails_config"] = {
            "initial_withdrawal_rate": 0.05,
            "floor_percent": 0.80,
            "ceiling_percent": 1.20,
            "adjustment_percent": 0.10,
        }
        guardrails = _simulate(client, gw)
        assert guardrails["summary"]["spending_strategy"] == "guardrails"
        assert base["summary"]["final_balance"] != guardrails["summary"]["final_balance"]

    def test_withdrawal_rate_changes_percent_strategy(self, client, base_portfolio):
        low = copy.deepcopy(base_portfolio)
        low["config"]["spending_strategy"] = "percent_of_portfolio"
        low["config"]["withdrawal_rate"] = 0.03
        high = copy.deepcopy(base_portfolio)
        high["config"]["spending_strategy"] = "percent_of_portfolio"
        high["config"]["withdrawal_rate"] = 0.06
        r_low = _simulate(client, low)
        r_high = _simulate(client, high)
        assert r_low["summary"]["final_balance"] > r_high["summary"]["final_balance"]


class TestGrowthAndInflationAffectSimulation:
    """Growth rate and inflation rate changes should produce different outcomes."""

    def test_conservative_growth_means_lower_balance(self, client, base_portfolio):
        normal = _simulate(client, _set_config(base_portfolio, "conservative_growth", False))
        conservative = _simulate(client, _set_config(base_portfolio, "conservative_growth", True))
        assert normal["summary"]["final_balance"] > conservative["summary"]["final_balance"]

    def test_higher_inflation_means_lower_balance(self, client, base_portfolio):
        low_inf = _simulate(client, _set_config(base_portfolio, "inflation_rate", 0.01))
        high_inf = _simulate(client, _set_config(base_portfolio, "inflation_rate", 0.06))
        assert low_inf["summary"]["final_balance"] > high_inf["summary"]["final_balance"]

    def test_all_stocks_vs_all_bonds(self, client, base_portfolio):
        stocks = copy.deepcopy(base_portfolio)
        for acc in stocks["accounts"]:
            acc["stock_pct"] = 100
        bonds = copy.deepcopy(base_portfolio)
        for acc in bonds["accounts"]:
            acc["stock_pct"] = 0
        r_stocks = _simulate(client, stocks)
        r_bonds = _simulate(client, bonds)
        assert r_stocks["summary"]["final_balance"] > r_bonds["summary"]["final_balance"]


class TestConversionStrategyAffectsTaxes:
    """Different Roth conversion strategies should produce different tax outcomes."""

    def test_standard_vs_bracket_22(self, client, base_portfolio):
        std = _set_config(base_portfolio, "strategy_target", "standard")
        b22 = _set_config(base_portfolio, "strategy_target", "22_percent_bracket")
        r_std = _simulate(client, std)
        r_b22 = _simulate(client, b22)
        assert (
            r_std["summary"]["total_roth_conversions"] < r_b22["summary"]["total_roth_conversions"]
        )

    def test_bracket_22_vs_bracket_24(self, client, base_portfolio):
        b22 = _set_config(base_portfolio, "strategy_target", "22_percent_bracket")
        b24 = _set_config(base_portfolio, "strategy_target", "24_percent_bracket")
        r_22 = _simulate(client, b22)
        r_24 = _simulate(client, b24)
        # Both strategies convert, but different amounts due to different ceilings
        assert r_22["summary"]["total_roth_conversions"] > 0
        assert r_24["summary"]["total_roth_conversions"] > 0
        assert (
            r_22["summary"]["total_roth_conversions"] != r_24["summary"]["total_roth_conversions"]
        )

    def test_standard_no_conversions(self, client, base_portfolio):
        std = _simulate(client, _set_config(base_portfolio, "strategy_target", "standard"))
        assert std["summary"]["total_roth_conversions"] == 0


class TestAccountBalancesAffectResults:
    """Different account balances should produce different simulation outcomes."""

    def test_higher_balance_lasts_longer(self, client, base_portfolio):
        small = copy.deepcopy(base_portfolio)
        for acc in small["accounts"]:
            acc["balance"] = acc["balance"] * 0.3
        large = copy.deepcopy(base_portfolio)
        for acc in large["accounts"]:
            acc["balance"] = acc["balance"] * 3
        r_small = _simulate(client, small)
        r_large = _simulate(client, large)
        assert r_large["summary"]["final_balance"] > r_small["summary"]["final_balance"]

    def test_different_account_type_mix(self, client, base_portfolio):
        # All pretax
        pretax_heavy = copy.deepcopy(base_portfolio)
        pretax_heavy["accounts"] = [
            {"id": "p1", "name": "IRA", "balance": 1700000, "type": "ira", "owner": "primary"}
        ]
        # All roth
        roth_heavy = copy.deepcopy(base_portfolio)
        roth_heavy["accounts"] = [
            {"id": "r1", "name": "Roth", "balance": 1700000, "type": "roth_ira", "owner": "primary"}
        ]
        r_pretax = _simulate(client, pretax_heavy)
        r_roth = _simulate(client, roth_heavy)
        # Roth withdrawals are tax-free, so less total tax
        assert r_roth["summary"]["total_taxes_paid"] < r_pretax["summary"]["total_taxes_paid"]


class TestSocialSecurityAffectsResults:
    """Social Security configuration changes should produce different outcomes."""

    def test_higher_ss_benefit(self, client, base_portfolio):
        low_ss = copy.deepcopy(base_portfolio)
        low_ss["config"]["annual_spend_net"] = 60000
        low_ss["config"]["social_security"]["primary_benefit"] = 20000
        high_ss = copy.deepcopy(base_portfolio)
        high_ss["config"]["annual_spend_net"] = 60000
        high_ss["config"]["social_security"]["primary_benefit"] = 48000
        r_low = _simulate(client, low_ss)
        r_high = _simulate(client, high_ss)
        assert r_high["summary"]["final_balance"] > r_low["summary"]["final_balance"]

    def test_earlier_ss_start_age(self, client, base_portfolio):
        early = copy.deepcopy(base_portfolio)
        early["config"]["annual_spend_net"] = 60000
        early["config"]["social_security"]["primary_start_age"] = 62
        late = copy.deepcopy(base_portfolio)
        late["config"]["annual_spend_net"] = 60000
        late["config"]["social_security"]["primary_start_age"] = 70
        r_early = _simulate(client, early)
        r_late = _simulate(client, late)
        # Earlier start means more years of income (though lower per-year in real SS)
        # With fixed benefits, earlier is better for the portfolio
        assert r_early["summary"]["final_balance"] != r_late["summary"]["final_balance"]

    def test_ss_auto_overrides_legacy(self, client, base_portfolio):
        with_auto = copy.deepcopy(base_portfolio)
        with_auto["config"]["ss_auto"] = {
            "primary_fra_amount": 36000,
            "primary_start_age": 67,
            "spouse_fra_amount": 18000,
            "spouse_start_age": 65,
        }
        r_legacy = _simulate(client, base_portfolio)
        r_auto = _simulate(client, with_auto)
        # ss_auto generates adjusted benefits; taxes differ from legacy fixed amounts
        assert r_legacy["summary"]["total_taxes_paid"] != r_auto["summary"]["total_taxes_paid"]


class TestIncomeStreamsAffectResults:
    """Adding income streams should change simulation outcomes."""

    def test_pension_improves_balance(self, client, base_portfolio):
        no_pension = _simulate(client, base_portfolio)
        with_pension = copy.deepcopy(base_portfolio)
        with_pension["config"]["income_streams"] = [
            {"name": "Pension", "amount": 30000, "start_age": 65}
        ]
        r_pension = _simulate(client, with_pension)
        assert r_pension["summary"]["final_balance"] > no_pension["summary"]["final_balance"]

    def test_cola_rate_matters(self, client, base_portfolio):
        no_cola = copy.deepcopy(base_portfolio)
        no_cola["config"]["income_streams"] = [
            {"name": "Pension", "amount": 24000, "start_age": 65, "cola_rate": 0.0}
        ]
        with_cola = copy.deepcopy(base_portfolio)
        with_cola["config"]["income_streams"] = [
            {"name": "Pension", "amount": 24000, "start_age": 65, "cola_rate": 0.05}
        ]
        r_no = _simulate(client, no_cola)
        r_cola = _simulate(client, with_cola)
        # COLA changes results; direction depends on withdrawal order / tax interactions
        assert r_cola["summary"]["final_balance"] != r_no["summary"]["final_balance"]


class TestPlannedExpensesAffectResults:
    """Planned expenses should reduce the portfolio balance."""

    def test_one_time_expense(self, client, base_portfolio):
        # Lower spending so portfolio doesn't deplete in both cases
        base_portfolio["config"]["annual_spend_net"] = 60000
        base_result = _simulate(client, base_portfolio)
        with_expense = copy.deepcopy(base_portfolio)
        with_expense["config"]["planned_expenses"] = [
            {"name": "New Roof", "amount": 50000, "expense_type": "one_time", "year": 2030}
        ]
        r_expense = _simulate(client, with_expense)
        assert r_expense["summary"]["final_balance"] < base_result["summary"]["final_balance"]

    def test_recurring_expense(self, client, base_portfolio):
        base_portfolio["config"]["annual_spend_net"] = 60000
        base_result = _simulate(client, base_portfolio)
        with_recurring = copy.deepcopy(base_portfolio)
        with_recurring["config"]["planned_expenses"] = [
            {
                "name": "Travel",
                "amount": 15000,
                "expense_type": "recurring",
                "start_year": 2027,
                "end_year": 2042,
            }
        ]
        r_recurring = _simulate(client, with_recurring)
        assert r_recurring["summary"]["final_balance"] < base_result["summary"]["final_balance"]


class TestMonteCarloInputSensitivity:
    """MC results should change when inputs change, with seed for reproducibility."""

    def test_same_inputs_same_seed_same_results(self, client, base_portfolio):
        r1 = _monte_carlo(client, base_portfolio, seed=42)
        r2 = _monte_carlo(client, base_portfolio, seed=42)
        assert r1["success_rate"] == r2["success_rate"]
        assert r1["final_balance_p5"] == r2["final_balance_p5"]

    def test_different_seed_different_results(self, client, base_portfolio):
        r1 = _monte_carlo(client, base_portfolio, seed=42)
        r2 = _monte_carlo(client, base_portfolio, seed=999)
        # Results may occasionally be the same but with different seeds it's very unlikely
        assert r1["final_balance_p95"] != r2["final_balance_p95"]

    def test_higher_spend_lower_success_rate(self, client, base_portfolio):
        low_spend = _set_config(base_portfolio, "annual_spend_net", 60000)
        high_spend = _set_config(base_portfolio, "annual_spend_net", 160000)
        r_low = _monte_carlo(client, low_spend, seed=42)
        r_high = _monte_carlo(client, high_spend, seed=42)
        assert r_low["success_rate"] >= r_high["success_rate"]

    def test_larger_portfolio_higher_success(self, client, base_portfolio):
        small = copy.deepcopy(base_portfolio)
        for acc in small["accounts"]:
            acc["balance"] = acc["balance"] * 0.3
        r_small = _monte_carlo(client, small, seed=42)
        r_base = _monte_carlo(client, base_portfolio, seed=42)
        assert r_base["success_rate"] >= r_small["success_rate"]

    def test_spending_strategy_changes_mc(self, client, base_portfolio):
        fixed = copy.deepcopy(base_portfolio)
        pct = copy.deepcopy(base_portfolio)
        pct["config"]["spending_strategy"] = "percent_of_portfolio"
        pct["config"]["withdrawal_rate"] = 0.04
        r_fixed = _monte_carlo(client, fixed, seed=42)
        r_pct = _monte_carlo(client, pct, seed=42)
        # Different strategies produce different MC distributions
        assert r_fixed["final_balance_p5"] != r_pct["final_balance_p5"]

    def test_vary_tax_regimes_changes_mc(self, client, base_portfolio):
        """vary_tax_regimes=True should produce a different distribution shape than False."""
        without = copy.deepcopy(base_portfolio)
        without["config"]["vary_tax_regimes"] = False
        with_vary = copy.deepcopy(base_portfolio)
        with_vary["config"]["vary_tax_regimes"] = True
        r_without = _monte_carlo(client, without, seed=42)
        r_with = _monte_carlo(client, with_vary, seed=42)
        # Each run should produce a non-degenerate distribution (p95 > p5).
        assert r_without["final_balance_p95"] > r_without["final_balance_p5"]
        assert r_with["final_balance_p95"] > r_with["final_balance_p5"]
        # Regime variation must actually change the distribution. Identical p5/p95
        # would indicate vary_tax_regimes had no effect.
        assert (
            r_without["final_balance_p5"] != r_with["final_balance_p5"]
            or r_without["final_balance_p95"] != r_with["final_balance_p95"]
        )


class TestYearByYearResponseStructure:
    """Verify simulation results include proper year-by-year data."""

    def test_years_match_simulation_years(self, client, base_portfolio):
        result = _simulate(client, base_portfolio)
        years = result["result"]["years"]
        assert len(years) > 0
        assert len(years) <= 30

    def test_year_fields_present(self, client, base_portfolio):
        result = _simulate(client, base_portfolio)
        year = result["result"]["years"][0]
        required_fields = [
            "year",
            "age_primary",
            "age_spouse",
            "agi",
            "bracket",
            "rmd",
            "surplus",
            "roth_conversion",
            "conversion_tax",
            "pretax_withdrawal",
            "roth_withdrawal",
            "brokerage_withdrawal",
            "total_tax",
            "irmaa_cost",
            "total_balance",
            "spending_target",
            "pretax_balance",
            "roth_balance",
            "brokerage_balance",
        ]
        for field in required_fields:
            assert field in year, f"Missing field: {field}"

    def test_ages_increment(self, client, base_portfolio):
        result = _simulate(client, base_portfolio)
        years = result["result"]["years"]
        for i in range(1, len(years)):
            assert years[i]["age_primary"] == years[i - 1]["age_primary"] + 1

    def test_mc_yearly_percentiles_present(self, client, base_portfolio):
        result = _monte_carlo(client, base_portfolio, seed=42)
        assert "yearly_percentiles" in result
        assert len(result["yearly_percentiles"]) > 0
        yp = result["yearly_percentiles"][0]
        assert "age" in yp
        assert "balance_p5" in yp
        assert "balance_median" in yp
        assert "balance_p95" in yp
        assert "spending_p5" in yp
        assert "spending_median" in yp
        assert "spending_p95" in yp


class TestRequestOverrides:
    """Verify request-level overrides (strategy, spending_strategy, withdrawal_rate) work."""

    def test_request_strategy_overrides_config(self, client, base_portfolio):
        base_portfolio["config"]["strategy_target"] = "standard"
        result = _simulate(client, base_portfolio)
        assert result["summary"]["strategy"] == "standard"

        # Override via request
        resp = client.post(
            "/api/v1/simulate",
            json={"portfolio": base_portfolio, "strategy": "24_percent_bracket"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["summary"]["strategy"] == "24_percent_bracket"
        assert data["summary"]["total_roth_conversions"] > 0

    def test_request_spending_strategy_override(self, client, base_portfolio):
        resp = client.post(
            "/api/v1/simulate",
            json={"portfolio": base_portfolio, "spending_strategy": "percent_of_portfolio"},
        )
        assert resp.status_code == 200
        assert resp.json()["summary"]["spending_strategy"] == "percent_of_portfolio"

    def test_request_withdrawal_rate_override(self, client, base_portfolio):
        r_low = client.post(
            "/api/v1/simulate",
            json={
                "portfolio": base_portfolio,
                "spending_strategy": "percent_of_portfolio",
                "withdrawal_rate": 0.03,
            },
        ).json()
        r_high = client.post(
            "/api/v1/simulate",
            json={
                "portfolio": base_portfolio,
                "spending_strategy": "percent_of_portfolio",
                "withdrawal_rate": 0.08,
            },
        ).json()
        assert r_low["summary"]["final_balance"] > r_high["summary"]["final_balance"]


class TestEdgeCaseInputs:
    """Edge cases that might break the FE/BE pipeline."""

    def test_single_account(self, client, base_portfolio):
        base_portfolio["accounts"] = [base_portfolio["accounts"][0]]
        result = _simulate(client, base_portfolio)
        assert result["summary"]["final_balance"] >= 0

    def test_zero_ss_benefits(self, client, base_portfolio):
        base_portfolio["config"]["social_security"]["primary_benefit"] = 0
        base_portfolio["config"]["social_security"]["spouse_benefit"] = 0
        result = _simulate(client, base_portfolio)
        assert result["summary"]["simulation_years"] > 0

    def test_no_spouse(self, client, base_portfolio):
        base_portfolio["config"]["current_age_spouse"] = 0
        base_portfolio["config"]["social_security"]["spouse_benefit"] = 0
        base_portfolio["config"]["social_security"]["spouse_start_age"] = 62
        result = _simulate(client, base_portfolio)
        assert result["summary"]["simulation_years"] > 0

    def test_short_simulation(self, client, base_portfolio):
        base_portfolio["config"]["simulation_years"] = 1
        result = _simulate(client, base_portfolio)
        assert result["summary"]["simulation_years"] == 1

    def test_invalid_portfolio_returns_error(self, client):
        resp = client.post("/api/v1/simulate", json={"portfolio": {"config": {}, "accounts": []}})
        assert resp.status_code == 422


class TestWithdrawalDetailsSumBalance:
    """Withdrawal details (sources) should roughly balance with uses."""

    def test_sources_approximate_uses(self, client, base_portfolio):
        """Cash sources ~ cash uses each year.

        Sources: income + rmd + pretax/roth/brokerage withdrawals.
        Uses: spending + total_tax + irmaa + 401k deposits + surplus + conversion_tax.
        """
        base_portfolio["config"]["annual_spend_net"] = 60000
        result = _simulate(client, base_portfolio)
        for yr in result["result"]["years"]:
            if yr["total_balance"] <= 0:
                break
            total_sources = (
                yr["total_income"]
                + yr["rmd"]
                + yr["pretax_withdrawal"]
                + yr["roth_withdrawal"]
                + yr["brokerage_withdrawal"]
            )
            total_uses = (
                yr["spending_target"]
                + yr["total_tax"]
                + yr["irmaa_cost"]
                + yr.get("pretax_401k_deposit", 0)
                + yr.get("roth_401k_deposit", 0)
                + yr["surplus"]
                + yr.get("conversion_tax", 0)
            )
            gap = abs(total_sources - total_uses)
            assert (
                gap < 2
            ), f"Year {yr['year']}: sources={total_sources}, uses={total_uses}, gap={gap}"

    def test_tax_purpose_withdrawals_exist_when_taxes_positive(self, client, base_portfolio):
        """Years with positive taxes should have 'tax' purpose withdrawal entries."""
        result = _simulate(client, base_portfolio)

        def total_tax_amount(yr) -> float:
            return yr["total_tax"] + yr.get("conversion_tax", 0)

        years_with_tax = [yr for yr in result["result"]["years"] if total_tax_amount(yr) > 1000]
        assert len(years_with_tax) > 0, "Expected some years with significant taxes"
        years_with_tax_details = [
            yr
            for yr in years_with_tax
            if any(d["purpose"] == "tax" for d in yr.get("withdrawal_details", []))
        ]
        assert (
            len(years_with_tax_details) > 0
        ), "Expected tax-purpose withdrawals in years with significant taxes"
