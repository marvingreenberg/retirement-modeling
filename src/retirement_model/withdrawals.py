"""Account withdrawal and deposit logic for retirement simulation."""

from dataclasses import dataclass

from retirement_model.constants import BOND_RETURN, CONSERVATIVE_GROWTH_FACTOR, EQUITY_RETURN
from retirement_model.models import (
    ACCOUNT_TYPE_DEFAULTS,
    BOND_TAX_DRAG,
    STOCK_TAX_DRAG,
    Account,
    AccountType,
    Owner,
    TaxCategory,
    tax_category,
)


@dataclass
class WithdrawalResult:
    """Result of a withdrawal operation."""

    amount_withdrawn: float
    average_basis_ratio: float
    per_account: dict[str, float] | None = None


def _owner_age_for_sort(acc: Account, owner_age_map: dict[str, int]) -> int:
    """Effective age for the pretax withdrawal sort key.

    Joint pretax accounts (rare; the editor disallows them via
    INDIVIDUAL_ONLY_TYPES, but the model technically allows the type) sort
    with the older spouse, consistent with how the per-spouse balance
    helper attributes joint pretax balances.
    """
    if acc.owner == Owner.JOINT:
        return max(
            owner_age_map.get(Owner.PRIMARY.value, 0),
            owner_age_map.get(Owner.SPOUSE.value, 0),
        )
    return owner_age_map.get(acc.owner.value, 0)


def _sorted_pretax_for_withdrawal(
    accounts: list[Account], owner_age_map: dict[str, int]
) -> list[Account]:
    """Return accounts ordered for pretax withdrawal: older owner first,
    then smaller balance first within the same owner.

    Drains the older spouse's pretax first (reduces future forced RMDs)
    and clears small "dust" accounts within an owner before larger ones.
    Non-pretax accounts are filtered out — callers still re-check the
    category in their loop, so it's safe.
    """
    return sorted(
        accounts,
        key=lambda a: (-_owner_age_for_sort(a, owner_age_map), a.balance),
    )


def withdraw_from_accounts(
    amount_needed: float,
    accounts: list[Account],
    category: TaxCategory,
    owner_age_map: dict[str, int],
    owner_filter: Owner | None = None,
) -> WithdrawalResult:
    """Withdraw from accounts matching a tax category.

    Returns the amount actually withdrawn and the weighted average cost basis ratio.
    Modifies account balances in place.
    When owner_filter is set, only withdraws from accounts owned by that owner.

    For PRETAX withdrawals, accounts are iterated in
    (owner age desc, balance asc) order. All other categories use the
    incoming list order.
    """
    if amount_needed <= 0:
        return WithdrawalResult(0.0, 0.0, {})

    remaining_need = amount_needed
    total_withdrawn = 0.0
    weighted_basis_accum = 0.0
    per_account: dict[str, float] = {}

    iter_accounts = (
        _sorted_pretax_for_withdrawal(accounts, owner_age_map)
        if category == TaxCategory.PRETAX
        else accounts
    )

    for acc in iter_accounts:
        if remaining_need <= 1.0:
            break
        if tax_category(acc.type) != category:
            continue
        if owner_filter is not None and acc.owner != owner_filter:
            continue

        current_age = owner_age_map.get(acc.owner.value, 0)
        if current_age < acc.available_at_age:
            continue

        withdrawal = min(acc.balance, remaining_need)
        acc.balance -= withdrawal
        remaining_need -= withdrawal
        total_withdrawn += withdrawal
        weighted_basis_accum += withdrawal * acc.cost_basis_ratio
        if withdrawal > 0:
            per_account[acc.id] = withdrawal

    avg_basis = weighted_basis_accum / total_withdrawn if total_withdrawn > 0 else 0.0
    return WithdrawalResult(total_withdrawn, avg_basis, per_account)


