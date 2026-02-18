"""Tests for withdrawal and deposit functions."""

import pytest

from retirement_model.models import Account, AccountType, Owner, TaxCategory
from retirement_model.withdrawals import (
    apply_growth,
    deposit_to_account,
    get_available_balance,
    get_total_balance_by_category,
    get_total_balance_by_owner,
    get_total_balance_by_type,
    withdraw_from_accounts,
)


@pytest.fixture
def test_accounts() -> list[Account]:
    return [
        Account(
            id="brokerage",
            name="Brokerage",
            balance=100000,
            type=AccountType.BROKERAGE,
            owner=Owner.JOINT,
            cost_basis_ratio=0.30,
        ),
        Account(
            id="ira_primary",
            name="IRA Primary",
            balance=200000,
            type=AccountType.IRA,
            owner=Owner.PRIMARY,
        ),
        Account(
            id="ira_spouse",
            name="IRA Spouse",
            balance=150000,
            type=AccountType.IRA,
            owner=Owner.SPOUSE,
            available_at_age=62,
        ),
        Account(
            id="roth",
            name="Roth",
            balance=50000,
            type=AccountType.ROTH_IRA,
            owner=Owner.PRIMARY,
        ),
    ]


class TestWithdrawFromAccounts:
    def test_basic_withdrawal(self, test_accounts: list[Account]):
        age_map = {"primary": 65, "spouse": 65, "joint": 65}
        result = withdraw_from_accounts(50000, test_accounts, TaxCategory.BROKERAGE, age_map)

        assert result.amount_withdrawn == 50000
        assert result.average_basis_ratio == 0.30
        assert test_accounts[0].balance == 50000

    def test_withdrawal_exceeds_balance(self, test_accounts: list[Account]):
        age_map = {"primary": 65, "spouse": 65, "joint": 65}
        result = withdraw_from_accounts(150000, test_accounts, TaxCategory.BROKERAGE, age_map)

        assert result.amount_withdrawn == 100000
        assert test_accounts[0].balance == 0

    def test_zero_withdrawal(self, test_accounts: list[Account]):
        age_map = {"primary": 65, "spouse": 65, "joint": 65}
        result = withdraw_from_accounts(0, test_accounts, TaxCategory.BROKERAGE, age_map)

        assert result.amount_withdrawn == 0
        assert result.average_basis_ratio == 0

    def test_age_restricted_account(self, test_accounts: list[Account]):
        age_map = {"primary": 65, "spouse": 60, "joint": 65}
        result = withdraw_from_accounts(300000, test_accounts, TaxCategory.PRETAX, age_map)

        # Spouse is 60, below required 62 for their IRA
        assert result.amount_withdrawn == 200000  # Only primary's IRA
        assert test_accounts[1].balance == 0  # Primary's IRA depleted
        assert test_accounts[2].balance == 150000  # Spouse's IRA untouched

    def test_age_restricted_account_accessible(self, test_accounts: list[Account]):
        age_map = {"primary": 65, "spouse": 65, "joint": 65}
        result = withdraw_from_accounts(300000, test_accounts, TaxCategory.PRETAX, age_map)

        # Spouse is 65, above required 62
        assert result.amount_withdrawn == 300000

    def test_weighted_basis_ratio(self):
        accounts = [
            Account(
                id="b1",
                name="B1",
                balance=100000,
                type=AccountType.BROKERAGE,
                owner=Owner.JOINT,
                cost_basis_ratio=0.20,
            ),
            Account(
                id="b2",
                name="B2",
                balance=100000,
                type=AccountType.BROKERAGE,
                owner=Owner.JOINT,
                cost_basis_ratio=0.40,
            ),
        ]
        age_map = {"joint": 65}
        result = withdraw_from_accounts(150000, accounts, TaxCategory.BROKERAGE, age_map)

        # 100k at 0.20 + 50k at 0.40 = (100k*0.20 + 50k*0.40) / 150k
        expected_basis = (100000 * 0.20 + 50000 * 0.40) / 150000
        assert result.average_basis_ratio == pytest.approx(expected_basis, rel=0.01)


class TestDepositToAccount:
    def test_deposit_to_existing_account(self, test_accounts: list[Account]):
        initial = test_accounts[0].balance
        deposit_to_account(10000, test_accounts, AccountType.BROKERAGE, Owner.JOINT)
        assert test_accounts[0].balance == initial + 10000

    def test_deposit_creates_new_account(self, test_accounts: list[Account]):
        initial_count = len(test_accounts)
        deposit_to_account(10000, test_accounts, AccountType.BROKERAGE, Owner.PRIMARY)
        assert len(test_accounts) == initial_count + 1
        assert test_accounts[-1].balance == 10000
        assert test_accounts[-1].type == AccountType.BROKERAGE

    def test_deposit_zero_amount(self, test_accounts: list[Account]):
        initial = test_accounts[0].balance
        deposit_to_account(0, test_accounts, AccountType.BROKERAGE, Owner.JOINT)
        assert test_accounts[0].balance == initial

    def test_deposit_negative_amount(self, test_accounts: list[Account]):
        initial = test_accounts[0].balance
        deposit_to_account(-100, test_accounts, AccountType.BROKERAGE, Owner.JOINT)
        assert test_accounts[0].balance == initial


