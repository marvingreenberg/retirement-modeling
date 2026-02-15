# Application Details

Background information on how the retirement simulation works and the assumptions behind it. This content may be integrated into the UI as contextual help or tooltips.

## Tax Bracket Inflation Indexing

The IRS annually adjusts federal tax brackets, the standard deduction, IRMAA thresholds, and capital gains brackets using **Chained CPI-U** (C-CPI-U), a measure of consumer inflation. This keeps bracket thresholds roughly in line with rising prices so that inflation alone doesn't push people into higher brackets ("bracket creep").

The simulation applies this indexing using the configured inflation rate as a proxy for Chained CPI-U. The difference between general CPI and Chained CPI-U is typically ~0.2-0.3% per year — small enough that the proxy is reasonable for planning purposes. The alternative — using fixed 2024-dollar brackets for a 30-year simulation — dramatically overstates tax liability in later years and biases withdrawal strategies toward being overly conservative.

Note: Legislative changes to tax policy (like TCJA in 2017) are a separate concern handled by tax regime sampling in Monte Carlo simulations, not by inflation indexing.

## Spending Strategies

### Fixed Dollar
Uses a configured annual spending amount, adjusted for inflation each year. This is the only strategy where "desired income" directly controls spending.

### Percent of Portfolio (4% Rule)
Withdraws a fixed percentage of current portfolio value each year. Spending rises and falls with the portfolio — there is no target income. The default rate is 4%, based on the widely-cited Trinity Study finding that a 4% initial withdrawal rate historically survived 30-year periods.

### Guardrails (Guyton-Klinger)
Starts with an initial withdrawal rate applied to the portfolio balance, then adjusts spending up or down when the current withdrawal rate drifts beyond configurable floor/ceiling bands (default ±20% of the initial rate). Adjustments are ±10% of current spending. This provides more stability than pure percent-of-portfolio while still responding to market conditions.

### RMD-Based
Withdraws based on IRS Required Minimum Distribution divisor tables, applied to the full portfolio (not just pre-tax accounts). Before age 72, uses a conservative 1/30 rate (~3.3%). After 72, uses the IRS Uniform Lifetime Table divisors which increase the withdrawal rate with age. You mathematically cannot outlive your money with this strategy, but income varies significantly.

## Social Security Benefit Formula

The simulation computes SS benefits using the actual actuarial adjustment formula:

- **Early claiming (before FRA):** Benefit is reduced by 5/9 of 1% per month for the first 36 months early, and 5/12 of 1% per month beyond 36 months. Claiming at 62 (with FRA 67) reduces the benefit to about 70% of the FRA amount.
- **Delayed claiming (after FRA):** Benefit increases by 2/3 of 1% per month (8% per year) for each month delayed past FRA, up to age 70. Claiming at 70 increases the benefit to about 124% of the FRA amount.
- **Taxability:** The simulation applies 85% taxability to SS income, which is the rate for most retirees with significant other income. The actual IRS rules have 0%/50%/85% tiers based on combined income.

## Income Stream COLA

Income streams (pensions, annuities, etc.) can have a per-stream cost-of-living adjustment (COLA) rate. The effective amount in any year is `base_amount × (1 + cola_rate) ^ years_active`, where `years_active` is the number of years since the stream started. Year 0 (the start age) uses the base amount with no adjustment.
