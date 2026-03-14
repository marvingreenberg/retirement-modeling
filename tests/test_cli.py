"""Tests for CLI commands."""

import json
import tempfile
from pathlib import Path

import pytest
from click.testing import CliRunner

from retirement_model.cli import main


@pytest.fixture
def runner() -> CliRunner:
    return CliRunner()


@pytest.fixture
def sample_portfolio_file() -> Path:
    data = {
        "config": {
            "current_age_primary": 65,
            "current_age_spouse": 62,
            "simulation_years": 5,
            "start_year": 2026,
            "annual_spend_net": 100000,
            "inflation_rate": 0.03,
            "strategy_target": "irmaa_tier_1",
            "tax_rate_state": 0.05,
            "irmaa_limit_tier_1": 206000,
            "social_security": {
                "primary_benefit": 40000,
                "primary_start_age": 70,
                "spouse_benefit": 30000,
                "spouse_start_age": 67,
            },
            "rmd_start_age": 73,
        },
        "accounts": [
            {
                "id": "brokerage",
                "name": "Brokerage",
                "balance": 500000,
                "type": "brokerage",
                "owner": "joint",
                "cost_basis_ratio": 0.25,
            },
            {
                "id": "ira",
                "name": "IRA",
                "balance": 300000,
                "type": "ira",
                "owner": "primary",
            },
        ],
    }

    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
        json.dump(data, f)
        return Path(f.name)


class TestRunCommand:
    def test_run_basic(self, runner: CliRunner, sample_portfolio_file: Path):
        result = runner.invoke(main, ["run", str(sample_portfolio_file)])
        assert result.exit_code == 0
        assert "Strategy" in result.output

    def test_run_with_strategy_override(self, runner: CliRunner, sample_portfolio_file: Path):
        result = runner.invoke(main, ["run", str(sample_portfolio_file), "--strategy", "standard"])
        assert result.exit_code == 0
        assert "Standard" in result.output

    def test_run_with_csv_format(self, runner: CliRunner, sample_portfolio_file: Path):
        result = runner.invoke(main, ["run", str(sample_portfolio_file), "--output-format", "csv"])
        assert result.exit_code == 0
        assert "Age,AGI" in result.output

    def test_run_with_json_format(self, runner: CliRunner, sample_portfolio_file: Path):
        result = runner.invoke(main, ["run", str(sample_portfolio_file), "--output-format", "json"])
        assert result.exit_code == 0
        parsed = json.loads(result.output)
        assert "strategy" in parsed
        assert "years" in parsed

    def test_run_with_summary_format(self, runner: CliRunner, sample_portfolio_file: Path):
        result = runner.invoke(
            main, ["run", str(sample_portfolio_file), "--output-format", "summary"]
        )
        assert result.exit_code == 0
        assert "Final Balance" in result.output

    def test_run_with_output_file(self, runner: CliRunner, sample_portfolio_file: Path):
        with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as f:
            output_path = Path(f.name)

        result = runner.invoke(
            main, ["run", str(sample_portfolio_file), "--output-file", str(output_path)]
        )
        assert result.exit_code == 0
        assert output_path.exists()
        content = output_path.read_text()
        assert "Strategy" in content

    def test_run_nonexistent_file(self, runner: CliRunner):
        result = runner.invoke(main, ["run", "nonexistent.json"])
        assert result.exit_code != 0

    def test_run_invalid_json(self, runner: CliRunner):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            f.write("not valid json {")
            bad_file = Path(f.name)

        result = runner.invoke(main, ["run", str(bad_file)])
        assert result.exit_code != 0
        assert "Invalid JSON" in result.output


class TestValidateCommand:
    def test_validate_valid_file(self, runner: CliRunner, sample_portfolio_file: Path):
        result = runner.invoke(main, ["validate", str(sample_portfolio_file)])
        assert result.exit_code == 0
        assert "valid" in result.output.lower()

    def test_validate_shows_account_count(self, runner: CliRunner, sample_portfolio_file: Path):
        result = runner.invoke(main, ["validate", str(sample_portfolio_file)])
        assert "Accounts: 2" in result.output

    def test_validate_invalid_file(self, runner: CliRunner):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump({"config": {}, "accounts": []}, f)
            bad_file = Path(f.name)

        result = runner.invoke(main, ["validate", str(bad_file)])
        assert result.exit_code != 0


class TestStrategiesCommand:
    def test_strategies_lists_all(self, runner: CliRunner):
        result = runner.invoke(main, ["strategies"])
        assert result.exit_code == 0
        assert "standard" in result.output
        assert "irmaa_tier_1" in result.output
        assert "22_percent_bracket" in result.output
        assert "24_percent_bracket" in result.output


