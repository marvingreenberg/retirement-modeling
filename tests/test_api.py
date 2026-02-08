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
                "type": "pretax",
                "owner": "primary",
            },
            {
                "id": "roth",
                "name": "Roth IRA",
                "balance": 200000,
                "type": "roth",
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
    def test_root(self, client: TestClient):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "endpoints" in data


class TestStrategiesEndpoint:
    def test_list_strategies(self, client: TestClient):
        response = client.get("/strategies")
        assert response.status_code == 200
        data = response.json()
        assert "conversion_strategies" in data
        assert "spending_strategies" in data
        assert len(data["conversion_strategies"]) == len(ConversionStrategy)
        assert len(data["spending_strategies"]) == len(SpendingStrategy)


class TestSimulateEndpoint:
    def test_simulate_basic(self, client: TestClient, sample_portfolio: dict):
        response = client.post("/simulate", json={"portfolio": sample_portfolio})
        assert response.status_code == 200
        data = response.json()
        assert "result" in data
        assert "summary" in data
        assert "final_balance" in data["summary"]
        assert data["summary"]["simulation_years"] <= 30

    def test_simulate_with_strategy_override(self, client: TestClient, sample_portfolio: dict):
        response = client.post(
            "/simulate",
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
            "/simulate",
            json={
                "portfolio": sample_portfolio,
                "spending_strategy": "percent_of_portfolio",
                "withdrawal_rate": 0.04,
            },
        )
        assert response.status_code == 200


class TestMonteCarloEndpoint:
    def test_monte_carlo_basic(self, client: TestClient, sample_portfolio: dict):
        response = client.post(
            "/monte-carlo",
            json={"portfolio": sample_portfolio, "num_simulations": 50, "seed": 42},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["num_simulations"] == 50
        assert 0 <= data["success_rate"] <= 1
        assert data["percentile_5"] <= data["median_final_balance"]
        assert data["median_final_balance"] <= data["percentile_95"]

    def test_monte_carlo_invalid_simulations(self, client: TestClient, sample_portfolio: dict):
        response = client.post(
            "/monte-carlo",
            json={"portfolio": sample_portfolio, "num_simulations": 20000},
        )
        assert response.status_code == 400
        assert "num_simulations" in response.json()["detail"]

    def test_monte_carlo_reproducible(self, client: TestClient, sample_portfolio: dict):
        response1 = client.post(
            "/monte-carlo",
            json={"portfolio": sample_portfolio, "num_simulations": 50, "seed": 123},
        )
        response2 = client.post(
            "/monte-carlo",
            json={"portfolio": sample_portfolio, "num_simulations": 50, "seed": 123},
        )
        assert response1.json()["success_rate"] == response2.json()["success_rate"]


class TestCompareEndpoint:
    def test_compare_default(self, client: TestClient, sample_portfolio: dict):
        response = client.post("/compare", json=sample_portfolio)
        assert response.status_code == 200
        data = response.json()
        assert "comparisons" in data
        assert len(data["comparisons"]) == 1

    def test_compare_multiple_strategies(self, client: TestClient, sample_portfolio: dict):
        response = client.post(
            "/compare",
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
        response = client.post("/compare", json=sample_portfolio)
        data = response.json()
        comparison = data["comparisons"][0]
        assert "final_balance" in comparison
        assert "total_taxes_paid" in comparison
        assert "total_irmaa_paid" in comparison
        assert "total_roth_conversions" in comparison


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
                    "type": "pretax", "owner": "primary",
                },
                {
                    "id": "brokerage", "name": "Brokerage", "balance": 300000,
                    "type": "brokerage", "owner": "joint", "cost_basis_ratio": 0.5,
                },
            ],
        }
        response = client.post("/simulate", json={"portfolio": portfolio})
        assert response.status_code == 200
        data = response.json()
        assert data["summary"]["simulation_years"] == 10
        assert data["summary"]["final_balance"] > 0
