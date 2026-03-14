"""Portfolio loading abstraction layer.

Provides a unified interface for loading portfolios from different sources.
Currently supports file paths, designed to be extended for URLs (sql://, https://, etc.)
"""

import json
from abc import ABC, abstractmethod
from pathlib import Path
from urllib.parse import urlparse

from retirement_model.models import Portfolio


class PortfolioLoader(ABC):
    """Abstract base class for portfolio loaders."""

    @abstractmethod
    def load(self, source: str) -> Portfolio:
        """Load a portfolio from the given source."""
        pass

    @abstractmethod
    def can_handle(self, source: str) -> bool:
        """Check if this loader can handle the given source."""
        pass


class FileLoader(PortfolioLoader):
    """Load portfolios from local JSON files."""

    def can_handle(self, source: str) -> bool:
        parsed = urlparse(source)
        # Handle file:// URLs or plain paths (no scheme)
        return parsed.scheme in ("", "file")

    def load(self, source: str) -> Portfolio:
        parsed = urlparse(source)
        if parsed.scheme == "file":
            path = Path(parsed.path)
        else:
            path = Path(source)

        if not path.exists():
            raise FileNotFoundError(f"Portfolio file not found: {path}")

        try:
            with open(path) as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in {path}: {e}") from e

        try:
            return Portfolio.model_validate(data)
        except Exception as e:
            raise ValueError(f"Invalid portfolio data: {e}") from e


# Registry of available loaders
_loaders: list[PortfolioLoader] = [
    FileLoader(),
]


def register_loader(loader: PortfolioLoader) -> None:
    """Register a new portfolio loader."""
    _loaders.insert(0, loader)


def scale_portfolio(portfolio: Portfolio, factor: float) -> Portfolio:
    """Scale all dollar-denominated values in a portfolio by the given factor.

    Scales balances, spending, income, SS benefits, and planned expenses.
    Does NOT scale tax brackets, IRMAA limits, or rates/percentages.
    """
    portfolio = portfolio.model_copy(deep=True)
    for acc in portfolio.accounts:
        acc.balance = round(acc.balance * factor, 2)

    cfg = portfolio.config
    cfg.annual_spend_net = round(cfg.annual_spend_net * factor, 2)

    cfg.social_security.primary_benefit = round(cfg.social_security.primary_benefit * factor, 2)
    cfg.social_security.spouse_benefit = round(cfg.social_security.spouse_benefit * factor, 2)

    for expense in cfg.planned_expenses:
        expense.amount = round(expense.amount * factor, 2)

    for stream in cfg.income_streams:
        stream.amount = round(stream.amount * factor, 2)
        stream.pretax_401k = round(stream.pretax_401k * factor, 2)
        stream.roth_401k = round(stream.roth_401k * factor, 2)

    if cfg.ss_auto:
        cfg.ss_auto.primary_fra_amount = round(cfg.ss_auto.primary_fra_amount * factor, 2)
        if cfg.ss_auto.spouse_fra_amount is not None:
            cfg.ss_auto.spouse_fra_amount = round(cfg.ss_auto.spouse_fra_amount * factor, 2)

    if cfg.salary_auto:
        cfg.salary_auto.primary_salary = round(cfg.salary_auto.primary_salary * factor, 2)
        cfg.salary_auto.primary_pretax_401k = round(cfg.salary_auto.primary_pretax_401k * factor, 2)
        cfg.salary_auto.primary_roth_401k = round(cfg.salary_auto.primary_roth_401k * factor, 2)
        if cfg.salary_auto.spouse_salary is not None:
            cfg.salary_auto.spouse_salary = round(cfg.salary_auto.spouse_salary * factor, 2)
        cfg.salary_auto.spouse_pretax_401k = round(cfg.salary_auto.spouse_pretax_401k * factor, 2)
        cfg.salary_auto.spouse_roth_401k = round(cfg.salary_auto.spouse_roth_401k * factor, 2)

    return portfolio


def load_portfolio(source: str) -> Portfolio:
    """Load a portfolio from the given source.

    The source can be:
    - A local file path: /path/to/portfolio.json
    - A file URL: file:///path/to/portfolio.json

    Future support planned for:
    - HTTP URLs: https://example.com/portfolio.json
    - Database URLs: sql://host/database/portfolio_id
    """
    for loader in _loaders:
        if loader.can_handle(source):
            return loader.load(source)

    raise ValueError(f"No loader available for source: {source}")
