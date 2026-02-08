"""Main simulation orchestration for retirement portfolio projections."""

import copy

from retirement_model.models import (
    AccountType,
    ConversionStrategy,
    Owner,
    PlannedExpense,
    Portfolio,
    SimulationResult,
    SpendingStrategy,
    YearResult,
)
from retirement_model.social_security import generate_ss_streams
from retirement_model.strategies import calculate_spending_target, create_initial_state
from retirement_model.taxes import (
    calculate_capital_gains_tax,
    calculate_irmaa_cost,
    calculate_rmd_amount,
    get_bracket_label,
    get_marginal_tax_rate,
)
from retirement_model.withdrawals import (
    apply_growth,
    deposit_to_account,
    get_total_balance_by_owner,
    get_total_balance_by_type,
    withdraw_from_accounts,
)


def get_conversion_ceiling(strategy: ConversionStrategy, irmaa_tier_1_limit: float) -> float:
    """Get the AGI ceiling for Roth conversions based on strategy."""
    match strategy:
        case ConversionStrategy.BRACKET_24:
            return 383900
        case ConversionStrategy.BRACKET_22:
            return 201050
        case ConversionStrategy.IRMAA_TIER_1:
            return irmaa_tier_1_limit
        case ConversionStrategy.STANDARD:
            return 0
        case _:
            return 0


def calculate_planned_expenses(
    expenses: list[PlannedExpense],
    year: int,
    age_primary: int,
    base_inflation_factor: float,
) -> float:
    """Calculate total planned expenses for a given year."""
    total = 0.0
    for expense in expenses:
        applies = False

        if expense.expense_type == "one_time" and expense.year == year:
            applies = True
        elif expense.expense_type == "recurring":
            start = expense.start_age or 0
            end = expense.end_age or 150
            if start <= age_primary <= end:
                applies = True

        if applies:
            amount = expense.amount
            if expense.inflation_adjusted:
                amount *= base_inflation_factor
            total += amount

    return total


