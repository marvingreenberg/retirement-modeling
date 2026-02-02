"""Tests for historical_returns module."""

from retirement_model.historical_returns import (
    SP500_ANNUAL_RETURNS,
    HISTORICAL_INFLATION,
    get_historical_returns,
    get_historical_inflation,
    get_return_statistics,
)


class TestDataIntegrity:
    """Verify historical data arrays have expected size and reasonable ranges."""

    def test_returns_count(self) -> None:
        returns = get_historical_returns()
        assert len(returns) == 96, "Expected 96 years of returns (1928-2023)"

    def test_returns_value_range(self) -> None:
        for r in get_historical_returns():
            assert -0.5 <= r <= 0.6, f"Return {r} outside reasonable range"

    def test_inflation_count(self) -> None:
        inflation = get_historical_inflation()
        assert len(inflation) == 96, "Expected 96 years of inflation (1928-2023)"

    def test_inflation_value_range(self) -> None:
        for i in get_historical_inflation():
            assert -0.15 <= i <= 0.20, f"Inflation {i} outside reasonable range"


class TestCopySemantics:
    """Getter functions must return copies, not references to module data."""

    def test_returns_mutation_safety(self) -> None:
        first = get_historical_returns()
        first[0] = 999.0
        second = get_historical_returns()
        assert second[0] != 999.0
        assert second[0] == SP500_ANNUAL_RETURNS[0]

    def test_inflation_mutation_safety(self) -> None:
        first = get_historical_inflation()
        first[0] = 999.0
        second = get_historical_inflation()
        assert second[0] != 999.0
        assert second[0] == HISTORICAL_INFLATION[0]


class TestReturnStatistics:
    """Verify get_return_statistics() against independent calculations."""

    def test_statistics_keys(self) -> None:
        stats = get_return_statistics()
        assert set(stats.keys()) == {"mean", "std_dev", "min", "max", "median"}

    def test_statistics_types(self) -> None:
        stats = get_return_statistics()
        for key, value in stats.items():
            assert isinstance(value, float), f"{key} should be float, got {type(value)}"

    def test_min_max(self) -> None:
        stats = get_return_statistics()
        assert stats["min"] == min(SP500_ANNUAL_RETURNS)
        assert stats["max"] == max(SP500_ANNUAL_RETURNS)

    def test_mean(self) -> None:
        stats = get_return_statistics()
        expected_mean = sum(SP500_ANNUAL_RETURNS) / len(SP500_ANNUAL_RETURNS)
        assert stats["mean"] == expected_mean

    def test_std_dev(self) -> None:
        stats = get_return_statistics()
        returns = SP500_ANNUAL_RETURNS
        n = len(returns)
        mean = sum(returns) / n
        expected_variance = sum((r - mean) ** 2 for r in returns) / n
        expected_std = expected_variance**0.5
        assert stats["std_dev"] == expected_std

    def test_median(self) -> None:
        stats = get_return_statistics()
        n = len(SP500_ANNUAL_RETURNS)
        expected_median = sorted(SP500_ANNUAL_RETURNS)[n // 2]
        assert stats["median"] == expected_median
