"""Main simulation orchestration for retirement portfolio projections."""

import copy

from retirement_model.constants import (
    CAPITAL_GAINS_BRACKETS_MFJ,
    FEDERAL_TAX_BRACKETS_MFJ,
    IRMAA_TIERS_MFJ,
    STANDARD_DEDUCTION_MFJ,
    BracketDict,
)
from retirement_model.models import (
    LIMIT_401K_CATCHUP_50,
    LIMIT_401K_UNDER_50,
    LIMIT_IRA_CATCHUP_50,
    LIMIT_IRA_UNDER_50,
    ROTH_IRA_MAGI_PHASEOUT_MFJ,
    WITHDRAWAL_TO_TAX,
    Account,
    AccountType,
    AccountWithdrawal,
    ConversionStrategy,
    ExcessIncomeRouting,
    IncomeDetail,
    IncomeKind,
    Owner,
    PlannedExpense,
    Portfolio,
    SimulationResult,
    SpendingStrategy,
    TaxCategory,
    WithdrawalCategory,
    YearResult,
    is_conversion_eligible,
)
from retirement_model.social_security import generate_ss_streams
from retirement_model.strategies import calculate_spending_target, create_initial_state
from retirement_model.taxes import (
    calculate_capital_gains_tax,
    calculate_income_tax,
    calculate_irmaa_cost,
    calculate_rmd_amount,
    calculate_ss_taxable_portion,
    get_bracket_label,
    get_marginal_tax_rate,
    inflate_brackets,
)
from retirement_model.withdrawals import (
    WithdrawalResult,
    apply_growth,
    deposit_to_account,
    get_eligible_pretax_balance,
    get_total_balance_by_category,
    get_total_balance_by_owner,
    get_total_balance_by_type,
    withdraw_from_accounts,
    withdraw_from_eligible_pretax,
)

EXCESS_INCOME_ACCOUNT_ID = "excess_income"


def _collect_details(
    result: WithdrawalResult,
    purpose: str,
    account_names: dict[str, str],
) -> list[AccountWithdrawal]:
    """Convert a WithdrawalResult's per_account dict into AccountWithdrawal entries."""
    if not result.per_account:
        return []
    return [
        AccountWithdrawal(
            account_id=aid,
            account_name=account_names.get(aid, aid),
            amount=round(amt),
            purpose=purpose,
        )
        for aid, amt in result.per_account.items()
        if amt > 0
    ]


def _deposit_excess_income(amount: float, accounts: list[Account]) -> None:
    """Deposit surplus cash to the excess_income brokerage account with 100% cost basis."""
    if amount <= 0:
        return
    for acc in accounts:
        if acc.id == EXCESS_INCOME_ACCOUNT_ID:
            old_basis = acc.balance * acc.cost_basis_ratio
            acc.balance += amount
            acc.cost_basis_ratio = (old_basis + amount) / acc.balance
            return
    accounts.append(
        Account(
            id=EXCESS_INCOME_ACCOUNT_ID,
            name="Excess Income",
            balance=amount,
            type=AccountType.BROKERAGE,
            owner=Owner.JOINT,
            cost_basis_ratio=1.0,
        )
    )


def _route_surplus(
    amount: float,
    accounts: list[Account],
    routing: ExcessIncomeRouting,
    owner_age: int,
    current_agi: float,
    has_employment_income: bool,
) -> None:
    """Route surplus income through IRA/Roth IRA waterfall before brokerage fallback."""
    if amount <= 0:
        return
    remaining = amount
    ira_limit = LIMIT_IRA_CATCHUP_50 if owner_age >= 50 else LIMIT_IRA_UNDER_50

    if routing == ExcessIncomeRouting.ROTH_IRA_FIRST and has_employment_income:
        if current_agi < ROTH_IRA_MAGI_PHASEOUT_MFJ:
            roth_deposit = min(remaining, ira_limit)
            deposit_to_account(roth_deposit, accounts, AccountType.ROTH_IRA, Owner.PRIMARY)
            remaining -= roth_deposit
        # Shared IRA limit: Roth IRA deposit consumed the limit, no traditional IRA
    elif routing == ExcessIncomeRouting.IRA_FIRST and has_employment_income:
        ira_deposit = min(remaining, ira_limit)
        deposit_to_account(ira_deposit, accounts, AccountType.IRA, Owner.PRIMARY)
        remaining -= ira_deposit

    if remaining > 0:
        _deposit_excess_income(remaining, accounts)


