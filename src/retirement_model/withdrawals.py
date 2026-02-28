"""Account withdrawal and deposit logic for retirement simulation."""

from dataclasses import dataclass

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
    """
    if amount_needed <= 0:
        return WithdrawalResult(0.0, 0.0, {})

    remaining_need = amount_needed
    total_withdrawn = 0.0
    weighted_basis_accum = 0.0
    per_account: dict[str, float] = {}

    for acc in accounts:
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
    """Withdraw from pre-tax accounts. When eligible_only=True, only IRA-category accounts."""
    from retirement_model.models import is_conversion_eligible

    if amount_needed <= 0:
        return WithdrawalResult(0.0, 0.0, {})

    remaining_need = amount_needed
    total_withdrawn = 0.0
    weighted_basis_accum = 0.0
    per_account: dict[str, float] = {}

    for acc in accounts:
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


def apply_growth(accounts: list[Account], rate: float) -> float:
    """Apply investment growth to all accounts and return total balance.

    Cash/CD accounts skip growth (they don't earn equity-like returns).
    Brokerage accounts suffer tax drag that reduces effective growth rate.
    Brokerage cost_basis_ratio is recalculated after growth — growth adds gains,
    diluting the basis proportion.
    """
    total = 0.0
    for acc in accounts:
        if acc.type != AccountType.CASH_CD:
            is_brokerage = tax_category(acc.type) == TaxCategory.BROKERAGE
            if is_brokerage:
                old_basis = acc.balance * acc.cost_basis_ratio
                if acc.tax_drag_override is not None:
                    drag = acc.tax_drag_override
                else:
                    spct = acc.stock_pct
                    if spct is None:
                        spct = ACCOUNT_TYPE_DEFAULTS[acc.type]["default_stock_pct"]
                    drag = calculate_tax_drag(float(spct))
                effective_rate = rate - drag
                acc.balance *= 1 + effective_rate
            else:
                acc.balance *= 1 + rate
            acc.balance = round(acc.balance, 2)
            if is_brokerage and acc.balance > 0:
                acc.cost_basis_ratio = old_basis / acc.balance
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