class TestApplyGrowth:
    def test_positive_growth(self, test_accounts: list[Account]):
        total = apply_growth(test_accounts, 0.06)
        expected = (100000 + 200000 + 150000 + 50000) * 1.06
        assert total == pytest.approx(expected, rel=0.01)

    def test_zero_growth(self, test_accounts: list[Account]):
        initial_total = sum(a.balance for a in test_accounts)
        total = apply_growth(test_accounts, 0.0)
        assert total == pytest.approx(initial_total, rel=0.01)

    def test_negative_growth(self, test_accounts: list[Account]):
        initial_total = sum(a.balance for a in test_accounts)
        total = apply_growth(test_accounts, -0.10)
        assert total == pytest.approx(initial_total * 0.90, rel=0.01)


class TestApplyGrowthCostBasis:
    def test_brokerage_basis_ratio_dilutes_after_growth(self):
        """Growth adds gains, reducing cost_basis_ratio for brokerage accounts."""
        accounts = [
            Account(
                id="b1", name="B1", balance=100000,
                type=AccountType.BROKERAGE, owner=Owner.JOINT, cost_basis_ratio=0.40,
            ),
        ]
        apply_growth(accounts, 0.10)
        # Balance grew from 100k to 110k, basis is still 40k
        assert accounts[0].balance == pytest.approx(110000, rel=0.01)
        assert accounts[0].cost_basis_ratio == pytest.approx(40000 / 110000, rel=0.001)

    def test_pretax_ratio_unchanged_after_growth(self):
        """Pre-tax accounts always have ratio 0 regardless of growth."""
        accounts = [
            Account(
                id="ira", name="IRA", balance=200000,
                type=AccountType.IRA, owner=Owner.PRIMARY, cost_basis_ratio=0.0,
            ),
        ]
        apply_growth(accounts, 0.07)
        assert accounts[0].cost_basis_ratio == 0.0

    def test_roth_ratio_unchanged_after_growth(self):
        """Roth accounts keep ratio 1.0 — growth is tax-free."""
        accounts = [
            Account(
                id="roth", name="Roth", balance=50000,
                type=AccountType.ROTH_IRA, owner=Owner.PRIMARY, cost_basis_ratio=1.0,
            ),
        ]
        apply_growth(accounts, 0.07)
        # Roth is not brokerage category, so ratio stays at 1.0
        assert accounts[0].cost_basis_ratio == 1.0

    def test_cash_cd_no_growth_or_ratio_change(self):
        """Cash/CD accounts get no growth and no basis change."""
        accounts = [
            Account(
                id="cash", name="Cash", balance=50000,
                type=AccountType.CASH_CD, owner=Owner.JOINT, cost_basis_ratio=1.0,
            ),
        ]
        apply_growth(accounts, 0.07)
        assert accounts[0].balance == 50000
        assert accounts[0].cost_basis_ratio == 1.0

    def test_multi_year_basis_dilution(self):
        """Multiple years of growth progressively dilute basis ratio."""
        accounts = [
            Account(
                id="b1", name="B1", balance=100000,
                type=AccountType.BROKERAGE, owner=Owner.JOINT, cost_basis_ratio=0.50,
            ),
        ]
        # Basis is 50k absolute
        for _ in range(5):
            apply_growth(accounts, 0.07)
        # After 5 years at 7%: balance = 100k * 1.07^5 ≈ 140255
        # Basis stays at 50k → ratio ≈ 50000/140255 ≈ 0.3565
        expected_balance = 100000 * (1.07 ** 5)
        assert accounts[0].balance == pytest.approx(expected_balance, rel=0.01)
        assert accounts[0].cost_basis_ratio == pytest.approx(50000 / expected_balance, rel=0.01)


class TestGetTotalBalanceByType:
    def test_brokerage_total(self, test_accounts: list[Account]):
        total = get_total_balance_by_type(test_accounts, AccountType.BROKERAGE)
        assert total == 100000

    def test_ira_total(self, test_accounts: list[Account]):
        total = get_total_balance_by_type(test_accounts, AccountType.IRA)
        assert total == 350000  # 200k + 150k

    def test_roth_ira_total(self, test_accounts: list[Account]):
        total = get_total_balance_by_type(test_accounts, AccountType.ROTH_IRA)
        assert total == 50000


class TestGetTotalBalanceByCategory:
    def test_brokerage_category(self, test_accounts: list[Account]):
        total = get_total_balance_by_category(test_accounts, TaxCategory.BROKERAGE)
        assert total == 100000

    def test_pretax_category(self, test_accounts: list[Account]):
        total = get_total_balance_by_category(test_accounts, TaxCategory.PRETAX)
        assert total == 350000  # 200k + 150k

    def test_roth_category(self, test_accounts: list[Account]):
        total = get_total_balance_by_category(test_accounts, TaxCategory.ROTH)
        assert total == 50000


class TestGetTotalBalanceByOwner:
    def test_primary_pretax(self, test_accounts: list[Account]):
        total = get_total_balance_by_owner(test_accounts, TaxCategory.PRETAX, Owner.PRIMARY)
        assert total == 200000

    def test_spouse_pretax(self, test_accounts: list[Account]):
        total = get_total_balance_by_owner(test_accounts, TaxCategory.PRETAX, Owner.SPOUSE)
        assert total == 150000


class TestGetAvailableBalance:
    def test_all_available(self, test_accounts: list[Account]):
        age_map = {"primary": 65, "spouse": 65, "joint": 65}
        total = get_available_balance(test_accounts, TaxCategory.PRETAX, age_map)
        assert total == 350000

    def test_age_restricted(self, test_accounts: list[Account]):
        age_map = {"primary": 65, "spouse": 60, "joint": 65}
        total = get_available_balance(test_accounts, TaxCategory.PRETAX, age_map)
        assert total == 200000  # Only primary's IRA
