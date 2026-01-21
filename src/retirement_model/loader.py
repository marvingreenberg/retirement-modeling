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