class TestCompareCommand:
    def test_compare_default_strategies(self, runner: CliRunner, sample_portfolio_file: Path):
        result = runner.invoke(main, ["compare", str(sample_portfolio_file)])
        assert result.exit_code == 0
        assert "Comparison" in result.output

    def test_compare_specific_strategies(self, runner: CliRunner, sample_portfolio_file: Path):
        result = runner.invoke(
            main,
            [
                "compare",
                str(sample_portfolio_file),
                "-s",
                "standard",
                "-s",
                "irmaa_tier_1",
            ],
        )
        assert result.exit_code == 0


class TestRunOverrideFlags:
    def test_growth_rate_override(self, runner: CliRunner, sample_portfolio_file: Path):
        result = runner.invoke(
            main,
            ["run", str(sample_portfolio_file), "-f", "summary", "--growth-rate", "0.04"],
        )
        assert result.exit_code == 0
        assert "Final Balance" in result.output

    def test_spending_override(self, runner: CliRunner, sample_portfolio_file: Path):
        result = runner.invoke(
            main,
            ["run", str(sample_portfolio_file), "-f", "summary", "--spending", "80000"],
        )
        assert result.exit_code == 0
        assert "Final Balance" in result.output

    def test_scale_override(self, runner: CliRunner, sample_portfolio_file: Path):
        result = runner.invoke(
            main,
            ["run", str(sample_portfolio_file), "-f", "summary", "--scale", "0.5"],
        )
        assert result.exit_code == 0
        assert "Final Balance" in result.output

    def test_growth_rate_affects_results(self, runner: CliRunner, sample_portfolio_file: Path):
        low = runner.invoke(
            main,
            ["run", str(sample_portfolio_file), "-f", "json", "--growth-rate", "0.02"],
        )
        high = runner.invoke(
            main,
            ["run", str(sample_portfolio_file), "-f", "json", "--growth-rate", "0.10"],
        )
        low_final = json.loads(low.output)["years"][-1]["total_balance"]
        high_final = json.loads(high.output)["years"][-1]["total_balance"]
        assert high_final > low_final

    def test_scale_halves_balance(self, runner: CliRunner, sample_portfolio_file: Path):
        base = runner.invoke(main, ["validate", str(sample_portfolio_file)])
        scaled = runner.invoke(main, ["validate", str(sample_portfolio_file), "--scale", "0.5"])
        assert "$800,000" in base.output
        assert "$400,000" in scaled.output

    def test_combined_overrides(self, runner: CliRunner, sample_portfolio_file: Path):
        result = runner.invoke(
            main,
            [
                "run",
                str(sample_portfolio_file),
                "-f",
                "summary",
                "--growth-rate",
                "0.05",
                "--spending",
                "80000",
                "--scale",
                "0.75",
            ],
        )
        assert result.exit_code == 0


class TestCompareOverrideFlags:
    def test_compare_with_scale(self, runner: CliRunner, sample_portfolio_file: Path):
        result = runner.invoke(
            main,
            ["compare", str(sample_portfolio_file), "-s", "standard", "--scale", "0.5"],
        )
        assert result.exit_code == 0

    def test_compare_with_growth_rate(self, runner: CliRunner, sample_portfolio_file: Path):
        result = runner.invoke(
            main,
            ["compare", str(sample_portfolio_file), "-s", "standard", "--growth-rate", "0.05"],
        )
        assert result.exit_code == 0


class TestWithdrawalOrder:
    def test_pretax_first(self, runner: CliRunner, sample_portfolio_file: Path):
        result = runner.invoke(
            main, ["run", str(sample_portfolio_file), "-f", "summary", "--pretax-first"]
        )
        assert result.exit_code == 0

    def test_brokerage_first_explicit(self, runner: CliRunner, sample_portfolio_file: Path):
        result = runner.invoke(
            main, ["run", str(sample_portfolio_file), "-f", "summary", "--brokerage-first"]
        )
        assert result.exit_code == 0

    def test_pretax_first_on_compare(self, runner: CliRunner, sample_portfolio_file: Path):
        result = runner.invoke(
            main, ["compare", str(sample_portfolio_file), "-s", "standard", "--pretax-first"]
        )
        assert result.exit_code == 0


class TestValidateScale:
    def test_validate_with_scale(self, runner: CliRunner, sample_portfolio_file: Path):
        result = runner.invoke(main, ["validate", str(sample_portfolio_file), "--scale", "0.5"])
        assert result.exit_code == 0
        assert "$400,000" in result.output


class TestVersionOption:
    def test_version(self, runner: CliRunner):
        result = runner.invoke(main, ["--version"])
        assert result.exit_code == 0
        assert "version" in result.output.lower() or "0." in result.output
