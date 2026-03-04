## Accounts & Tax Treatment

The simulation models several account types, each with distinct tax rules that affect withdrawal taxation, growth, and conversion eligibility.

### Account Types

**Pre-tax** (Traditional IRA, 401k, 403b, 457b, SEP IRA, SIMPLE IRA) — Contributions were tax-deductible. All withdrawals are taxed as ordinary income (not as capital gains). Subject to Required Minimum Distributions (RMDs) starting at age 73. Eligible for Roth conversions.

**Roth** (Roth IRA, Roth 401k) — Contributions were made with after-tax dollars. Qualified withdrawals are completely tax-free. Not subject to RMDs (for Roth IRAs). Growth compounds without tax drag.

**Roth Conversion** — A separate account type tracking funds converted from pre-tax to Roth. Withdrawals are tax-free (same as Roth). This distinction allows the simulation to track conversion history separately.

**Brokerage** — Taxable investment accounts. Growth is subject to annual tax drag (dividends and realized capital gains taxed each year). Withdrawals are partially taxed based on the cost basis ratio.

**Cash/CD** — Taxable savings with no growth assumption. Typically withdrawn first to fund spending before touching invested accounts.

### Cost Basis (Brokerage Only) {#cost-basis}

The cost basis ratio represents what fraction of a brokerage account's value is original contributions (as opposed to accumulated gains). A ratio of 0.40 means 40% is cost basis and 60% is gains. When withdrawing from brokerage accounts, only the gains portion is subject to capital gains tax. A higher ratio means less tax on withdrawals. The simulation updates this ratio over time as the account grows and gains accumulate.

**What should you set it to?** Check your brokerage statements for the actual cost basis. For accounts funded entirely with after-tax savings, the basis may be high (say 80%), meaning withdrawals are mostly tax-free. For accounts that have grown significantly over many years, the basis may be low (say 10–20%), meaning nearly every dollar withdrawn triggers capital gains tax.

This field is only shown for brokerage accounts. Pre-tax account withdrawals are taxed as ordinary income, and Roth withdrawals are tax-free — neither uses cost basis for tax purposes. (Non-deductible IRA contributions tracked on IRS Form 8606 can reduce the taxable portion of withdrawals via the pro-rata rule, but this is typically a small amount and is not currently modeled.  If you have significant non-deductible IRA basis, this will slightly overstate your tax liability.)

### Stock Allocation {#stock-allocation}

The stock percentage (equity allocation) determines each account's expected growth rate using long-term historical return assumptions:

- **Equities:** 10% annual return
- **Bonds:** 4% annual return
- **Formula:** stock% × 10% + bond% × 4%

Examples: 80/20 → 8.8%, 60/40 → 7.6%, 40/60 → 6.4%

**What does this mean for your plan?** Higher stock allocations mean faster growth but more volatile returns — a 90/10 portfolio might gain 20% one year and lose 15% the next. Lower stock allocations are smoother but grow more slowly, which can matter over a 30-year retirement. A common guideline is to hold roughly your age in bonds (e.g., 70% stocks at age 30, 40% at age 60), but there's no single right answer — it depends on your risk tolerance and how much you need the portfolio to grow.

The effective growth rate is shown on each account's summary row. For brokerage (taxable) accounts, annual tax drag is subtracted — stock dividends and bond interest are taxed each year, reducing effective growth. Tax-sheltered accounts (IRA, 401k, Roth) grow at the full nominal rate with no drag.

If not set, each account type has a default stock allocation (e.g., 60% for brokerage, 80% for Roth).