def withdraw_from_eligible_pretax(
    amount_needed: float,
    accounts: list[Account],
    owner_age_map: dict[str, int],
    eligible_only: bool = False,
) -> WithdrawalResult:
    """Withdraw from pre-tax accounts. When eligible_only=True, only IRA-category accounts.

    Iterates accounts in (owner age desc, balance asc) order — same rule as
    withdraw_from_accounts for the PRETAX category.
    """
    from retirement_model.models import is_conversion_eligible

    if amount_needed <= 0:
        return WithdrawalResult(0.0, 0.0, {})

    remaining_need = amount_needed
    total_withdrawn = 0.0
    weighted_basis_accum = 0.0
    per_account: dict[str, float] = {}

    for acc in _sorted_pretax_for_withdrawal(accounts, owner_age_map):
        if remaining_need <= 1.0:
            break
        if tax_category(acc.type) != TaxCategory.PRETAX:
            continue
        if eligible_only and not is_conversion_eligible(acc.type):
            continue

        current_age = owner_age_map.get(acc.owner.value, 0)
        if current_age < acc.available_at_age:
            continue

        withdrawal = min(acc.balance, remaining_need)
        acc.balance -= withdrawal
        remaining_need -= withdrawal
        total_withdrawn += withdrawal
        weighted_basis_accum += withdrawal * acc.cost_basis_ratio
        if withdrawal > 0:
            per_account[acc.id] = withdrawal

    avg_basis = weighted_basis_accum / total_withdrawn if total_withdrawn > 0 else 0.0
    return WithdrawalResult(total_withdrawn, avg_basis, per_account)


def deposit_to_account(
    amount: float,
    accounts: list[Account],
    account_type: AccountType,
    owner: Owner = Owner.JOINT,
) -> None:
    """Deposit money into an account of a specific type.

    If no matching account exists, creates a new one.
    Modifies accounts list in place.
    """
    if amount <= 0:
        return

    for acc in accounts:
        if acc.type == account_type and acc.owner == owner:
            acc.balance += amount
            return

    defaults = ACCOUNT_TYPE_DEFAULTS.get(account_type, {})
    new_account = Account(
        id=f"new_{account_type.value}",
        name=f"New {account_type.value}",
        balance=amount,
        type=account_type,
        owner=owner,
        cost_basis_ratio=defaults.get("cost_basis_ratio", 0.0),
    )
    accounts.append(new_account)


def calculate_tax_drag(stock_pct: float) -> float:
    """Compute annual tax drag for a brokerage account based on stock/bond allocation.

    Stocks generate ~1.5% dividend yield taxed at ~15% (qualified).
    Bonds generate ~4% yield taxed at ~25% (ordinary income).
    """
    s = stock_pct / 100.0
    return s * STOCK_TAX_DRAG + (1 - s) * BOND_TAX_DRAG


def account_growth_rate(stock_pct: float | None, account_type: AccountType) -> float:
    """Compute blended return from stock/bond allocation for an account."""
    if stock_pct is None:
        stock_pct = ACCOUNT_TYPE_DEFAULTS[account_type]["default_stock_pct"]
    s = float(stock_pct) / 100.0
    return s * EQUITY_RETURN + (1 - s) * BOND_RETURN


def apply_growth(
    accounts: list[Account],
    flat_rate: float | None = None,
    equity_rate: float | None = None,
    bond_rate: float | None = None,
    conservative: bool = False,
) -> float:
    """Apply investment growth to all accounts and return total balance.

    Three operating modes:

    - **Flat override** (flat_rate set): every non-cash account is grown
      at flat_rate. Used by the deterministic path when the user has
      set growth_rate_override.
    - **MC blend** (equity_rate or bond_rate set): each account blends
      the per-year sampled equity_rate / bond_rate using its own
      stock_pct. Either rate alone falls back to the constant for the
      missing leg (so MC can ship with sampled equity + constant bond
      and add sampled bonds later). Conservative multiplier is
      intentionally not applied in MC mode -- MC variance is its own
      conservatism.
    - **Deterministic per-account** (none set): each account is grown
      at account_growth_rate(stock_pct, type), with optional
      conservative scaling. The default path for single-run sims that
      don't override growth.

    Cash/CD accounts always get 0% growth. Brokerage accounts suffer
    tax drag (computed from stock_pct, unchanged by mode).
    """
    mc_mode = equity_rate is not None or bond_rate is not None
    eq = equity_rate if equity_rate is not None else EQUITY_RETURN
    bd = bond_rate if bond_rate is not None else BOND_RETURN
    total = 0.0
    for acc in accounts:
        if acc.type != AccountType.CASH_CD:
            is_brokerage = tax_category(acc.type) == TaxCategory.BROKERAGE

            if mc_mode:
                stock_pct = acc.stock_pct
                if stock_pct is None:
                    stock_pct = ACCOUNT_TYPE_DEFAULTS[acc.type]["default_stock_pct"]
                s = float(stock_pct) / 100.0
                acc_rate = s * eq + (1 - s) * bd
            elif flat_rate is not None:
                acc_rate = flat_rate
            else:
                acc_rate = account_growth_rate(acc.stock_pct, acc.type)
                if conservative:
                    acc_rate *= CONSERVATIVE_GROWTH_FACTOR

            if is_brokerage:
                old_basis = acc.balance * acc.cost_basis_ratio
                if acc.tax_drag_override is not None:
                    drag = acc.tax_drag_override
                else:
                    spct = acc.stock_pct
                    if spct is None:
                        spct = ACCOUNT_TYPE_DEFAULTS[acc.type]["default_stock_pct"]
                    drag = calculate_tax_drag(float(spct))
                acc.balance *= 1 + acc_rate - drag
                if acc.balance > 0:
                    acc.cost_basis_ratio = old_basis / acc.balance
            else:
                acc.balance *= 1 + acc_rate
            acc.balance = round(acc.balance, 2)

        total += acc.balance
    return total