def get_conversion_ceiling(
    strategy: ConversionStrategy, irmaa_tier_1_limit: float, inflation_factor: float = 1.0
) -> float:
    """Get the AGI ceiling for Roth conversions based on strategy."""
    match strategy:
        case ConversionStrategy.BRACKET_24:
            return 383900 * inflation_factor
        case ConversionStrategy.BRACKET_22:
            return 201050 * inflation_factor
        case ConversionStrategy.IRMAA_TIER_1:
            return irmaa_tier_1_limit * inflation_factor
        case ConversionStrategy.STANDARD:
            return 0
        case _:
            return 0


def calculate_planned_expenses(
    expenses: list[PlannedExpense],
    year: int,
    base_inflation_factor: float,
) -> float:
    """Calculate total planned expenses for a given year."""
    total = 0.0
    for expense in expenses:
        applies = False

        if expense.expense_type == "one_time" and expense.year == year:
            applies = True
        elif expense.expense_type == "recurring":
            start = expense.start_year or 0
            end = expense.end_year or 9999
            if start <= year <= end:
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
    tax_regime_sequence: list[dict[str, object]] | None = None,
) -> SimulationResult:
    """Run the retirement simulation and return year-by-year results."""
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

    # Auto-create roth_conversion tracking account if conversions will happen
    has_conversion_strategy = cfg.strategy_target != ConversionStrategy.STANDARD
    has_eligible_ira = any(is_conversion_eligible(a.type) for a in accounts)
    if has_conversion_strategy and has_eligible_ira:
        existing_conv = any(a.type == AccountType.ROTH_CONVERSION for a in accounts)
        if not existing_conv:
            accounts.append(
                Account(
                    id="roth_conversions",
                    name="Roth Conversions",
                    balance=0.0,
                    type=AccountType.ROTH_CONVERSION,
                    owner=Owner.PRIMARY,
                    cost_basis_ratio=1.0,
                )
            )

    # Track cumulative inflation for expense adjustments
    cumulative_inflation = 1.0

    for year_idx in range(cfg.simulation_years):
        age_primary = cfg.current_age_primary + year_idx
        age_spouse = cfg.current_age_spouse + year_idx
        current_year = cfg.start_year + year_idx
        age_map = {"primary": age_primary, "spouse": age_spouse, "joint": age_primary}

        account_names = {a.id: a.name for a in accounts}
        withdrawal_details: list[AccountWithdrawal] = []

        # Get this year's rates (from sequence or config defaults)
        year_inflation = (
            inflation_sequence[year_idx]
            if inflation_sequence and year_idx < len(inflation_sequence)
            else cfg.inflation_rate
        )
        year_return = (
            returns_sequence[year_idx]
            if returns_sequence and year_idx < len(returns_sequence)
            else None
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
            withdrawal_rate=cfg.withdrawal_rate,
        )

        # Update cumulative inflation for this year
        if year_idx > 0:
            cumulative_inflation *= 1 + year_inflation
        inflation_factor = cumulative_inflation

        # Determine base tax parameters (regime sequence overrides defaults)
        if tax_regime_sequence and year_idx < len(tax_regime_sequence):
            regime = tax_regime_sequence[year_idx]
            base_fed: list[BracketDict] = regime["federal_brackets"]  # type: ignore[assignment]
            base_irmaa: list[BracketDict] = regime["irmaa_tiers"]  # type: ignore[assignment]
            base_capgains: list[BracketDict] = regime["capital_gains_brackets"]  # type: ignore[assignment]
            base_deduction: float = regime["standard_deduction"]  # type: ignore[assignment]
        elif cfg.tax_brackets_federal:
            base_fed = [{"limit": b.limit, "rate": b.rate} for b in cfg.tax_brackets_federal]
            base_irmaa = IRMAA_TIERS_MFJ
            base_capgains = CAPITAL_GAINS_BRACKETS_MFJ
            base_deduction = STANDARD_DEDUCTION_MFJ
        else:
            base_fed = FEDERAL_TAX_BRACKETS_MFJ
            base_irmaa = IRMAA_TIERS_MFJ
            base_capgains = CAPITAL_GAINS_BRACKETS_MFJ
            base_deduction = STANDARD_DEDUCTION_MFJ

        # Inflation-adjusted tax thresholds
        adj_fed_brackets = inflate_brackets(base_fed, inflation_factor)
        adj_irmaa_tiers = inflate_brackets(base_irmaa, inflation_factor)
        adj_capgains_brackets = inflate_brackets(base_capgains, inflation_factor)
        adj_deduction = base_deduction * inflation_factor
        conversion_ceiling = get_conversion_ceiling(
            cfg.strategy_target, cfg.irmaa_limit_tier_1, inflation_factor
        )

        planned_expense_amount = calculate_planned_expenses(
            cfg.planned_expenses, current_year, inflation_factor
        )
        total_spend_needed = base_spending + planned_expense_amount

        # Social Security income (legacy path, skipped when ss_auto generates streams)
        ss_income = 0.0
        income_details: list[IncomeDetail] = []
        if use_legacy_ss:
            if age_primary >= cfg.social_security.primary_start_age:
                ss_income += cfg.social_security.primary_benefit
                income_details.append(
                    IncomeDetail(
                        name="SS (primary)", amount=round(cfg.social_security.primary_benefit)
                    )
                )
            if age_spouse >= cfg.social_security.spouse_start_age:
                ss_income += cfg.social_security.spouse_benefit
                income_details.append(
                    IncomeDetail(
                        name="SS (spouse)", amount=round(cfg.social_security.spouse_benefit)
                    )
                )

        # Additional income streams (pensions, annuities, rental income, etc.)
        stream_income = 0.0
        gross_stream_income = 0.0
        total_pretax_401k = 0.0
        total_roth_401k = 0.0
        stream_taxable = 0.0
        has_employment_income = False
        for stream in working_streams:
            owner_age = age_spouse if stream.owner == Owner.SPOUSE else age_primary
            in_range = owner_age >= stream.start_age
            if stream.end_age is not None:
                in_range = in_range and owner_age <= stream.end_age
            if in_range:
                years_active = owner_age - stream.start_age
                cola_factor = (1 + stream.cola_rate) ** years_active if stream.cola_rate else 1.0
                adjusted = stream.amount * cola_factor

                # 401k contributions from employment income
                contrib_pretax = 0.0
                contrib_roth = 0.0
                if stream.kind == IncomeKind.EMPLOYMENT:
                    has_employment_income = True
                    limit = LIMIT_401K_CATCHUP_50 if owner_age >= 50 else LIMIT_401K_UNDER_50
                    contrib_pretax = min(stream.pretax_401k, limit)
                    remaining_limit = limit - contrib_pretax
                    contrib_roth = min(stream.roth_401k, remaining_limit)
                    total_pretax_401k += contrib_pretax
                    total_roth_401k += contrib_roth
                    if contrib_pretax > 0:
                        deposit_to_account(
                            contrib_pretax, accounts, AccountType.TRADITIONAL_401K, stream.owner
                        )
                    if contrib_roth > 0:
                        deposit_to_account(
                            contrib_roth, accounts, AccountType.ROTH_401K, stream.owner
                        )

                net_income = adjusted - contrib_pretax - contrib_roth
                net_taxable = adjusted * stream.taxable_pct - contrib_pretax
                stream_income += net_income
                gross_stream_income += adjusted
                stream_taxable += max(0, net_taxable)
                income_details.append(IncomeDetail(name=stream.name, amount=round(adjusted)))

        # SS taxable portion uses IRS tiered formula
        other_income_for_ss = stream_taxable
        ss_taxable = calculate_ss_taxable_portion(ss_income, other_income_for_ss)
        current_agi = ss_taxable + stream_taxable

        # Mandatory RMDs (from ALL pretax-category accounts)
        pretax_bal_primary = get_total_balance_by_owner(accounts, TaxCategory.PRETAX, Owner.PRIMARY)
        rmd_primary = calculate_rmd_amount(age_primary, pretax_bal_primary, cfg.rmd_start_age)

        pretax_bal_spouse = get_total_balance_by_owner(accounts, TaxCategory.PRETAX, Owner.SPOUSE)
        rmd_spouse = calculate_rmd_amount(age_spouse, pretax_bal_spouse, cfg.rmd_start_age)

        total_rmd = rmd_primary + rmd_spouse
        rmd_withdrawn = 0.0
        if rmd_primary > 0:
            rmd_res_p = withdraw_from_accounts(
                rmd_primary, accounts, TaxCategory.PRETAX, age_map, owner_filter=Owner.PRIMARY
            )
            rmd_withdrawn += rmd_res_p.amount_withdrawn
            withdrawal_details.extend(_collect_details(rmd_res_p, "rmd", account_names))
        if rmd_spouse > 0:
            rmd_res_s = withdraw_from_accounts(
                rmd_spouse, accounts, TaxCategory.PRETAX, age_map, owner_filter=Owner.SPOUSE
            )
            rmd_withdrawn += rmd_res_s.amount_withdrawn
            withdrawal_details.extend(_collect_details(rmd_res_s, "rmd", account_names))
        current_agi += rmd_withdrawn

        # Estimate tax rate for withholding (using inflation-adjusted brackets)
        est_tax_rate = get_marginal_tax_rate(current_agi, adj_fed_brackets) + cfg.tax_rate_state

        # Cash from SS, income streams, and RMD (net of estimated tax on taxable portion)
        cash_from_ss = ss_income - (ss_taxable * est_tax_rate)
        cash_from_streams = stream_income - (stream_taxable * est_tax_rate)
        cash_from_rmd = rmd_withdrawn * (1 - est_tax_rate)
        cash_in_hand = cash_from_ss + cash_from_streams + cash_from_rmd

        remaining_spend = max(0, total_spend_needed - cash_in_hand)
        surplus_cash = max(0, cash_in_hand - total_spend_needed)

        brokerage_withdrawn = 0.0
        roth_withdrawn = 0.0
        voluntary_pretax = 0.0
        converted_amount = 0.0
        conversion_tax_paid = 0.0
        conversion_tax_from_brokerage = 0.0
        brokerage_gains_tax = 0.0
        brokerage_gains_total = 0.0

        # Spending withdrawals in configurable order
        if remaining_spend > 0:
            agi_headroom = max(0, conversion_ceiling - current_agi) if conversion_ceiling > 0 else 0

            for cat in cfg.withdrawal_order:
                if remaining_spend <= 1.0:
                    break

                if cat == WithdrawalCategory.CASH:
                    result = withdraw_from_accounts(
                        remaining_spend, accounts, TaxCategory.CASH, age_map
                    )
                    brokerage_withdrawn += result.amount_withdrawn
                    withdrawal_details.extend(_collect_details(result, "spending", account_names))
                    remaining_spend -= result.amount_withdrawn

                elif cat == WithdrawalCategory.BROKERAGE:
                    if conversion_ceiling == 0:
                        max_safe = remaining_spend
                    else:
                        max_safe = agi_headroom / 0.75 if agi_headroom > 0 else 0
                    amount = min(remaining_spend, max_safe)
                    if amount > 1.0:
                        result = withdraw_from_accounts(
                            amount, accounts, TaxCategory.BROKERAGE, age_map
                        )
                        brokerage_withdrawn += result.amount_withdrawn
                        withdrawal_details.extend(
                            _collect_details(result, "spending", account_names)
                        )
                        gains = result.amount_withdrawn * (1 - result.average_basis_ratio)
                        brokerage_gains_total += gains
                        brokerage_gains_tax += calculate_capital_gains_tax(
                            gains, current_agi, adj_capgains_brackets
                        )
                        current_agi += gains
                        agi_headroom = (
                            max(0, conversion_ceiling - current_agi)
                            if conversion_ceiling > 0
                            else 0
                        )
                        remaining_spend -= result.amount_withdrawn

                elif cat == WithdrawalCategory.ROTH:
                    result = withdraw_from_accounts(
                        remaining_spend, accounts, TaxCategory.ROTH, age_map
                    )
                    roth_withdrawn += result.amount_withdrawn
                    withdrawal_details.extend(_collect_details(result, "spending", account_names))
                    remaining_spend -= result.amount_withdrawn

                elif cat == WithdrawalCategory.PRETAX:
                    gross_need = remaining_spend / (1 - est_tax_rate)
                    result = withdraw_from_accounts(
                        gross_need, accounts, TaxCategory.PRETAX, age_map
                    )
                    voluntary_pretax += result.amount_withdrawn
                    withdrawal_details.extend(_collect_details(result, "spending", account_names))
                    current_agi += result.amount_withdrawn
                    net_from_pretax = result.amount_withdrawn * (1 - est_tax_rate)
                    remaining_spend = max(0, remaining_spend - net_from_pretax)

        spending_limited = False
        if remaining_spend > 1.0:
            spending_limited = True
            actual_spend = total_spend_needed - remaining_spend
            total_spend_needed = actual_spend
            surplus_cash = 0.0

        # Roth conversion logic (from IRA-eligible accounts, skip when employed)
        if conversion_ceiling > 0 and not has_employment_income:
            agi_headroom = max(0, conversion_ceiling - current_agi)

            if agi_headroom > 5000:
                available_ira = get_eligible_pretax_balance(accounts)
                conversion_target = min(agi_headroom, available_ira)

                if conversion_target > 0:
                    tax_before = calculate_income_tax(
                        max(0, current_agi - adj_deduction), adj_fed_brackets, cfg.tax_rate_state
                    )
                    tax_after = calculate_income_tax(
                        max(0, current_agi + conversion_target - adj_deduction),
                        adj_fed_brackets,
                        cfg.tax_rate_state,
                    )
                    tax_bill = tax_after - tax_before

                    # Pay tax from brokerage/cash
                    tax_from_cash = withdraw_from_accounts(
                        tax_bill, accounts, TaxCategory.CASH, age_map
                    )
                    remaining_tax = tax_bill - tax_from_cash.amount_withdrawn
                    tax_result = withdraw_from_accounts(
                        remaining_tax, accounts, TaxCategory.BROKERAGE, age_map
                    )
                    total_tax_withdrawn = (
                        tax_from_cash.amount_withdrawn + tax_result.amount_withdrawn
                    )
                    conversion_tax_paid = total_tax_withdrawn
                    brokerage_withdrawn += total_tax_withdrawn
                    conversion_tax_from_brokerage += total_tax_withdrawn
                    withdrawal_details.extend(_collect_details(tax_from_cash, "tax", account_names))
                    withdrawal_details.extend(_collect_details(tax_result, "tax", account_names))

                    # AGI impact from brokerage gains (cash has no gains)
                    tax_gains = tax_result.amount_withdrawn * (1 - tax_result.average_basis_ratio)
                    brokerage_gains_total += tax_gains
                    brokerage_gains_tax += calculate_capital_gains_tax(
                        tax_gains, current_agi, adj_capgains_brackets
                    )
                    current_agi += tax_gains

                    # Execute conversion from IRA-eligible accounts only
                    conv_result = withdraw_from_eligible_pretax(
                        conversion_target, accounts, age_map, eligible_only=True
                    )
                    withdrawal_details.extend(
                        _collect_details(conv_result, "conversion", account_names)
                    )

                    # If brokerage/cash ran out, net the unpaid tax from deposit
                    if total_tax_withdrawn < tax_bill:
                        net_deposit = conv_result.amount_withdrawn - (
                            tax_bill - total_tax_withdrawn
                        )
                    else:
                        net_deposit = conv_result.amount_withdrawn

                    # Deposit net amount proportionally to each owner's Roth Conversion
                    owner_amounts: dict[Owner, float] = {}
                    for pa_id, pa_amt in conv_result.per_account.items():
                        acc = next(a for a in accounts if a.id == pa_id)
                        owner_amounts[acc.owner] = owner_amounts.get(acc.owner, 0.0) + pa_amt
                    for owner, amt in owner_amounts.items():
                        if conv_result.amount_withdrawn > 0:
                            owner_net = net_deposit * (amt / conv_result.amount_withdrawn)
                            deposit_to_account(
                                owner_net, accounts, AccountType.ROTH_CONVERSION, owner
                            )
                    converted_amount += conv_result.amount_withdrawn
                    current_agi += conv_result.amount_withdrawn

        # Reinvest surplus through configured routing waterfall
        if surplus_cash > 0:
            _route_surplus(
                surplus_cash,
                accounts,
                cfg.excess_income_routing,
                age_primary,
                current_agi,
                has_employment_income,
            )

        # Total tax calculation using progressive brackets.
        # Exclude brokerage gains (taxed separately via brokerage_gains_tax)
        # and conversion income (taxed separately via conversion_tax) from
        # ordinary income to avoid double-counting in the balance equation.
        ordinary_agi = current_agi - brokerage_gains_total - converted_amount
        taxable_income = max(0, ordinary_agi - adj_deduction)
        income_tax = calculate_income_tax(taxable_income, adj_fed_brackets, cfg.tax_rate_state)
        irmaa_cost = calculate_irmaa_cost(current_agi, adj_irmaa_tiers)
        total_tax = income_tax + brokerage_gains_tax

        # Withdraw for tax shortfall: non-conversion tax minus amounts already covered.
        # income_tax excludes conversion income (tracked separately as conversion_tax).
        # brokerage_gains_tax is added since gains require additional tax payment.
        estimated_withholding = (
            ss_taxable + stream_taxable + rmd_withdrawn + voluntary_pretax
        ) * est_tax_rate
        actual_tax_owed = income_tax + brokerage_gains_tax + irmaa_cost
        tax_shortfall = max(0, actual_tax_owed - estimated_withholding)

        # Over-withholding refund: estimated withholding exceeded actual tax liability.
        # Return the excess to surplus so the cash balance equation stays balanced.
        tax_refund = max(0, estimated_withholding - actual_tax_owed)
        if tax_refund > 1.0:
            surplus_cash += tax_refund
            _route_surplus(
                tax_refund,
                accounts,
                cfg.excess_income_routing,
                age_primary,
                current_agi,
                has_employment_income,
            )

        if tax_shortfall > 1.0:
            tax_order = cfg.withdrawal_order
            for cat in tax_order:
                if tax_shortfall <= 1.0:
                    break
                if cat == WithdrawalCategory.CASH:
                    result = withdraw_from_accounts(
                        tax_shortfall, accounts, TaxCategory.CASH, age_map
                    )
                    brokerage_withdrawn += result.amount_withdrawn
                    withdrawal_details.extend(_collect_details(result, "tax", account_names))
                    tax_shortfall -= result.amount_withdrawn
                elif cat == WithdrawalCategory.BROKERAGE:
                    result = withdraw_from_accounts(
                        tax_shortfall, accounts, TaxCategory.BROKERAGE, age_map
                    )
                    brokerage_withdrawn += result.amount_withdrawn
                    withdrawal_details.extend(_collect_details(result, "tax", account_names))
                    tax_shortfall -= result.amount_withdrawn
                elif cat == WithdrawalCategory.ROTH:
                    result = withdraw_from_accounts(
                        tax_shortfall, accounts, TaxCategory.ROTH, age_map
                    )
                    roth_withdrawn += result.amount_withdrawn
                    withdrawal_details.extend(_collect_details(result, "tax", account_names))
                    tax_shortfall -= result.amount_withdrawn
                elif cat == WithdrawalCategory.PRETAX:
                    result = withdraw_from_accounts(
                        tax_shortfall, accounts, TaxCategory.PRETAX, age_map
                    )
                    voluntary_pretax += result.amount_withdrawn
                    withdrawal_details.extend(_collect_details(result, "tax", account_names))
                    tax_shortfall -= result.amount_withdrawn

        # Apply growth and get balances
        total_balance = apply_growth(
            accounts, rate=year_return, conservative=cfg.conservative_growth
        )

        results.append(
            YearResult(
                year=current_year,
                age_primary=age_primary,
                age_spouse=age_spouse,
                agi=round(current_agi),
                bracket=get_bracket_label(current_agi, inflation_factor),
                rmd=round(total_rmd),
                surplus=round(surplus_cash),
                roth_conversion=round(converted_amount),
                conversion_tax=round(conversion_tax_paid),
                conversion_tax_from_brokerage=round(conversion_tax_from_brokerage),
                pretax_withdrawal=round(voluntary_pretax),
                roth_withdrawal=round(roth_withdrawn),
                brokerage_withdrawal=round(brokerage_withdrawn),
                total_tax=round(total_tax),
                brokerage_gains_tax=round(brokerage_gains_tax),
                irmaa_cost=irmaa_cost,
                total_balance=round(total_balance),
                spending_target=round(total_spend_needed),
                planned_expense=round(planned_expense_amount),
                total_income=round(ss_income + gross_stream_income),
                pretax_401k_deposit=round(total_pretax_401k),
                roth_401k_deposit=round(total_roth_401k),
                income_tax=round(income_tax),
                pretax_balance=round(get_total_balance_by_category(accounts, TaxCategory.PRETAX)),
                roth_balance=round(
                    get_total_balance_by_category(accounts, TaxCategory.ROTH)
                    - get_total_balance_by_type(accounts, AccountType.ROTH_CONVERSION)
                ),
                roth_conversion_balance=round(
                    get_total_balance_by_type(accounts, AccountType.ROTH_CONVERSION)
                ),
                brokerage_balance=round(
                    get_total_balance_by_category(accounts, TaxCategory.BROKERAGE)
                    + get_total_balance_by_category(accounts, TaxCategory.CASH)
                ),
                spending_limited=spending_limited,
                withdrawal_details=withdrawal_details,
                income_details=income_details,
            )
        )

        if total_balance <= 0:
            break

    return SimulationResult(
        strategy=cfg.strategy_target,
        spending_strategy=cfg.spending_strategy,
        years=results,
    )
