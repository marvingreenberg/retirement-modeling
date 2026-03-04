## Balance Chart

The balance chart shows the projected value of all accounts over the simulation timeline as a stacked area chart. Each colored band represents a different account category, stacked to show both individual and total portfolio value.

### Account Colors

<!-- if:has_pretax -->

**Pre-tax (red)** — Traditional IRA, 401(k), 403(b), 457(b), SEP IRA, and SIMPLE IRA balances. These accounts are tax-deferred: withdrawals are taxed as ordinary income, and RMDs apply starting at the configured RMD age.

<!-- endif -->
<!-- if:has_roth_conversion -->

**Roth Conversion (purple)** — Funds that were converted from pre-tax accounts into Roth. Tracked separately to distinguish converted funds from direct Roth contributions. Withdrawals are tax-free.

<!-- endif -->
<!-- if:has_roth -->

**Roth (green)** — Roth IRA and Roth 401(k) balances. These grow tax-free and qualified withdrawals are untaxed. Not subject to RMDs (Roth IRA).

<!-- endif -->
<!-- if:has_brokerage -->

**Brokerage (gold)** — Taxable investment account balances. Subject to annual tax drag on dividends and realized gains. Withdrawals are partially taxed based on the cost basis ratio.

<!-- endif -->
<!-- if:has_cash -->

**Cash (blue)** — Savings accounts and CDs. Minimal growth, typically withdrawn first.

<!-- endif -->

### Chart Features

A **dashed vertical line** marks the retirement age, showing when the transition from accumulation to withdrawal begins.

**Event icons** may appear along the top of the chart indicating significant events: Social Security claiming, RMD start, income stream changes, and planned expenses. Hover over icons for details.

### Reading the Chart

When the total portfolio value trends upward or stays flat, the plan is sustainable. A downward slope indicates drawdown — normal in retirement, but reaching zero before the end of the timeline signals the portfolio is depleted.

**What to look for:** Watch how the colored bands shift over time — if the pre-tax (red) band shrinks while Roth (green) grows, that's Roth conversions at work, moving assets from taxable to tax-free. A large pre-tax band persisting into the late years suggests potential RMD pressure and possibly higher taxes. If brokerage (gold) disappears early, spending is being funded from tax-advantaged accounts — check whether that's optimal for your tax situation.
