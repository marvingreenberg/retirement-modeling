"""Command-line interface for retirement simulation."""

import sys
from pathlib import Path

import click

from retirement_model.loader import load_portfolio
from retirement_model.models import ConversionStrategy, SpendingStrategy
from retirement_model.monte_carlo import format_monte_carlo_result, run_monte_carlo
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
    type=click.Choice([s.value for s in ConversionStrategy]),
    default=None,
    help="Override the conversion strategy (controls Roth conversion ceiling).",
)
@click.option(
    "--spending-strategy",
    type=click.Choice([s.value for s in SpendingStrategy]),
    default=None,
    help="Override the spending strategy (controls annual withdrawal calculation).",
)
@click.option(
    "--withdrawal-rate",
    type=float,
    default=None,
    help="Override withdrawal rate for percent_of_portfolio strategy (e.g., 0.04 for 4%).",
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
    spending_strategy: str | None,
    withdrawal_rate: float | None,
    output_format: str,
    capital_gains_rate: float | None,
    output_file: Path | None,
) -> None:
    """Run the retirement simulation on a portfolio file."""
    try:
        portfolio = load_portfolio(str(portfolio_file))
    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)

    if strategy:
        portfolio.config.strategy_target = ConversionStrategy(strategy)

    if spending_strategy:
        portfolio.config.spending_strategy = SpendingStrategy(spending_strategy)

    if withdrawal_rate is not None:
        portfolio.config.withdrawal_rate = withdrawal_rate

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
    type=click.Choice([s.value for s in ConversionStrategy]),
    multiple=True,
    help="Conversion strategies to compare (can specify multiple).",
)
@click.option(
    "--spending-strategy",
    type=click.Choice([s.value for s in SpendingStrategy]),
    multiple=True,
    help="Spending strategies to compare (can specify multiple).",
)
def compare(
    portfolio_file: Path, strategy: tuple[str, ...], spending_strategy: tuple[str, ...]
) -> None:
    """Compare multiple strategies."""
    try:
        base_portfolio = load_portfolio(str(portfolio_file))
    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)

    conv_strategies = (
        [ConversionStrategy(s) for s in strategy] if strategy else [ConversionStrategy.IRMAA_TIER_1]
    )
    spend_strategies = (
        [SpendingStrategy(s) for s in spending_strategy]
        if spending_strategy
        else [SpendingStrategy.FIXED_DOLLAR]
    )

    results = []
    for conv_strat in conv_strategies:
        for spend_strat in spend_strategies:
            portfolio = base_portfolio.model_copy(deep=True)
            portfolio.config.strategy_target = conv_strat
            portfolio.config.spending_strategy = spend_strat
            results.append(run_simulation(portfolio))

    click.echo(compare_results(results))


@main.command()
@click.argument("portfolio_file", type=click.Path(exists=True, path_type=Path))
def validate(portfolio_file: Path) -> None:
    """Validate a portfolio file without running simulation."""
    try:
        portfolio = load_portfolio(str(portfolio_file))
        click.echo("Portfolio is valid.")
        click.echo(f"  Accounts: {len(portfolio.accounts)}")
        click.echo(f"  Total Balance: ${sum(a.balance for a in portfolio.accounts):,.0f}")
        click.echo(f"  Conversion Strategy: {portfolio.config.strategy_target.value}")
        click.echo(f"  Spending Strategy: {portfolio.config.spending_strategy.value}")
        click.echo(f"  Simulation Years: {portfolio.config.simulation_years}")
    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


@main.command()
def strategies() -> None:
    """List available strategies."""
    click.echo("Conversion Strategies (control Roth conversion ceiling):")
    click.echo()
    for strat in ConversionStrategy:
        match strat:
            case ConversionStrategy.STANDARD:
                desc = "No voluntary Roth conversions"
            case ConversionStrategy.IRMAA_TIER_1:
                desc = "Cap AGI at IRMAA Tier 1 threshold to avoid Medicare surcharges"
            case ConversionStrategy.BRACKET_22:
                desc = "Fill up to top of 22% federal tax bracket"
            case ConversionStrategy.BRACKET_24:
                desc = "Fill up to top of 24% federal tax bracket"
        click.echo(f"  {strat.value}")
        click.echo(f"    {desc}")
        click.echo()

    click.echo("Spending Strategies (control annual withdrawal amount):")
    click.echo()
    for strat in SpendingStrategy:
        match strat:
            case SpendingStrategy.FIXED_DOLLAR:
                desc = "Fixed dollar amount adjusted for inflation (traditional approach)"
            case SpendingStrategy.PERCENT_OF_PORTFOLIO:
                desc = "Withdraw fixed percentage of current portfolio value"
            case SpendingStrategy.GUARDRAILS:
                desc = "Guyton-Klinger: adjust spending when withdrawal rate crosses thresholds"
            case SpendingStrategy.RMD_BASED:
                desc = "Withdraw based on RMD percentages from IRS tables"
        click.echo(f"  {strat.value}")
        click.echo(f"    {desc}")
        click.echo()


@main.command("monte-carlo")
@click.argument("portfolio_file", type=click.Path(exists=True, path_type=Path))
@click.option(
    "--simulations",
    "-n",
    type=int,
    default=1000,
    help="Number of simulations to run (default: 1000).",
)
@click.option(
    "--seed",
    type=int,
    default=None,
    help="Random seed for reproducibility.",
)
@click.option(
    "--spending-strategy",
    type=click.Choice([s.value for s in SpendingStrategy]),
    default=None,
    help="Override the spending strategy.",
)
@click.option(
    "--withdrawal-rate",
    type=float,
    default=None,
    help="Override withdrawal rate (e.g., 0.04 for 4%).",
)
def monte_carlo(
    portfolio_file: Path,
    simulations: int,
    seed: int | None,
    spending_strategy: str | None,
    withdrawal_rate: float | None,
) -> None:
    """Run Monte Carlo simulation to assess portfolio survival probability."""
    try:
        portfolio = load_portfolio(str(portfolio_file))
    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)

    if spending_strategy:
        portfolio.config.spending_strategy = SpendingStrategy(spending_strategy)

    if withdrawal_rate is not None:
        portfolio.config.withdrawal_rate = withdrawal_rate

    click.echo(f"Running {simulations} Monte Carlo simulations...")
    result = run_monte_carlo(portfolio, num_simulations=simulations, seed=seed)
    click.echo()
    click.echo(format_monte_carlo_result(result, portfolio))


if __name__ == "__main__":
    main()
