## Accounts & Tax Treatment

The simulation models several account types, each with distinct tax rules that affect withdrawal taxation, growth, and conversion eligibility.

### Account Types

**Pre-tax** (Traditional IRA, 401k, 403b, 457b, SEP IRA, SIMPLE IRA) — Contributions were tax-deductible. All withdrawals are taxed as ordinary income. Subject to Required Minimum Distributions (RMDs) starting at age 73. Eligible for Roth conversions.

**Roth** (Roth IRA, Roth 401k) — Contributions were made with after-tax dollars. Qualified withdrawals are completely tax-free. Not subject to RMDs (for Roth IRAs). Growth compounds without tax drag.

**Roth Conversion** — A separate account type tracking funds converted from pre-tax to Roth. Withdrawals are tax-free (same as Roth). This distinction allows the simulation to track conversion history separately.

**Brokerage** — Taxable investment accounts. Growth is subject to annual tax drag (dividends and realized capital gains taxed each year). Withdrawals are partially taxed based on the cost basis ratio.

**Cash/CD** — Taxable savings with no growth assumption. Typically withdrawn first to fund spending before touching invested accounts.

### Cost Basis

The cost basis ratio represents what fraction of a brokerage account's value is original contributions (as opposed to accumulated gains). A ratio of 0.40 means 40% is cost basis and 60% is gains. When withdrawing from brokerage accounts, only the gains portion is subject to capital gains tax. A higher ratio means less tax on withdrawals. The simulation updates this ratio over time as the account grows and gains accumulate.

### Stock Allocation

The stock percentage (equity allocation) for each account controls how much of the account is invested in equities versus bonds. This affects the annual tax drag calculation for brokerage accounts — stock-heavy allocations generate more qualified dividends (taxed at lower rates) while bond-heavy allocations generate more ordinary income (taxed at higher rates). If not set for an individual account, the portfolio-level default is used.
