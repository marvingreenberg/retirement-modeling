"""Tests for portfolio loader abstraction."""

import json
import tempfile
from pathlib import Path

import pytest

from retirement_model.loader import (
    FileLoader,
    PortfolioLoader,
    load_portfolio,
    register_loader,
    scale_portfolio,
)
from retirement_model.models import Portfolio


@pytest.fixture
def sample_portfolio_data() -> dict:
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
                "id": "brokerage",
                "name": "Brokerage",
                "balance": 500000,
                "type": "brokerage",
                "owner": "joint",
                "cost_basis_ratio": 0.6,
            }
        ],
    }


@pytest.fixture
def portfolio_file(sample_portfolio_data: dict) -> Path:
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
        json.dump(sample_portfolio_data, f)
        return Path(f.name)


class TestFileLoader:
    def test_can_handle_plain_path(self):
        loader = FileLoader()
        assert loader.can_handle("/path/to/file.json")
        assert loader.can_handle("relative/path.json")

    def test_can_handle_file_url(self):
        loader = FileLoader()
        assert loader.can_handle("file:///path/to/file.json")

    def test_cannot_handle_http(self):
        loader = FileLoader()
        assert not loader.can_handle("https://example.com/file.json")

    def test_cannot_handle_sql(self):
        loader = FileLoader()
        assert not loader.can_handle("sql://host/database/id")

    def test_load_valid_file(self, portfolio_file: Path):
        loader = FileLoader()
        portfolio = loader.load(str(portfolio_file))
        assert isinstance(portfolio, Portfolio)
        assert len(portfolio.accounts) == 1

    def test_load_nonexistent_file(self):
        loader = FileLoader()
        with pytest.raises(FileNotFoundError):
            loader.load("/nonexistent/path.json")


class TestLoadPortfolio:
    def test_load_from_path(self, portfolio_file: Path):
        portfolio = load_portfolio(str(portfolio_file))
        assert isinstance(portfolio, Portfolio)
        assert portfolio.config.current_age_primary == 65

    def test_load_from_file_url(self, portfolio_file: Path):
        portfolio = load_portfolio(f"file://{portfolio_file}")
        assert isinstance(portfolio, Portfolio)

    def test_load_unsupported_scheme(self):
        with pytest.raises(ValueError, match="No loader available"):
            load_portfolio("https://example.com/portfolio.json")


class TestRegisterLoader:
    def test_register_custom_loader(self, sample_portfolio_data: dict):
        class MockLoader(PortfolioLoader):
            def can_handle(self, source: str) -> bool:
                return source.startswith("mock://")

            def load(self, source: str) -> Portfolio:
                return Portfolio.model_validate(sample_portfolio_data)

        register_loader(MockLoader())

        portfolio = load_portfolio("mock://test")
        assert isinstance(portfolio, Portfolio)


class TestScalePortfolio:
    def test_scales_account_balances(self, portfolio_file: Path):
        portfolio = load_portfolio(str(portfolio_file))
        scaled = scale_portfolio(portfolio, 0.5)
        assert scaled.accounts[0].balance == 250000

    def test_scales_spending(self, portfolio_file: Path):
        portfolio = load_portfolio(str(portfolio_file))
        scaled = scale_portfolio(portfolio, 0.5)
        assert scaled.config.annual_spend_net == 50000

    def test_scales_social_security(self, portfolio_file: Path):
        portfolio = load_portfolio(str(portfolio_file))
        scaled = scale_portfolio(portfolio, 0.5)
        assert scaled.config.social_security.primary_benefit == 18000
        assert scaled.config.social_security.spouse_benefit == 9000

    def test_does_not_mutate_original(self, portfolio_file: Path):
        portfolio = load_portfolio(str(portfolio_file))
        original_balance = portfolio.accounts[0].balance
        scale_portfolio(portfolio, 0.5)
        assert portfolio.accounts[0].balance == original_balance

    def test_preserves_cost_basis_ratio(self, portfolio_file: Path):
        portfolio = load_portfolio(str(portfolio_file))
        scaled = scale_portfolio(portfolio, 0.5)
        assert scaled.accounts[0].cost_basis_ratio == portfolio.accounts[0].cost_basis_ratio

    def test_scales_planned_expenses(self, sample_portfolio_data: dict):
        sample_portfolio_data["config"]["planned_expenses"] = [
            {"name": "Roof", "amount": 20000, "expense_type": "one_time", "year": 2028}
        ]
        portfolio = Portfolio.model_validate(sample_portfolio_data)
        scaled = scale_portfolio(portfolio, 0.25)
        assert scaled.config.planned_expenses[0].amount == 5000

    def test_scales_income_streams(self, sample_portfolio_data: dict):
        sample_portfolio_data["config"]["income_streams"] = [
            {"name": "Pension", "amount": 40000, "start_age": 65, "kind": "pension"}
        ]
        portfolio = Portfolio.model_validate(sample_portfolio_data)
        scaled = scale_portfolio(portfolio, 0.5)
        assert scaled.config.income_streams[0].amount == 20000

    def test_scales_ss_auto(self, sample_portfolio_data: dict):
        sample_portfolio_data["config"]["ss_auto"] = {
            "primary_fra_amount": 30000,
            "primary_start_age": 67,
            "spouse_fra_amount": 15000,
            "spouse_start_age": 67,
        }
        portfolio = Portfolio.model_validate(sample_portfolio_data)
        scaled = scale_portfolio(portfolio, 0.5)
        assert scaled.config.ss_auto is not None
        assert scaled.config.ss_auto.primary_fra_amount == 15000
        assert scaled.config.ss_auto.spouse_fra_amount == 7500

    def test_scales_salary_auto(self, sample_portfolio_data: dict):
        sample_portfolio_data["config"]["salary_auto"] = {
            "primary_salary": 120000,
            "primary_pretax_401k": 23000,
            "primary_roth_401k": 0,
        }
        portfolio = Portfolio.model_validate(sample_portfolio_data)
        scaled = scale_portfolio(portfolio, 0.5)
        assert scaled.config.salary_auto is not None
        assert scaled.config.salary_auto.primary_salary == 60000
        assert scaled.config.salary_auto.primary_pretax_401k == 11500

    def test_scale_factor_one_is_identity(self, portfolio_file: Path):
        portfolio = load_portfolio(str(portfolio_file))
        scaled = scale_portfolio(portfolio, 1.0)
        assert scaled.accounts[0].balance == portfolio.accounts[0].balance
        assert scaled.config.annual_spend_net == portfolio.config.annual_spend_net
