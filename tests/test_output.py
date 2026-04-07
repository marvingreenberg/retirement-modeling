"""Tests for output formatting functions."""

import json

import pytest

from retirement_model.models import ConversionStrategy, SimulationResult, YearResult
from retirement_model.output import (
    compare_results,
    format_csv,
    format_json,
    format_summary,
    format_table,
    get_strategy_description,
    results_to_dataframe,
)


@pytest.fixture
def sample_result() -> SimulationResult:
    years = [
        YearResult(
            year=2026,
            age_primary=65,
            age_spouse=62,
            agi=150000,
            bracket="22%",
            rmd=0,
            surplus=0,
            roth_conversion=50000,
            conversion_tax=10000,
            pretax_withdrawal=0,
            roth_withdrawal=0,
            brokerage_withdrawal=60000,
            total_tax=25000,
            irmaa_cost=0,
            total_balance=1000000,
            pretax_balance=300000,
            roth_balance=150000,
            brokerage_balance=550000,
        ),
        YearResult(
            year=2027,
            age_primary=66,
            age_spouse=63,
            agi=160000,
            bracket="22%",
            rmd=0,
            surplus=0,
            roth_conversion=45000,
            conversion_tax=9000,
            pretax_withdrawal=0,
            roth_withdrawal=0,
            brokerage_withdrawal=55000,
            total_tax=26000,
            irmaa_cost=0,
            total_balance=1050000,
            pretax_balance=280000,
            roth_balance=200000,
            brokerage_balance=570000,
        ),
    ]
    return SimulationResult(strategy=ConversionStrategy.IRMAA_TIER_1, years=years)


class TestGetStrategyDescription:
    def test_bracket_24(self):
        desc = get_strategy_description(ConversionStrategy.BRACKET_24)
        assert "24%" in desc
        assert "383,900" in desc

    def test_bracket_22(self):
        desc = get_strategy_description(ConversionStrategy.BRACKET_22)
        assert "22%" in desc

    def test_irmaa_tier_1(self):
        desc = get_strategy_description(ConversionStrategy.IRMAA_TIER_1)
        assert "IRMAA" in desc

    def test_standard(self):
        desc = get_strategy_description(ConversionStrategy.STANDARD)
        assert "Standard" in desc


class TestResultsToDataframe:
    def test_dataframe_has_correct_rows(self, sample_result: SimulationResult):
        df = results_to_dataframe(sample_result)
        assert len(df) == 2

    def test_dataframe_has_expected_columns(self, sample_result: SimulationResult):
        df = results_to_dataframe(sample_result)
        expected_cols = ["Age", "AGI", "Bracket", "RMD", "Balance"]
        for col in expected_cols:
            assert col in df.columns

    def test_dataframe_values(self, sample_result: SimulationResult):
        df = results_to_dataframe(sample_result)
        assert df.iloc[0]["Age"] == 65
        assert df.iloc[0]["AGI"] == 150000


class TestFormatTable:
    def test_table_contains_data(self, sample_result: SimulationResult):
        table = format_table(sample_result)
        assert "65" in table
        assert "150000" in table

    def test_table_is_string(self, sample_result: SimulationResult):
        table = format_table(sample_result)
        assert isinstance(table, str)


class TestFormatCsv:
    def test_csv_format(self, sample_result: SimulationResult):
        csv = format_csv(sample_result)
        lines = csv.strip().split("\n")
        assert len(lines) == 3  # header + 2 data rows

    def test_csv_has_headers(self, sample_result: SimulationResult):
        csv = format_csv(sample_result)
        first_line = csv.split("\n")[0]
        assert "Age" in first_line
        assert "AGI" in first_line


class TestFormatJson:
    def test_json_valid(self, sample_result: SimulationResult):
        json_str = format_json(sample_result)
        parsed = json.loads(json_str)
        assert "strategy" in parsed
        assert "years" in parsed

    def test_json_has_year_data(self, sample_result: SimulationResult):
        json_str = format_json(sample_result)
        parsed = json.loads(json_str)
        assert len(parsed["years"]) == 2


class TestFormatSummary:
    def test_summary_contains_key_info(self, sample_result: SimulationResult):
        summary = format_summary(sample_result)
        assert "Strategy" in summary
        assert "Final Balance" in summary
        assert "Total Taxes" in summary

    def test_summary_shows_balances(self, sample_result: SimulationResult):
        summary = format_summary(sample_result)
        assert "Pre-Tax" in summary
        assert "Roth" in summary
        assert "Brokerage" in summary

    def test_summary_shows_roth_conversions(self, sample_result: SimulationResult):
        summary = format_summary(sample_result)
        assert "Roth Conversions" in summary


class TestSimulationResultProperties:
    def test_total_roth_conversions(self, sample_result: SimulationResult):
        # Sample result has 50000 + 45000 = 95000 in conversions
        assert sample_result.total_roth_conversions == 95000


class TestCompareResults:
    def test_compare_multiple_results(self, sample_result: SimulationResult):
        result2 = SimulationResult(
            strategy=ConversionStrategy.STANDARD,
            years=sample_result.years,
        )
        comparison = compare_results([sample_result, result2])
        assert "Comparison" in comparison
        assert "Final Balance" in comparison
        assert "IRMAA" in comparison or "irmaa" in comparison.lower()

    def test_compare_shows_all_strategies(self, sample_result: SimulationResult):
        result2 = SimulationResult(
            strategy=ConversionStrategy.STANDARD,
            years=sample_result.years,
        )
        comparison = compare_results([sample_result, result2])
        # Should contain truncated strategy names
        assert "IRMAA" in comparison or "Standard" in comparison

    def test_compare_shows_roth_conversions(self, sample_result: SimulationResult):
        result2 = SimulationResult(
            strategy=ConversionStrategy.STANDARD,
            years=sample_result.years,
        )
        comparison = compare_results([sample_result, result2])
        assert "Roth Conversions" in comparison
