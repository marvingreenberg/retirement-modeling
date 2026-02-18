"""Tests for REST API layer."""

import pytest
from fastapi.testclient import TestClient

from retirement_model.api import app
from retirement_model.models import ConversionStrategy, SpendingStrategy


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def sample_portfolio() -> dict:
    return {
        "config": {
            "current_age_primary": 65,
            "current_age_spouse": 62,
            "simulation_years": 30,
            "start_year": 2026,
            "annual_spend_net": 100000,
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


class TestRootEndpoint:
    def test_root_returns_health_info_without_static(self, client: TestClient):
        """Root returns health JSON when no static dir (default test environment)."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["api"] == "/api/v1/"
        assert data["version"] == "0.11.0"


class TestApiDiscovery:
    def test_api_v1_root(self, client: TestClient):
        response = client.get("/api/v1/")
        assert response.status_code == 200
        data = response.json()
        assert data["version"] == "0.11.0"
        assert "endpoints" in data
        assert data["endpoints"]["simulate"] == "/api/v1/simulate"


class TestStrategiesEndpoint:
    def test_list_strategies(self, client: TestClient):
        response = client.get("/api/v1/strategies")
        assert response.status_code == 200
        data = response.json()
        assert "conversion_strategies" in data
        assert "spending_strategies" in data
        assert len(data["conversion_strategies"]) == len(ConversionStrategy)
        assert len(data["spending_strategies"]) == len(SpendingStrategy)

    def test_spending_strategies_include_field_usage(self, client: TestClient):
        response = client.get("/api/v1/strategies")
        data = response.json()
        for entry in data["spending_strategies"]:
            assert "uses_fields" in entry, f"{entry['value']} missing uses_fields"
            assert "ignores_fields" in entry, f"{entry['value']} missing ignores_fields"

        by_value = {e["value"]: e for e in data["spending_strategies"]}
        assert by_value["fixed_dollar"]["uses_fields"] == ["annual_spend_net"]
        assert by_value["percent_of_portfolio"]["uses_fields"] == ["withdrawal_rate"]
        assert by_value["guardrails"]["uses_fields"] == ["guardrails_config"]
        assert by_value["rmd_based"]["uses_fields"] == []


class TestSimulateEndpoint:
    def test_simulate_basic(self, client: TestClient, sample_portfolio: dict):
        response = client.post("/api/v1/simulate", json={"portfolio": sample_portfolio})
        assert response.status_code == 200
        data = response.json()
        assert "result" in data
        assert "summary" in data
        assert "final_balance" in data["summary"]
        assert data["summary"]["simulation_years"] <= 30

    def test_simulate_with_strategy_override(self, client: TestClient, sample_portfolio: dict):
        response = client.post(
            "/api/v1/simulate",
            json={
                "portfolio": sample_portfolio,
                "strategy": "24_percent_bracket",
                "spending_strategy": "guardrails",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["summary"]["strategy"] == "24_percent_bracket"
        assert data["summary"]["spending_strategy"] == "guardrails"

    def test_simulate_with_withdrawal_rate(self, client: TestClient, sample_portfolio: dict):
        response = client.post(
            "/api/v1/simulate",
            json={
                "portfolio": sample_portfolio,
                "spending_strategy": "percent_of_portfolio",
                "withdrawal_rate": 0.04,
            },
        )
        assert response.status_code == 200

    def test_summary_includes_initial_spending(self, client: TestClient, sample_portfolio: dict):
        response = client.post("/api/v1/simulate", json={"portfolio": sample_portfolio})
        data = response.json()
        summary = data["summary"]
        assert "initial_annual_spend" in summary
        assert "initial_monthly_spend" in summary
        assert summary["initial_annual_spend"] > 0
        assert summary["initial_monthly_spend"] == pytest.approx(
            summary["initial_annual_spend"] / 12
        )

    def test_summary_spending_for_percent_of_portfolio(
        self, client: TestClient, sample_portfolio: dict
    ):
        response = client.post(
            "/api/v1/simulate",
            json={
                "portfolio": sample_portfolio,
                "spending_strategy": "percent_of_portfolio",
                "withdrawal_rate": 0.04,
            },
        )
        data = response.json()
        summary = data["summary"]
        # 4% of total balance (1M + 200K + 500K = 1.7M) = 68000
        assert summary["initial_annual_spend"] == pytest.approx(1700000 * 0.04, rel=0.01)


class TestMonteCarloEndpoint:
    def test_monte_carlo_basic(self, client: TestClient, sample_portfolio: dict):
        response = client.post(
            "/api/v1/monte-carlo",
            json={"portfolio": sample_portfolio, "num_simulations": 50, "seed": 42},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["num_simulations"] == 50
        assert 0 <= data["success_rate"] <= 1
        assert data["final_balance_p5"] <= data["final_balance_p95"]
        assert "median_simulation" in data
        assert "yearly_percentiles" in data

    def test_monte_carlo_invalid_simulations(self, client: TestClient, sample_portfolio: dict):
        response = client.post(
            "/api/v1/monte-carlo",
            json={"portfolio": sample_portfolio, "num_simulations": 20000},
        )
        assert response.status_code == 400
        assert "num_simulations" in response.json()["detail"]

    def test_monte_carlo_reproducible(self, client: TestClient, sample_portfolio: dict):
        response1 = client.post(
            "/api/v1/monte-carlo",
            json={"portfolio": sample_portfolio, "num_simulations": 50, "seed": 123},
        )
        response2 = client.post(
            "/api/v1/monte-carlo",
            json={"portfolio": sample_portfolio, "num_simulations": 50, "seed": 123},
        )
        assert response1.json()["success_rate"] == response2.json()["success_rate"]


class TestCompareEndpoint:
    def test_compare_default(self, client: TestClient, sample_portfolio: dict):
        response = client.post("/api/v1/compare", json=sample_portfolio)
        assert response.status_code == 200
        data = response.json()
        assert "comparisons" in data
        assert len(data["comparisons"]) == 1

    def test_compare_multiple_strategies(self, client: TestClient, sample_portfolio: dict):
        response = client.post(
            "/api/v1/compare",
            json=sample_portfolio,
            params={
                "conversion_strategies": ["irmaa_tier_1", "24_percent_bracket"],
                "spending_strategies": ["fixed_dollar", "guardrails"],
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["comparisons"]) == 4  # 2 conv * 2 spend

    def test_compare_includes_all_metrics(self, client: TestClient, sample_portfolio: dict):
        response = client.post("/api/v1/compare", json=sample_portfolio)
        data = response.json()
        comparison = data["comparisons"][0]
        assert "final_balance" in comparison
        assert "total_taxes_paid" in comparison
        assert "total_irmaa_paid" in comparison
        assert "total_roth_conversions" in comparison


class TestBackwardCompatRedirects:
    def test_old_simulate_redirects(self, client: TestClient, sample_portfolio: dict):
        response = client.post(
            "/simulate", json={"portfolio": sample_portfolio}, follow_redirects=False
        )
        assert response.status_code == 307
        assert response.headers["location"] == "/api/v1/simulate"

    def test_old_strategies_redirects(self, client: TestClient):
        response = client.get("/strategies", follow_redirects=False)
        assert response.status_code == 307
        assert response.headers["location"] == "/api/v1/strategies"

    def test_old_monte_carlo_redirects(self, client: TestClient):
        response = client.post(
            "/monte-carlo", json={"portfolio": {}}, follow_redirects=False
        )
        assert response.status_code == 307
        assert response.headers["location"] == "/api/v1/monte-carlo"

    def test_old_compare_redirects(self, client: TestClient):
        response = client.post("/compare", json={}, follow_redirects=False)
        assert response.status_code == 307
        assert response.headers["location"] == "/api/v1/compare"


class TestVaryTaxRegimesEndpoint:
    def test_monte_carlo_with_vary_tax_regimes(self, client: TestClient, sample_portfolio: dict):
        """API should accept vary_tax_regimes in config without errors."""
        sample_portfolio["config"]["vary_tax_regimes"] = True
        response = client.post(
            "/api/v1/monte-carlo",
            json={"portfolio": sample_portfolio, "num_simulations": 20, "seed": 42},
        )
        assert response.status_code == 200
        data = response.json()
        assert 0 <= data["success_rate"] <= 1

    def test_simulate_with_vary_tax_regimes(self, client: TestClient, sample_portfolio: dict):
        """vary_tax_regimes in config should be accepted by /simulate (no effect on deterministic)."""
        sample_portfolio["config"]["vary_tax_regimes"] = True
        response = client.post("/api/v1/simulate", json={"portfolio": sample_portfolio})
        assert response.status_code == 200


class TestNewIncomeFeatures:
    def test_simulate_with_ss_auto_and_cola(self, client: TestClient) -> None:
        portfolio = {
            "config": {
                "current_age_primary": 65,
                "current_age_spouse": 62,
                "simulation_years": 10,
                "start_year": 2026,
                "annual_spend_net": 80000,
                "social_security": {
                    "primary_benefit": 0, "primary_start_age": 70,
                    "spouse_benefit": 0, "spouse_start_age": 70,
                },
                "ss_auto": {
                    "primary_fra_amount": 36000,
                    "primary_start_age": 67,
                    "spouse_fra_amount": 18000,
                    "spouse_start_age": 65,
                },
                "income_streams": [
                    {
                        "name": "Pension",
                        "amount": 24000,
                        "start_age": 65,
                        "cola_rate": 0.02,
                    }
                ],
            },
            "accounts": [
                {
                    "id": "ira", "name": "IRA", "balance": 500000,
                    "type": "ira", "owner": "primary",
                },
                {
                    "id": "brokerage", "name": "Brokerage", "balance": 300000,
                    "type": "brokerage", "owner": "joint", "cost_basis_ratio": 0.5,
                },
            ],
        }
        response = client.post("/api/v1/simulate", json={"portfolio": portfolio})
        assert response.status_code == 200
        data = response.json()
        assert data["summary"]["simulation_years"] == 10
        assert data["summary"]["final_balance"] > 0


class TestStaticServing:
    def test_api_works_without_static_dir(self, client: TestClient):
        """API endpoints function normally when static/ directory is absent."""
        response = client.get("/api/v1/")
        assert response.status_code == 200
        assert response.json()["version"] == "0.11.0"

    def test_root_returns_json_without_static_dir(self, client: TestClient):
        """Root returns health/info JSON when no static assets are mounted."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["api"] == "/api/v1/"

    def test_static_mount_registered_when_dir_exists(self, tmp_path):
        """When static/ dir exists, StaticFiles mount is registered and serves SPA at /."""
        from unittest.mock import patch

        static_dir = tmp_path / "static"
        static_dir.mkdir()
        (static_dir / "index.html").write_text("<html><body>App</body></html>")

        from retirement_model import api as api_module

        saved_routes = list(app.routes)
        with patch.object(api_module, "STATIC_DIR", static_dir):
            # Remove existing static mount and root route (registered at module load)
            app.routes[:] = [
                r for r in app.routes
                if getattr(r, "name", "") not in ("static", "root")
            ]
            api_module.mount_static_or_root()

            route_names = [getattr(r, "name", "") for r in app.routes]
            assert "static" in route_names

            # Root should serve index.html (SPA), not JSON
            test_client = TestClient(app)
            response = test_client.get("/")
            assert response.status_code == 200
            assert "App" in response.text

            # API routes still work
            response = test_client.get("/api/v1/")
            assert response.status_code == 200
            assert response.json()["version"] == "0.11.0"

        # Restore original routes
        app.routes[:] = saved_routes