def run_simulation(
    portfolio: Portfolio,
    returns_sequence: list[float] | None = None,
    inflation_sequence: list[float] | None = None,
) -> SimulationResult:
    """Run the retirement simulation and return year-by-year results.

    Args:
        portfolio: The portfolio to simulate
        returns_sequence: Optional list of annual returns for each year (for Monte Carlo)
        inflation_sequence: Optional list of inflation rates for each year (for Monte Carlo)
    """
    cfg = portfolio.config
    accounts = copy.deepcopy(portfolio.accounts)
    results: list[YearResult] = []

    # SS auto-generation: if ss_auto is set, generate streams and skip legacy SS
    use_legacy_ss = True
    if cfg.ss_auto is not None:
        ss_streams = generate_ss_streams(cfg.ss_auto)
        working_streams = ss_streams + list(cfg.income_streams)
        use_legacy_ss = False
    else:
        working_streams = list(cfg.income_streams)

    conversion_ceiling = get_conversion_ceiling(cfg.strategy_target, cfg.irmaa_limit_tier_1)

    initial_balance = sum(a.balance for a in accounts)
    spending_state = create_initial_state(
        initial_spending=cfg.annual_spend_net,
        initial_balance=initial_balance,
        guardrails_config=(
            cfg.guardrails_config if cfg.spending_strategy == SpendingStrategy.GUARDRAILS else None
        ),
    )
    # For percent_of_portfolio, set the rate from config
    if cfg.spending_strategy == SpendingStrategy.PERCENT_OF_PORTFOLIO:
        from retirement_model.models import GuardrailsConfig

        spending_state.guardrails_config = GuardrailsConfig(
            initial_withdrawal_rate=cfg.withdrawal_rate
        )

    # Track cumulative inflation for expense adjustments
    cumulative_inflation = 1.0

    for year_idx in range(cfg.simulation_years):
        age_primary = cfg.current_age_primary + year_idx
        age_spouse = cfg.current_age_spouse + year_idx
        current_year = cfg.start_year + year_idx
        age_map = {"primary": age_primary, "spouse": age_spouse, "joint": age_primary}

        # Get this year's rates (from sequence or config defaults)
        year_inflation = (
            inflation_sequence[year_idx]
            if inflation_sequence and year_idx < len(inflation_sequence)
            else cfg.inflation_rate
        )
        year_return = (
            returns_sequence[year_idx]
            if returns_sequence and year_idx < len(returns_sequence)
            else cfg.investment_growth_rate
        )

        # Calculate current total balance for spending strategies that need it
        current_total_balance = sum(a.balance for a in accounts)

        # Calculate spending target based on strategy
        base_spending, spending_state = calculate_spending_target(
            cfg.spending_strategy,
            year_idx,
            current_total_balance,
            age_primary,
            year_inflation,
            spending_state,
        )

        # Update cumulative inflation for this year
        if year_idx > 0:
            cumulative_inflation *= 1 + year_inflation
        inflation_factor = cumulative_inflation
        planned_expense_amount = calculate_planned_expenses(
            cfg.planned_expenses, current_year, age_primary, inflation_factor
        )
        total_spend_needed = base_spending + planned_expense_amount

        # Social Security income (legacy path, skipped when ss_auto generates streams)
        ss_income = 0.0
        if use_legacy_ss:
            if age_primary >= cfg.social_security.primary_start_age:
                ss_income += cfg.social_security.primary_benefit
            if age_spouse >= cfg.social_security.spouse_start_age:
                ss_income += cfg.social_security.spouse_benefit

        # Additional income streams (pensions, annuities, rental income, etc.)
        stream_income = 0.0
        stream_taxable = 0.0
        for stream in working_streams:
            in_range = age_primary >= stream.start_age
            if stream.end_age is not None:
                in_range = in_range and age_primary <= stream.end_age
            if in_range:
                years_active = age_primary - stream.start_age
                cola_factor = (1 + stream.cola_rate) ** years_active if stream.cola_rate else 1.0
                adjusted = stream.amount * cola_factor
                stream_income += adjusted
                stream_taxable += adjusted * stream.taxable_pct

        current_agi = ss_income * 0.85 + stream_taxable

        # Mandatory RMDs
        pretax_bal_primary = get_total_balance_by_owner(accounts, AccountType.PRETAX, Owner.PRIMARY)
        rmd_primary = calculate_rmd_amount(age_primary, pretax_bal_primary, cfg.rmd_start_age)

        pretax_bal_spouse = get_total_balance_by_owner(accounts, AccountType.PRETAX, Owner.SPOUSE)
        rmd_spouse = calculate_rmd_amount(age_spouse, pretax_bal_spouse, cfg.rmd_start_age)

        total_rmd = rmd_primary + rmd_spouse
        rmd_result = withdraw_from_accounts(total_rmd, accounts, AccountType.PRETAX, age_map)
        current_agi += rmd_result.amount_withdrawn

        # Estimate tax rate for withholding
        est_tax_rate = (
            get_marginal_tax_rate(current_agi, cfg.tax_brackets_federal or None)
            + cfg.tax_rate_state
        )

        # Cash from SS, income streams, and RMD (net of estimated tax)
        cash_from_ss = ss_income * (1 - est_tax_rate)
        cash_from_streams = stream_income * (1 - est_tax_rate)
        cash_from_rmd = rmd_result.amount_withdrawn * (1 - est_tax_rate)
        cash_in_hand = cash_from_ss + cash_from_streams + cash_from_rmd

        remaining_spend = max(0, total_spend_needed - cash_in_hand)
        surplus_cash = max(0, cash_in_hand - total_spend_needed)

        brokerage_withdrawn = 0.0
        roth_withdrawn = 0.0
        voluntary_pretax = 0.0
        converted_amount = 0.0
        conversion_tax_paid = 0.0
        brokerage_gains_tax = 0.0

        # Spending logic
        if remaining_spend > 0:
            agi_headroom = max(0, conversion_ceiling - current_agi) if conversion_ceiling > 0 else 0

            if conversion_ceiling == 0:
                max_safe_brokerage = remaining_spend
            else:
                max_safe_brokerage = agi_headroom / 0.75 if agi_headroom > 0 else 0

            amount_from_brokerage = min(remaining_spend, max_safe_brokerage)

            if amount_from_brokerage > 0:
                result = withdraw_from_accounts(
                    amount_from_brokerage, accounts, AccountType.BROKERAGE, age_map
                )
                brokerage_withdrawn += result.amount_withdrawn

                gains = result.amount_withdrawn * (1 - result.average_basis_ratio)
                current_agi += gains
                brokerage_gains_tax += calculate_capital_gains_tax(
                    gains, current_agi, cfg.tax_rate_capital_gains
                )
                remaining_spend -= result.amount_withdrawn

            # Use Roth if still needed (doesn't affect AGI)
            if remaining_spend > 1.0:
                result = withdraw_from_accounts(
                    remaining_spend, accounts, AccountType.ROTH, age_map
                )
                roth_withdrawn += result.amount_withdrawn
                remaining_spend -= result.amount_withdrawn

            # Use pre-tax as last resort
            if remaining_spend > 1.0:
                gross_need = remaining_spend / (1 - est_tax_rate)
                result = withdraw_from_accounts(gross_need, accounts, AccountType.PRETAX, age_map)
                voluntary_pretax += result.amount_withdrawn
                current_agi += result.amount_withdrawn
                remaining_spend = 0

        # Roth conversion logic (only pre-RMD age)
        if conversion_ceiling > 0 and age_primary < cfg.rmd_start_age:
            agi_headroom = max(0, conversion_ceiling - current_agi)

            if agi_headroom > 5000:
                available_pretax = get_total_balance_by_type(accounts, AccountType.PRETAX)
                conversion_target = min(agi_headroom, available_pretax)

                if conversion_target > 0:
                    tax_bill = conversion_target * est_tax_rate
                    conversion_tax_paid = tax_bill

                    # Pay tax from brokerage
                    tax_result = withdraw_from_accounts(
                        tax_bill, accounts, AccountType.BROKERAGE, age_map
                    )
                    brokerage_withdrawn += tax_result.amount_withdrawn

                    # AGI impact from paying tax (gains on the withdrawal)
                    tax_gains = tax_result.amount_withdrawn * (1 - tax_result.average_basis_ratio)
                    current_agi += tax_gains
                    brokerage_gains_tax += calculate_capital_gains_tax(
                        tax_gains, current_agi, cfg.tax_rate_capital_gains
                    )

                    # Execute conversion
                    conv_result = withdraw_from_accounts(
                        conversion_target, accounts, AccountType.PRETAX, age_map
                    )

                    # If brokerage ran out, net the unpaid tax from deposit
                    if tax_result.amount_withdrawn < tax_bill:
                        net_deposit = conv_result.amount_withdrawn - (
                            tax_bill - tax_result.amount_withdrawn
                        )
                    else:
                        net_deposit = conv_result.amount_withdrawn

                    deposit_to_account(net_deposit, accounts, AccountType.ROTH, Owner.PRIMARY)
                    converted_amount += conv_result.amount_withdrawn
                    current_agi += conv_result.amount_withdrawn

        # Reinvest surplus
        if surplus_cash > 0:
            deposit_to_account(surplus_cash, accounts, AccountType.BROKERAGE, Owner.JOINT)

        # Total tax calculation
        taxable_income = max(0, current_agi - 30000)
        income_tax = taxable_income * est_tax_rate
        irmaa_cost = calculate_irmaa_cost(current_agi)
        total_tax = income_tax + brokerage_gains_tax + irmaa_cost

        # Apply growth and get balances
        total_balance = apply_growth(accounts, year_return)

        results.append(
            YearResult(
                year=current_year,
                age_primary=age_primary,
                age_spouse=age_spouse,
                agi=round(current_agi),
                bracket=get_bracket_label(current_agi),
                rmd=round(total_rmd),
                surplus=round(surplus_cash),
                roth_conversion=round(converted_amount),
                conversion_tax=round(conversion_tax_paid),
                pretax_withdrawal=round(voluntary_pretax),
                roth_withdrawal=round(roth_withdrawn),
                brokerage_withdrawal=round(brokerage_withdrawn),
                total_tax=round(total_tax),
                irmaa_cost=irmaa_cost,
                total_balance=round(total_balance),
                spending_target=round(total_spend_needed),
                pretax_balance=round(get_total_balance_by_type(accounts, AccountType.PRETAX)),
                roth_balance=round(get_total_balance_by_type(accounts, AccountType.ROTH)),
                brokerage_balance=round(get_total_balance_by_type(accounts, AccountType.BROKERAGE)),
            )
        )

    return SimulationResult(
        strategy=cfg.strategy_target,
        spending_strategy=cfg.spending_strategy,
        years=results,
    )
