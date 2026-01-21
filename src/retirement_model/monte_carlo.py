"""Monte Carlo simulation for retirement portfolio analysis."""

import copy
import random
from dataclasses import dataclass, field

from retirement_model.historical_returns import get_historical_inflation, get_historical_returns
from retirement_model.models import Portfolio, SpendingStrategy
from retirement_model.simulation import run_simulation
from retirement_model.strategies import calculate_spending_target, create_initial_state


@dataclass
class YearlyPercentiles:
    """Percentile data for a single year across all simulations."""

    age: int
    percentile_5: float
    percentile_25: float
    median: float
    percentile_75: float
    percentile_95: float


@dataclass
class MonteCarloResult:
    """Results from a Monte Carlo simulation run."""

    num_simulations: int
    success_rate: float
    median_final_balance: float
    percentile_5: float
    percentile_25: float
    percentile_75: float
    percentile_95: float
    depletion_ages: list[int]
    final_balances: list[float]
    yearly_percentiles: list[YearlyPercentiles] = field(default_factory=list)

    @property
    def failure_rate(self) -> float:
        return 1.0 - self.success_rate

    def depletion_risk_by_age(self, age: int) -> float:
        """Calculate probability of portfolio depletion before a given age."""
        if not self.depletion_ages:
            return 0.0
        depleted_before = sum(1 for a in self.depletion_ages if a <= age)
        return depleted_before / self.num_simulations


@dataclass
class SimulationPath:
    """A single simulation path through the Monte Carlo."""

    returns_sequence: list[float]
    inflation_sequence: list[float]
    final_balance: float
    depleted: bool
    depletion_age: int | None = None
    year_balances: list[float] = field(default_factory=list)


def sample_historical_sequence(
    num_years: int, returns: list[float], inflation: list[float], seed: int | None = None
) -> tuple[list[float], list[float]]:
    """
    Sample a sequence of returns and inflation from historical data.

    Uses block sampling to preserve some autocorrelation.
    """
    if seed is not None:
        random.seed(seed)

    n_historical = len(returns)
    sampled_returns = []
    sampled_inflation = []

    block_size = min(5, num_years)
    i = 0
    while i < num_years:
        start_idx = random.randint(0, n_historical - block_size)
        for j in range(block_size):
            if i + j >= num_years:
                break
            sampled_returns.append(returns[start_idx + j])
            sampled_inflation.append(inflation[start_idx + j])
        i += block_size

    return sampled_returns[:num_years], sampled_inflation[:num_years]


def run_single_simulation(
    portfolio: Portfolio,
    returns_sequence: list[float],
    inflation_sequence: list[float],
) -> SimulationPath:
    """
    Run a single simulation with a specific return and inflation sequence.

    Returns the simulation path with year-by-year balances.
    """
    cfg = portfolio.config
    accounts = copy.deepcopy(portfolio.accounts)

    year_balances = []
    depleted = False
    depletion_age = None

    initial_balance = sum(a.balance for a in accounts)
    spending_state = create_initial_state(
        initial_spending=cfg.annual_spend_net,
        initial_balance=initial_balance,
        guardrails_config=(
            cfg.guardrails_config if cfg.spending_strategy == SpendingStrategy.GUARDRAILS else None
        ),
    )

    for year_idx in range(cfg.simulation_years):
        age_primary = cfg.current_age_primary + year_idx

        current_balance = sum(a.balance for a in accounts)
        year_balances.append(current_balance)

        if current_balance <= 0:
            depleted = True
            depletion_age = age_primary
            break

        growth_rate = returns_sequence[year_idx] if year_idx < len(returns_sequence) else 0.06
        inflation_rate = (
            inflation_sequence[year_idx] if year_idx < len(inflation_sequence) else 0.03
        )

        spending_target, spending_state = calculate_spending_target(
            cfg.spending_strategy,
            year_idx,
            current_balance,
            age_primary,
            inflation_rate,
            spending_state,
        )

        for acc in accounts:
            withdrawal_amount = min(acc.balance, spending_target * (acc.balance / current_balance))
            acc.balance -= withdrawal_amount
            spending_target -= withdrawal_amount
            if spending_target <= 0:
                break

        for acc in accounts:
            acc.balance *= 1 + growth_rate

    final_balance = sum(a.balance for a in accounts)

    return SimulationPath(
        returns_sequence=returns_sequence,
        inflation_sequence=inflation_sequence,
        final_balance=final_balance,
        depleted=depleted,
        depletion_age=depletion_age,
        year_balances=year_balances,
    )


