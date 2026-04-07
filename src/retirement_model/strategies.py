"""Spending strategies for retirement withdrawals."""

from dataclasses import dataclass

from retirement_model.models import GuardrailsConfig, SpendingStrategy


@dataclass
class SpendingState:
    """Tracks state across simulation years for dynamic spending strategies."""

    initial_spending: float
    current_spending: float
    initial_balance: float
    guardrails_config: GuardrailsConfig | None = None


def calculate_spending_target(
    strategy: SpendingStrategy,
    year_idx: int,
    total_balance: float,
    inflation_rate: float,
    state: SpendingState,
    withdrawal_rate: float = 0.04,
) -> tuple[float, SpendingState]:
    """
    Calculate the spending target for a given year based on the strategy.

    Returns (spending_target, updated_state).
    """
    match strategy:
        case SpendingStrategy.FIXED_DOLLAR:
            return _fixed_dollar_spending(year_idx, inflation_rate, state)

        case SpendingStrategy.PERCENT_OF_PORTFOLIO:
            return _percent_of_portfolio_spending(total_balance, withdrawal_rate, state)

        case SpendingStrategy.GUARDRAILS:
            return _guardrails_spending(year_idx, total_balance, inflation_rate, state)


def _fixed_dollar_spending(
    year_idx: int, inflation_rate: float, state: SpendingState
) -> tuple[float, SpendingState]:
    """Fixed dollar amount adjusted for inflation each year."""
    if year_idx == 0:
        spending = state.initial_spending
    else:
        spending = state.current_spending * (1 + inflation_rate)

    state.current_spending = spending
    return spending, state


def _percent_of_portfolio_spending(
    total_balance: float, withdrawal_rate: float, state: SpendingState
) -> tuple[float, SpendingState]:
    """Withdraw a fixed percentage of current portfolio value."""
    spending = total_balance * withdrawal_rate
    state.current_spending = spending
    return spending, state


def _guardrails_spending(
    year_idx: int, total_balance: float, inflation_rate: float, state: SpendingState
) -> tuple[float, SpendingState]:
    """
    Guyton-Klinger guardrails strategy.

    Adjusts spending based on portfolio performance relative to initial withdrawal rate.
    If current withdrawal rate exceeds ceiling, reduce spending.
    If current withdrawal rate falls below floor, increase spending.
    """
    if state.guardrails_config is None:
        state.guardrails_config = GuardrailsConfig()

    config = state.guardrails_config

    if year_idx == 0:
        spending = total_balance * config.initial_withdrawal_rate
        state.current_spending = spending
        state.initial_balance = total_balance
        return spending, state

    base_spending = state.current_spending * (1 + inflation_rate)
    current_rate = base_spending / total_balance if total_balance > 0 else 1.0

    floor_rate = config.initial_withdrawal_rate * config.floor_percent
    ceiling_rate = config.initial_withdrawal_rate * config.ceiling_percent

    if current_rate > ceiling_rate:
        spending = base_spending * (1 - config.adjustment_percent)
    elif current_rate < floor_rate:
        spending = base_spending * (1 + config.adjustment_percent)
    else:
        spending = base_spending

    state.current_spending = spending
    return spending, state


def create_initial_state(
    initial_spending: float,
    initial_balance: float,
    guardrails_config: GuardrailsConfig | None = None,
) -> SpendingState:
    """Create the initial spending state for a simulation."""
    return SpendingState(
        initial_spending=initial_spending,
        current_spending=initial_spending,
        initial_balance=initial_balance,
        guardrails_config=guardrails_config,
    )
