## Withdrawal Order

When spending exceeds income in a given year, the simulation draws down accounts in a configured order. The withdrawal order determines which accounts are tapped first.

### Default Order

The default sequence is:

1. **Cash** — Savings and CDs, used first since they earn minimal returns.
2. **Brokerage** — Taxable investment accounts, withdrawn next. Only gains are taxed (at capital gains rates), so the tax cost is moderate.
3. **Pre-tax** (IRA/401k) — Traditional retirement accounts. Withdrawals are fully taxed as ordinary income. Keeping these invested longer allows more tax-deferred compounding.
4. **Roth** — Tax-free accounts, withdrawn last. Roth grows tax-free and withdrawals are untaxed, so maximizing time in Roth accounts provides the greatest long-term tax benefit.

### Customizing the Order

The withdrawal order can be rearranged by dragging categories. Some situations where a different order makes sense:

- **Large pre-tax balances** — Withdrawing pre-tax earlier (before Social Security starts) may keep the overall tax bill lower by filling lower brackets in early retirement years.
- **Legacy planning** — If leaving Roth assets to heirs is a priority, drawing Roth last preserves those tax-free balances.

### Excess Income Routing

When total income (from employment, pensions, Social Security, etc.) exceeds spending needs in a given year, the surplus must go somewhere. The excess income routing setting controls which account receives it:

- **Brokerage** (default) — Surplus goes to taxable investment accounts.
- **IRA First** — Surplus is contributed to traditional IRA (up to annual limits), remainder to brokerage.
- **Roth IRA First** — Surplus is contributed to Roth IRA (up to annual limits and income phase-out), remainder to brokerage.