def get_total_balance_by_category(accounts: list[Account], category: TaxCategory) -> float:
    """Get total balance across all accounts matching a tax category."""
    return sum(acc.balance for acc in accounts if tax_category(acc.type) == category)


def get_total_balance_by_type(accounts: list[Account], account_type: AccountType) -> float:
    """Get total balance across all accounts of a specific type."""
    return sum(acc.balance for acc in accounts if acc.type == account_type)


def get_total_balance_by_owner(
    accounts: list[Account], category: TaxCategory, owner: Owner
) -> float:
    """Get total balance for accounts of a given tax category and owner."""
    return sum(
        acc.balance for acc in accounts if tax_category(acc.type) == category and acc.owner == owner
    )


def get_available_balance(
    accounts: list[Account],
    category: TaxCategory,
    owner_age_map: dict[str, int],
) -> float:
    """Get total available balance (considering age restrictions) for a tax category."""
    total = 0.0
    for acc in accounts:
        if tax_category(acc.type) != category:
            continue
        current_age = owner_age_map.get(acc.owner.value, 0)
        if current_age >= acc.available_at_age:
            total += acc.balance
    return total


def get_eligible_pretax_balance(accounts: list[Account]) -> float:
    """Get total balance of IRA-category pre-tax accounts eligible for Roth conversion."""
    from retirement_model.models import is_conversion_eligible

    return sum(acc.balance for acc in accounts if is_conversion_eligible(acc.type))


def get_pretax_balance_per_spouse(
    accounts: list[Account], owner_age_map: dict[str, int]
) -> tuple[float, float]:
    """Return (primary_pretax_total, spouse_pretax_total).

    Joint pretax accounts (defensive — never created via the editor)
    are attributed to the older spouse, matching the withdrawal-ordering
    rule that drains the older spouse's pretax first.
    """
    primary_age = owner_age_map.get(Owner.PRIMARY.value, 0)
    spouse_age = owner_age_map.get(Owner.SPOUSE.value, 0)
    primary_total = 0.0
    spouse_total = 0.0
    for acc in accounts:
        if tax_category(acc.type) != TaxCategory.PRETAX:
            continue
        if acc.owner == Owner.PRIMARY:
            primary_total += acc.balance
        elif acc.owner == Owner.SPOUSE:
            spouse_total += acc.balance
        elif acc.owner == Owner.JOINT:
            if primary_age >= spouse_age:
                primary_total += acc.balance
            else:
                spouse_total += acc.balance
    return primary_total, spouse_total


def compute_brokerage_after_tax(accounts: list[Account], cap_gains_rate: float) -> float:
    """Return the after-liquidation value of brokerage and cash holdings.

    Brokerage accounts: face value minus cap-gains tax on the gain
    portion (1 - cost_basis_ratio). Cash accounts: face value (no gain).

    Used to compute YearResult.after_tax_value, which models a full
    liquidation rather than the step-up-at-death scenario captured by
    YearResult.inherited_value.
    """
    total = 0.0
    for acc in accounts:
        cat = tax_category(acc.type)
        if cat == TaxCategory.BROKERAGE:
            gain_fraction = max(0.0, 1.0 - acc.cost_basis_ratio)
            discount = acc.balance * gain_fraction * cap_gains_rate
            total += acc.balance - discount
        elif cat == TaxCategory.CASH:
            total += acc.balance
    return total
