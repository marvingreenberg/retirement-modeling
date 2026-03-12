## Withdrawal Order

When spending exceeds income in a given year, the simulation draws down accounts in a configured order.

### How It Works

Cash and CD accounts are always withdrawn first — they earn minimal returns and have no tax advantage. Roth accounts are always withdrawn last — tax-free compounding is the most powerful benefit to preserve.

The choice you make is which account type comes next: **brokerage** or **IRA/401k**.

### IRA/401k First (Default)

Withdraws from traditional IRA and 401k accounts before brokerage. This is the conventional approach:

- **Tax-deferred compounding** — keeps brokerage assets (taxed only on gains at favorable capital gains rates) growing while spending down fully-taxed pre-tax accounts
- **Simpler tax picture** — pre-tax withdrawals are ordinary income, easy to predict

### Brokerage First

Withdraws from taxable brokerage accounts before IRA/401k. This can be advantageous in specific situations:

- **Roth conversion headroom** — by not drawing down IRA/401k for spending, the taxable income stays lower, leaving room to convert IRA/401k assets to Roth at lower tax brackets. Over time, this can shift more wealth into tax-free Roth accounts.
- **Reduces tax drag** — brokerage accounts generate taxable dividends and capital gains distributions every year whether you withdraw or not. Spending these assets first eliminates that ongoing tax drag.
- **Best when conversions are active** — if you're running a Roth conversion strategy (filling a bracket each year), brokerage-first ensures the conversion has maximum headroom.

### Excess Income Routing

When total income (from employment, pensions, Social Security, etc.) exceeds spending needs in a given year, the surplus must go somewhere. The excess income routing setting controls which account receives it:

- **Brokerage** (default) — Surplus goes to taxable investment accounts.
- **IRA First** — Surplus is contributed to traditional IRA (up to annual limits), remainder to brokerage.
- **Roth IRA First** — Surplus is contributed to Roth IRA (up to annual limits and income phase-out), remainder to brokerage.
