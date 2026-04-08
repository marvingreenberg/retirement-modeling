"""Tests for withdrawal and deposit functions."""

import pytest

from retirement_model.constants import CONSERVATIVE_GROWTH_FACTOR
from retirement_model.models import (
    BOND_TAX_DRAG,
    STOCK_TAX_DRAG,
    Account,
    AccountType,
    Owner,
    TaxCategory,
)
from retirement_model.withdrawals import (
    account_growth_rate,
    apply_growth,
    calculate_tax_drag,
    deposit_to_account,
    get_available_balance,
    get_total_balance_by_category,
    get_total_balance_by_owner,
    get_total_balance_by_type,
    withdraw_from_accounts,
    withdraw_from_eligible_pretax,
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

    def test_per_account_tracking(self, test_accounts: list[Account]):
        age_map = {"primary": 65, "spouse": 65, "joint": 65}
        result = withdraw_from_accounts(50000, test_accounts, TaxCategory.BROKERAGE, age_map)

        assert result.per_account is not None
        assert result.per_account == {"brokerage": 50000}

    def test_per_account_multiple_accounts(self):
        accounts = [
            Account(
                id="b1",
                name="B1",
                balance=30000,
                type=AccountType.BROKERAGE,
                owner=Owner.JOINT,
                cost_basis_ratio=0.20,
            ),
            Account(
                id="b2",
                name="B2",
                balance=50000,
                type=AccountType.BROKERAGE,
                owner=Owner.JOINT,
                cost_basis_ratio=0.40,
            ),
        ]
        age_map = {"joint": 65}
        result = withdraw_from_accounts(60000, accounts, TaxCategory.BROKERAGE, age_map)

        assert result.per_account == {"b1": 30000, "b2": 30000}

    def test_per_account_zero_withdrawal_returns_empty(self, test_accounts: list[Account]):
        age_map = {"primary": 65, "spouse": 65, "joint": 65}
        result = withdraw_from_accounts(0, test_accounts, TaxCategory.BROKERAGE, age_map)

        assert result.per_account == {}

    def test_per_account_with_owner_filter(self, test_accounts: list[Account]):
        age_map = {"primary": 65, "spouse": 65, "joint": 65}
        result = withdraw_from_accounts(
            100000, test_accounts, TaxCategory.PRETAX, age_map, owner_filter=Owner.PRIMARY
        )

        assert result.per_account == {"ira_primary": 100000}


class TestWithdrawFromEligiblePretaxPerAccount:
    def test_per_account_tracking(self):
        accounts = [
            Account(
                id="ira1",
                name="IRA 1",
                balance=50000,
                type=AccountType.IRA,
                owner=Owner.PRIMARY,
            ),
            Account(
                id="sep_ira",
                name="SEP IRA",
                balance=30000,
                type=AccountType.SEP_IRA,
                owner=Owner.PRIMARY,
            ),
        ]
        age_map = {"primary": 65}
        result = withdraw_from_eligible_pretax(60000, accounts, age_map, eligible_only=True)

        # Pretax withdrawals iterate accounts in (owner-age desc, balance
        # asc) order. Both accounts share an owner, so the smaller SEP IRA
        # ($30k) drains in full first, then the IRA covers the remaining
        # $30k.
        assert result.per_account == {"sep_ira": 30000, "ira1": 30000}

    def test_skips_non_eligible(self):
        accounts = [
            Account(
                id="brk1",
                name="Brokerage",
                balance=100000,
                type=AccountType.BROKERAGE,
                owner=Owner.PRIMARY,
            ),
            Account(
                id="ira1",
                name="IRA",
                balance=50000,
                type=AccountType.IRA,
                owner=Owner.PRIMARY,
            ),
        ]
        age_map = {"primary": 65}
        result = withdraw_from_eligible_pretax(80000, accounts, age_map, eligible_only=True)

        assert result.per_account == {"ira1": 50000}
        assert result.amount_withdrawn == 50000


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
        """Brokerage gets drag-reduced rate; IRA/Roth get full rate."""
        drag = calculate_tax_drag(60)  # default stock_pct for brokerage
        total = apply_growth(test_accounts, rate=0.06)
        expected = 100000 * (1 + 0.06 - drag) + (200000 + 150000 + 50000) * 1.06
        assert total == pytest.approx(expected, rel=0.001)

    def test_zero_growth(self, test_accounts: list[Account]):
        total = apply_growth(test_accounts, rate=0.0)
        # Brokerage has negative effective rate (0 - drag), others stay flat
        drag = calculate_tax_drag(60)
        expected = 100000 * (1 - drag) + 200000 + 150000 + 50000
        assert total == pytest.approx(expected, rel=0.001)

    def test_negative_growth(self, test_accounts: list[Account]):
        drag = calculate_tax_drag(60)
        total = apply_growth(test_accounts, rate=-0.10)
        expected = 100000 * (1 - 0.10 - drag) + (200000 + 150000 + 50000) * 0.90
        assert total == pytest.approx(expected, rel=0.001)


class TestApplyGrowthCostBasis:
    def test_brokerage_basis_ratio_dilutes_after_growth(self):
        """Growth adds gains (minus drag), reducing cost_basis_ratio for brokerage."""
        accounts = [
            Account(
                id="b1",
                name="B1",
                balance=100000,
                type=AccountType.BROKERAGE,
                owner=Owner.JOINT,
                cost_basis_ratio=0.40,
                stock_pct=60,
            ),
        ]
        drag = calculate_tax_drag(60)
        apply_growth(accounts, rate=0.10)
        expected_balance = 100000 * (1 + 0.10 - drag)
        assert accounts[0].balance == pytest.approx(expected_balance, rel=0.001)
        assert accounts[0].cost_basis_ratio == pytest.approx(40000 / expected_balance, rel=0.001)

    def test_pretax_ratio_unchanged_after_growth(self):
        """Pre-tax accounts always have ratio 0 regardless of growth."""
        accounts = [
            Account(
                id="ira",
                name="IRA",
                balance=200000,
                type=AccountType.IRA,
                owner=Owner.PRIMARY,
                cost_basis_ratio=0.0,
            ),
        ]
        apply_growth(accounts, rate=0.07)
        assert accounts[0].cost_basis_ratio == 0.0

    def test_roth_ratio_unchanged_after_growth(self):
        """Roth accounts keep ratio 1.0 — growth is tax-free."""
        accounts = [
            Account(
                id="roth",
                name="Roth",
                balance=50000,
                type=AccountType.ROTH_IRA,
                owner=Owner.PRIMARY,
                cost_basis_ratio=1.0,
            ),
        ]
        apply_growth(accounts, rate=0.07)
        # Roth is not brokerage category, so ratio stays at 1.0
        assert accounts[0].cost_basis_ratio == 1.0

    def test_cash_cd_no_growth_or_ratio_change(self):
        """Cash/CD accounts get no growth and no basis change."""
        accounts = [
            Account(
                id="cash",
                name="Cash",
                balance=50000,
                type=AccountType.CASH_CD,
                owner=Owner.JOINT,
                cost_basis_ratio=1.0,
            ),
        ]
        apply_growth(accounts, rate=0.07)
        assert accounts[0].balance == 50000
        assert accounts[0].cost_basis_ratio == 1.0

    def test_multi_year_basis_dilution(self):
        """Multiple years of growth progressively dilute basis ratio."""
        accounts = [
            Account(
                id="b1",
                name="B1",
                balance=100000,
                type=AccountType.BROKERAGE,
                owner=Owner.JOINT,
                cost_basis_ratio=0.50,
                stock_pct=60,
            ),
        ]
        drag = calculate_tax_drag(60)
        effective_rate = 0.07 - drag
        for _ in range(5):
            apply_growth(accounts, rate=0.07)
        expected_balance = 100000 * ((1 + effective_rate) ** 5)
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


class TestTaxDrag:
    def test_all_stocks(self):
        assert calculate_tax_drag(100) == pytest.approx(STOCK_TAX_DRAG, rel=0.001)

    def test_all_bonds(self):
        assert calculate_tax_drag(0) == pytest.approx(BOND_TAX_DRAG, rel=0.001)

    def test_60_40_blend(self):
        expected = 0.6 * STOCK_TAX_DRAG + 0.4 * BOND_TAX_DRAG
        assert calculate_tax_drag(60) == pytest.approx(expected, rel=0.001)

    def test_50_50_blend(self):
        expected = 0.5 * STOCK_TAX_DRAG + 0.5 * BOND_TAX_DRAG
        assert calculate_tax_drag(50) == pytest.approx(expected, rel=0.001)


class TestApplyGrowthWithTaxDrag:
    def test_brokerage_grows_less_than_ira(self):
        """Same balance: brokerage grows less due to tax drag."""
        brokerage = Account(
            id="brk",
            name="Brk",
            balance=100000,
            type=AccountType.BROKERAGE,
            owner=Owner.JOINT,
            stock_pct=60,
        )
        ira = Account(
            id="ira",
            name="IRA",
            balance=100000,
            type=AccountType.IRA,
            owner=Owner.PRIMARY,
        )
        apply_growth([brokerage], rate=0.07)
        apply_growth([ira], rate=0.07)
        assert brokerage.balance < ira.balance

    def test_stock_pct_none_uses_default(self):
        """When stock_pct is None, uses ACCOUNT_TYPE_DEFAULTS."""
        explicit = Account(
            id="b1",
            name="B1",
            balance=100000,
            type=AccountType.BROKERAGE,
            owner=Owner.JOINT,
            stock_pct=60,
        )
        default = Account(
            id="b2",
            name="B2",
            balance=100000,
            type=AccountType.BROKERAGE,
            owner=Owner.JOINT,
        )
        apply_growth([explicit], rate=0.07)
        apply_growth([default], rate=0.07)
        # Default brokerage stock_pct is 60, same as explicit
        assert explicit.balance == pytest.approx(default.balance, rel=0.0001)

    def test_cost_basis_preserved_with_drag(self):
        """Cost basis ratio still dilutes correctly with drag."""
        accounts = [
            Account(
                id="b1",
                name="B1",
                balance=100000,
                type=AccountType.BROKERAGE,
                owner=Owner.JOINT,
                cost_basis_ratio=0.40,
                stock_pct=60,
            ),
        ]
        old_basis = 40000
        apply_growth(accounts, rate=0.07)
        # Basis absolute stays at 40k, ratio should be 40k / new_balance
        assert accounts[0].cost_basis_ratio == pytest.approx(
            old_basis / accounts[0].balance, rel=0.001
        )

    def test_cash_cd_unaffected_by_drag(self):
        """Cash/CD accounts don't get growth or drag."""
        accounts = [
            Account(
                id="cash",
                name="Cash",
                balance=50000,
                type=AccountType.CASH_CD,
                owner=Owner.JOINT,
            ),
        ]
        apply_growth(accounts, rate=0.07)
        assert accounts[0].balance == 50000

    def test_high_stock_pct_less_drag(self):
        """100% stock brokerage has less drag than 0% stock."""
        all_stock = Account(
            id="s",
            name="S",
            balance=100000,
            type=AccountType.BROKERAGE,
            owner=Owner.JOINT,
            stock_pct=100,
        )
        all_bond = Account(
            id="b",
            name="B",
            balance=100000,
            type=AccountType.BROKERAGE,
            owner=Owner.JOINT,
            stock_pct=0,
        )
        apply_growth([all_stock], rate=0.07)
        apply_growth([all_bond], rate=0.07)
        assert all_stock.balance > all_bond.balance

    def test_tax_drag_override_used_when_set(self):
        """tax_drag_override bypasses the stock_pct formula."""
        override_drag = 0.008
        accounts = [
            Account(
                id="b1",
                name="B1",
                balance=100000,
                type=AccountType.BROKERAGE,
                owner=Owner.JOINT,
                cost_basis_ratio=0.40,
                stock_pct=100,
                tax_drag_override=override_drag,
            ),
        ]
        apply_growth(accounts, rate=0.07)
        expected = 100000 * (1 + 0.07 - override_drag)
        assert accounts[0].balance == pytest.approx(expected, rel=0.001)

    def test_tax_drag_override_none_uses_formula(self):
        """tax_drag_override=None falls back to stock_pct formula."""
        accounts = [
            Account(
                id="b1",
                name="B1",
                balance=100000,
                type=AccountType.BROKERAGE,
                owner=Owner.JOINT,
                stock_pct=100,
                tax_drag_override=None,
            ),
        ]
        apply_growth(accounts, rate=0.07)
        expected = 100000 * (1 + 0.07 - calculate_tax_drag(100))
        assert accounts[0].balance == pytest.approx(expected, rel=0.001)


class TestPerAccountGrowth:
    def _make_ira(self, stock_pct: int | None = 60, balance: float = 100000) -> Account:
        return Account(
            id="ira",
            name="IRA",
            balance=balance,
            type=AccountType.IRA,
            owner=Owner.PRIMARY,
            stock_pct=stock_pct,
        )

    def test_high_equity_grows_faster(self):
        high = self._make_ira(stock_pct=80)
        high.id = "high"
        low = self._make_ira(stock_pct=40)
        low.id = "low"
        apply_growth([high])
        apply_growth([low])
        assert high.balance > low.balance

    def test_per_account_rate_formula(self):
        acc = self._make_ira(stock_pct=60)
        apply_growth([acc])
        # 60% * 0.10 + 40% * 0.04 = 0.076
        assert acc.balance == pytest.approx(107600, rel=0.001)

    def test_conservative_reduces_growth(self):
        normal = self._make_ira(stock_pct=60)
        normal.id = "normal"
        conservative = self._make_ira(stock_pct=60)
        conservative.id = "cons"
        apply_growth([normal])
        apply_growth([conservative], conservative=True)
        assert conservative.balance < normal.balance
        # 0.076 * 0.75 = 0.057
        assert conservative.balance == pytest.approx(105700, rel=0.001)

    def test_brokerage_drag_applied_after_conservative(self):
        acc = Account(
            id="brk",
            name="Brk",
            balance=100000,
            type=AccountType.BROKERAGE,
            owner=Owner.JOINT,
            stock_pct=60,
        )
        apply_growth([acc], conservative=True)
        rate = account_growth_rate(60, AccountType.BROKERAGE) * CONSERVATIVE_GROWTH_FACTOR
        drag = calculate_tax_drag(60)
        assert acc.balance == pytest.approx(100000 * (1 + rate - drag), rel=0.001)

    def test_mc_rate_overrides_per_account(self):
        acc = self._make_ira(stock_pct=60)
        apply_growth([acc], rate=0.12)
        assert acc.balance == pytest.approx(112000, rel=0.001)

    def test_cash_cd_zero_growth_regardless(self):
        acc = Account(
            id="cash",
            name="Cash",
            balance=100000,
            type=AccountType.CASH_CD,
            owner=Owner.JOINT,
        )
        apply_growth([acc])
        assert acc.balance == 100000

    def test_none_stock_pct_uses_default(self):
        acc = self._make_ira(stock_pct=None)
        apply_growth([acc])
        # IRA default_stock_pct is 60 → rate = 0.076
        assert acc.balance == pytest.approx(107600, rel=0.001)
