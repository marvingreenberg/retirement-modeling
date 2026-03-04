## Withdrawal Order

When spending exceeds income in a given year, the simulation draws down accounts in a configured order. The withdrawal order determines which accounts are tapped first.

### Default Order

The default sequence is designed to maximize the time that tax-advantaged accounts benefit from compounding:

1. **Cash** — Savings and CDs, used first since they earn minimal returns. There's no tax advantage to keeping cash invested, so spend it first.
2. **Brokerage** — Taxable investment accounts, withdrawn next. Only gains are taxed (at favorable capital gains rates), so the tax cost is moderate. These accounts suffer tax drag every year, making them less efficient to hold long-term.
3. **Pre-tax** (IRA/401k) — Traditional retirement accounts. Withdrawals are fully taxed as ordinary income. Keeping these invested longer allows more tax-deferred compounding — every year of deferral saves you a year of tax on dividends and gains.
4. **Roth** — Tax-free accounts, withdrawn last. Roth grows tax-free and withdrawals are untaxed, so every extra year of Roth compounding is a year of completely untaxed growth. This is the most powerful account type to preserve.

### Customizing the Order

The withdrawal order can be rearranged by dragging categories. Some situations where a different order makes sense:

- **Large pre-tax balances** — Withdrawing pre-tax earlier (before Social Security starts) may keep the overall tax bill lower by filling lower brackets in early retirement years.
- **Legacy planning** — If leaving Roth assets to heirs is a priority, drawing Roth last preserves those tax-free balances.

### Excess Income Routing

When total income (from employment, pensions, Social Security, etc.) exceeds spending needs in a given year, the surplus must go somewhere. The excess income routing setting controls which account receives it:

- **Brokerage** (default) — Surplus goes to taxable investment accounts.
- **IRA First** — Surplus is contributed to traditional IRA (up to annual limits), remainder to brokerage.
- **Roth IRA First** — Surplus is contributed to Roth IRA (up to annual limits and income phase-out), remainder to brokerage.
