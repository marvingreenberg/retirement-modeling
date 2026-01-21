"""Tests for portfolio loader abstraction."""

import json
import tempfile
from pathlib import Path

import pytest

from retirement_model.loader import FileLoader, PortfolioLoader, load_portfolio, register_loader
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
