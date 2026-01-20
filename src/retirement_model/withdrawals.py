"""Account withdrawal and deposit logic for retirement simulation."""

from dataclasses import dataclass

from retirement_model.models import Account, AccountType, Owner


@dataclass
class WithdrawalResult:
    """Result of a withdrawal operation."""

    amount_withdrawn: float
    average_basis_ratio: float


def withdraw_from_accounts(
    amount_needed: float,
    accounts: list[Account],
    account_type: AccountType,
    owner_age_map: dict[str, int],
) -> WithdrawalResult:
    """
    Withdraw money from accounts of a specific type.

    Returns the amount actually withdrawn and the weighted average cost basis ratio.
    Modifies account balances in place.
    """
    if amount_needed <= 0:
        return WithdrawalResult(0.0, 0.0)

    remaining_need = amount_needed
    total_withdrawn = 0.0
    weighted_basis_accum = 0.0

    for acc in accounts:
        if remaining_need <= 1.0:
            break
        if acc.type != account_type:
            continue

        current_age = owner_age_map.get(acc.owner.value, 0)
        if current_age < acc.available_at_age:
            continue

        withdrawal = min(acc.balance, remaining_need)
        acc.balance -= withdrawal
        remaining_need -= withdrawal
        total_withdrawn += withdrawal

        weighted_basis_accum += withdrawal * acc.cost_basis_ratio

    avg_basis = weighted_basis_accum / total_withdrawn if total_withdrawn > 0 else 0.0
    return WithdrawalResult(total_withdrawn, avg_basis)


def deposit_to_account(
    amount: float,
    accounts: list[Account],
    account_type: AccountType,
    owner: Owner = Owner.JOINT,
) -> None:
    """
    Deposit money into an account of a specific type.

    If no matching account exists, creates a new one.
    Modifies accounts list in place.
    """
    if amount <= 0:
        return

    for acc in accounts:
        if acc.type == account_type and acc.owner == owner:
            acc.balance += amount
            return

    new_account = Account(
        id=f"new_{account_type.value}",
        name=f"New {account_type.value}",
        balance=amount,
        type=account_type,
        owner=owner,
        cost_basis_ratio=1.0,
    )
    accounts.append(new_account)


def apply_growth(accounts: list[Account], rate: float) -> float:
    """Apply investment growth to all accounts and return total balance."""
    total = 0.0
    for acc in accounts:
        acc.balance *= 1 + rate
        acc.balance = round(acc.balance, 2)
        total += acc.balance
    return total


def get_total_balance_by_type(accounts: list[Account], account_type: AccountType) -> float:
    """Get total balance across all accounts of a given type."""
    return sum(acc.balance for acc in accounts if acc.type == account_type)


def get_total_balance_by_owner(
    accounts: list[Account], account_type: AccountType, owner: Owner
) -> float:
    """Get total balance for accounts of a given type and owner."""
    return sum(acc.balance for acc in accounts if acc.type == account_type and acc.owner == owner)


def get_available_balance(
    accounts: list[Account],
    account_type: AccountType,
    owner_age_map: dict[str, int],
) -> float:
    """Get total available balance (considering age restrictions) for an account type."""
    total = 0.0
    for acc in accounts:
        if acc.type != account_type:
            continue
        current_age = owner_age_map.get(acc.owner.value, 0)
        if current_age >= acc.available_at_age:
            total += acc.balance
    return total
