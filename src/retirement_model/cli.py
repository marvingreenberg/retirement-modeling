"""Command-line interface for retirement simulation."""

import json
import sys
from pathlib import Path

import click

from retirement_model.models import Portfolio, WithdrawalStrategy
from retirement_model.output import OutputFormat, compare_results, print_results
from retirement_model.simulation import run_simulation


@click.group()
@click.version_option()
def main() -> None:
    """Retirement portfolio simulation with tax-optimized withdrawal strategies."""
    pass


@main.command()
@click.argument("portfolio_file", type=click.Path(exists=True, path_type=Path))
@click.option(
    "--strategy",
    type=click.Choice([s.value for s in WithdrawalStrategy]),
    default=None,
    help="Override the withdrawal strategy from the portfolio file.",
)
@click.option(
    "--output-format",
    "-f",
    type=click.Choice([f.value for f in OutputFormat]),
    default="table",
    help="Output format for results.",
)
@click.option(
    "--capital-gains-rate",
    type=float,
    default=None,
    help="Override capital gains tax rate (e.g., 0.15 for 15%).",
)
@click.option(
    "--output-file",
    "-o",
    type=click.Path(path_type=Path),
    default=None,
    help="Write output to file instead of stdout.",
)
def run(
    portfolio_file: Path,
    strategy: str | None,
    output_format: str,
    capital_gains_rate: float | None,
    output_file: Path | None,
) -> None:
    """Run the retirement simulation on a portfolio file."""
    try:
        with open(portfolio_file) as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        click.echo(f"Error: Invalid JSON in {portfolio_file}: {e}", err=True)
        sys.exit(1)

    try:
        portfolio = Portfolio(**data)
    except Exception as e:
        click.echo(f"Error: Invalid portfolio data: {e}", err=True)
        sys.exit(1)

    if strategy:
        portfolio.config.strategy_target = WithdrawalStrategy(strategy)

    if capital_gains_rate is not None:
        portfolio.config.tax_rate_capital_gains = capital_gains_rate

    result = run_simulation(portfolio)

    fmt = OutputFormat(output_format)
    if output_file:
        with open(output_file, "w") as f:
            print_results(result, fmt, f)
        click.echo(f"Results written to {output_file}")
    else:
        print_results(result, fmt)


@main.command()
@click.argument("portfolio_file", type=click.Path(exists=True, path_type=Path))
@click.option(
    "--strategy",
    "-s",
    type=click.Choice([s.value for s in WithdrawalStrategy]),
    multiple=True,
    help="Strategies to compare (can specify multiple).",
)
def compare(portfolio_file: Path, strategy: tuple[str, ...]) -> None:
    """Compare multiple withdrawal strategies."""
    try:
        with open(portfolio_file) as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        click.echo(f"Error: Invalid JSON in {portfolio_file}: {e}", err=True)
        sys.exit(1)

    try:
        portfolio = Portfolio(**data)
    except Exception as e:
        click.echo(f"Error: Invalid portfolio data: {e}", err=True)
        sys.exit(1)

    strategies = [WithdrawalStrategy(s) for s in strategy] if strategy else list(WithdrawalStrategy)

    results = []
    for strat in strategies:
        portfolio.config.strategy_target = strat
        results.append(run_simulation(Portfolio(**data)))
        portfolio.config.strategy_target = strat
        results[-1] = run_simulation(
            Portfolio.model_validate(
                {**data, "config": {**data["config"], "strategy_target": strat.value}}
            )
        )

    click.echo(compare_results(results))


@main.command()
@click.argument("portfolio_file", type=click.Path(exists=True, path_type=Path))
def validate(portfolio_file: Path) -> None:
    """Validate a portfolio file without running simulation."""
    try:
        with open(portfolio_file) as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        click.echo(f"Error: Invalid JSON: {e}", err=True)
        sys.exit(1)

    try:
        portfolio = Portfolio(**data)
        click.echo(f"Portfolio is valid.")
        click.echo(f"  Accounts: {len(portfolio.accounts)}")
        click.echo(f"  Total Balance: ${sum(a.balance for a in portfolio.accounts):,.0f}")
        click.echo(f"  Strategy: {portfolio.config.strategy_target.value}")
        click.echo(f"  Simulation Years: {portfolio.config.simulation_years}")
    except Exception as e:
        click.echo(f"Error: Invalid portfolio: {e}", err=True)
        sys.exit(1)


@main.command()
def strategies() -> None:
    """List available withdrawal strategies."""
    click.echo("Available Withdrawal Strategies:")
    click.echo()
    for strat in WithdrawalStrategy:
        match strat:
            case WithdrawalStrategy.STANDARD:
                desc = "Standard spending, no voluntary Roth conversions"
            case WithdrawalStrategy.IRMAA_TIER_1:
                desc = "Cap AGI at IRMAA Tier 1 threshold to avoid Medicare surcharges"
            case WithdrawalStrategy.BRACKET_22:
                desc = "Fill up to top of 22% federal tax bracket"
            case WithdrawalStrategy.BRACKET_24:
                desc = "Fill up to top of 24% federal tax bracket"
        click.echo(f"  {strat.value}")
        click.echo(f"    {desc}")
        click.echo()


if __name__ == "__main__":
    main()
