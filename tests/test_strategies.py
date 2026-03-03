"""Tests for spending strategies."""

import pytest

from retirement_model.models import GuardrailsConfig, SpendingStrategy
from retirement_model.strategies import (
    SpendingState,
    calculate_spending_target,
    create_initial_state,
)


class TestCreateInitialState:
    def test_basic_state(self):
        state = create_initial_state(100000, 2000000)
        assert state.initial_spending == 100000
        assert state.current_spending == 100000
        assert state.initial_balance == 2000000

    def test_with_guardrails_config(self):
        config = GuardrailsConfig(initial_withdrawal_rate=0.05)
        state = create_initial_state(100000, 2000000, config)
        assert state.guardrails_config == config


class TestFixedDollarSpending:
    def test_first_year(self):
        state = create_initial_state(100000, 2000000)
        spending, new_state = calculate_spending_target(
            SpendingStrategy.FIXED_DOLLAR,
            year_idx=0,
            total_balance=2000000,
            age_primary=65,
            inflation_rate=0.03,
            state=state,
        )
        assert spending == 100000

    def test_with_inflation(self):
        state = create_initial_state(100000, 2000000)
        # First year
        _, state = calculate_spending_target(
            SpendingStrategy.FIXED_DOLLAR, 0, 2000000, 65, 0.03, state
        )
        # Second year
        spending, _ = calculate_spending_target(
            SpendingStrategy.FIXED_DOLLAR, 1, 2100000, 66, 0.03, state
        )
        assert spending == pytest.approx(103000, rel=0.01)


class TestPercentOfPortfolioSpending:
    def test_basic_percentage(self):
        state = create_initial_state(100000, 2000000)
        spending, _ = calculate_spending_target(
            SpendingStrategy.PERCENT_OF_PORTFOLIO,
            0,
            2000000,
            65,
            0.03,
            state,
            withdrawal_rate=0.04,
        )
        assert spending == 80000  # 4% of 2M

    def test_varies_with_balance(self):
        state = create_initial_state(100000, 2000000)
        spending_high, _ = calculate_spending_target(
            SpendingStrategy.PERCENT_OF_PORTFOLIO,
            0,
            3000000,
            65,
            0.03,
            state,
            withdrawal_rate=0.04,
        )
        assert spending_high == 120000  # 4% of 3M

        spending_low, _ = calculate_spending_target(
            SpendingStrategy.PERCENT_OF_PORTFOLIO,
            0,
            1000000,
            65,
            0.03,
            state,
            withdrawal_rate=0.04,
        )
        assert spending_low == 40000  # 4% of 1M

    def test_uses_withdrawal_rate_not_guardrails_config(self):
        config = GuardrailsConfig(initial_withdrawal_rate=0.10)
        state = create_initial_state(100000, 2000000, config)
        spending, _ = calculate_spending_target(
            SpendingStrategy.PERCENT_OF_PORTFOLIO,
            0,
            2000000,
            65,
            0.03,
            state,
            withdrawal_rate=0.04,
        )
        # Should use withdrawal_rate (4%), not guardrails_config (10%)
        assert spending == 80000

    def test_custom_withdrawal_rate(self):
        state = create_initial_state(100000, 2000000)
        spending, _ = calculate_spending_target(
            SpendingStrategy.PERCENT_OF_PORTFOLIO,
            0,
            2000000,
            65,
            0.03,
            state,
            withdrawal_rate=0.06,
        )
        assert spending == 120000  # 6% of 2M


class TestGuardrailsSpending:
    def test_first_year(self):
        config = GuardrailsConfig(
            initial_withdrawal_rate=0.05,
            floor_percent=0.80,
            ceiling_percent=1.20,
            adjustment_percent=0.10,
        )
        state = create_initial_state(100000, 2000000, config)
        spending, new_state = calculate_spending_target(
            SpendingStrategy.GUARDRAILS, 0, 2000000, 65, 0.03, state
        )
        assert spending == 100000  # 5% of 2M

    def test_triggers_ceiling_cut(self):
        config = GuardrailsConfig(
            initial_withdrawal_rate=0.05,
            floor_percent=0.80,
            ceiling_percent=1.20,
            adjustment_percent=0.10,
        )
        state = create_initial_state(100000, 2000000, config)

        # Year 0
        _, state = calculate_spending_target(
            SpendingStrategy.GUARDRAILS, 0, 2000000, 65, 0.03, state
        )

        # Year 1 with significant portfolio drop
        # Current spending would be 103000 (inflated), but portfolio is now 1500000
        # Rate would be 103000/1500000 = 6.87%, ceiling is 6% (120% of 5%)
        spending, _ = calculate_spending_target(
            SpendingStrategy.GUARDRAILS, 1, 1500000, 66, 0.03, state
        )
        # Should reduce by 10%
        assert spending < 103000

    def test_triggers_floor_increase(self):
        config = GuardrailsConfig(
            initial_withdrawal_rate=0.05,
            floor_percent=0.80,
            ceiling_percent=1.20,
            adjustment_percent=0.10,
        )
        state = create_initial_state(100000, 2000000, config)

        # Year 0
        _, state = calculate_spending_target(
            SpendingStrategy.GUARDRAILS, 0, 2000000, 65, 0.03, state
        )

        # Year 1 with significant portfolio growth
        # Current spending would be 103000 (inflated), portfolio is now 3500000
        # Rate would be 103000/3500000 = 2.94%, floor is 4% (80% of 5%)
        spending, _ = calculate_spending_target(
            SpendingStrategy.GUARDRAILS, 1, 3500000, 66, 0.03, state
        )
        # Should increase by 10%
        assert spending > 103000


class TestSpendingState:
    def test_state_tracking(self):
        state = SpendingState(
            initial_spending=100000,
            current_spending=100000,
            initial_balance=2000000,
        )
        assert state.initial_spending == 100000
        assert state.current_spending == 100000
        assert state.initial_balance == 2000000
        assert state.guardrails_config is None