def run_monte_carlo(
    portfolio: Portfolio,
    num_simulations: int = 1000,
    seed: int | None = None,
    use_historical: bool = True,
) -> MonteCarloResult:
    """
    Run Monte Carlo simulation on a portfolio.

    Args:
        portfolio: The portfolio to simulate
        num_simulations: Number of simulations to run
        seed: Random seed for reproducibility
        use_historical: If True, sample from historical returns; otherwise use normal distribution
    """
    if seed is not None:
        random.seed(seed)

    historical_returns = get_historical_returns()
    historical_inflation = get_historical_inflation()

    paths: list[SimulationPath] = []
    final_balances: list[float] = []
    depletion_ages: list[int] = []
    successful = 0

    for i in range(num_simulations):
        sim_seed = seed + i if seed is not None else None

        if use_historical:
            returns_seq, inflation_seq = sample_historical_sequence(
                portfolio.config.simulation_years,
                historical_returns,
                historical_inflation,
                sim_seed,
            )
        else:
            if sim_seed is not None:
                random.seed(sim_seed)
            returns_seq = [
                random.gauss(0.07, 0.15) for _ in range(portfolio.config.simulation_years)
            ]
            inflation_seq = [
                random.gauss(0.03, 0.015) for _ in range(portfolio.config.simulation_years)
            ]

        path = run_single_simulation(portfolio, returns_seq, inflation_seq)
        paths.append(path)
        final_balances.append(path.final_balance)

        if path.depleted and path.depletion_age is not None:
            depletion_ages.append(path.depletion_age)
        else:
            successful += 1

    final_balances.sort()
    n = len(final_balances)

    # Calculate year-by-year percentiles
    yearly_percentiles = _calculate_yearly_percentiles(
        paths, portfolio.config.simulation_years, portfolio.config.current_age_primary
    )

    return MonteCarloResult(
        num_simulations=num_simulations,
        success_rate=successful / num_simulations,
        median_final_balance=final_balances[n // 2],
        percentile_5=final_balances[int(n * 0.05)],
        percentile_25=final_balances[int(n * 0.25)],
        percentile_75=final_balances[int(n * 0.75)],
        percentile_95=final_balances[int(n * 0.95)],
        depletion_ages=depletion_ages,
        final_balances=final_balances,
        yearly_percentiles=yearly_percentiles,
    )


def _calculate_yearly_percentiles(
    paths: list[SimulationPath], num_years: int, start_age: int
) -> list[YearlyPercentiles]:
    """Calculate percentile distributions for each year across all simulation paths."""
    yearly_percentiles = []

    for year_idx in range(num_years):
        # Collect balances for this year from all paths (use 0 if path ended early)
        year_balances = []
        for path in paths:
            if year_idx < len(path.year_balances):
                year_balances.append(path.year_balances[year_idx])
            else:
                year_balances.append(0.0)

        year_balances.sort()
        n = len(year_balances)

        yearly_percentiles.append(
            YearlyPercentiles(
                age=start_age + year_idx,
                percentile_5=year_balances[int(n * 0.05)],
                percentile_25=year_balances[int(n * 0.25)],
                median=year_balances[n // 2],
                percentile_75=year_balances[int(n * 0.75)],
                percentile_95=year_balances[int(n * 0.95)],
            )
        )

    return yearly_percentiles


def _format_currency(value: float) -> str:
    """Format currency values in a compact way."""
    if value >= 1_000_000:
        return f"${value / 1_000_000:.2f}M"
    elif value >= 1_000:
        return f"${value / 1_000:.0f}K"
    else:
        return f"${value:.0f}"


def format_monte_carlo_result(result: MonteCarloResult, portfolio: Portfolio) -> str:
    """Format Monte Carlo results for display."""
    lines = [
        f"Monte Carlo Results ({result.num_simulations} simulations)",
        "=" * 80,
        "",
        f"Success Rate: {result.success_rate * 100:.1f}%",
        f"Failure Rate: {result.failure_rate * 100:.1f}%",
        "",
    ]

    if result.depletion_ages:
        lines.append("Risk of Depletion Before Age:")
        start_age = portfolio.config.current_age_primary
        for target_age in [80, 85, 90, 95]:
            if target_age > start_age:
                risk = result.depletion_risk_by_age(target_age)
                lines.append(f"  Age {target_age}: {risk * 100:.1f}%")
        lines.append("")

    # Year-by-year percentile table
    lines.append("Year-by-Year Balance Distribution:")
    lines.append("-" * 80)
    lines.append(
        f"{'Age':<5} {'5th %ile':>12} {'25th %ile':>12} {'Median':>12} "
        f"{'75th %ile':>12} {'95th %ile':>12}"
    )
    lines.append("-" * 80)

    for yp in result.yearly_percentiles:
        lines.append(
            f"{yp.age:<5} {_format_currency(yp.percentile_5):>12} "
            f"{_format_currency(yp.percentile_25):>12} {_format_currency(yp.median):>12} "
            f"{_format_currency(yp.percentile_75):>12} {_format_currency(yp.percentile_95):>12}"
        )

    lines.append("-" * 80)

    return "\n".join(lines)
