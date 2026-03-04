## Social Security

Social Security benefits are modeled using the actual actuarial adjustment formulas applied by the SSA. The key input is the Full Retirement Age (FRA) benefit amount — what the SSA projects at age 67 (for most current workers).

### Claiming Age

Benefits can be claimed between ages 62 and 70. The claiming age significantly affects the monthly amount:

- **Early claiming (before FRA):** Benefits are reduced by 5/9 of 1% per month for the first 36 months early, and 5/12 of 1% per month beyond that. Claiming at 62 with an FRA of 67 reduces the benefit to approximately 70% of the FRA amount.
- **At FRA (age 67):** The full benefit amount is received.
- **Delayed claiming (after FRA):** Benefits increase by 2/3 of 1% per month (8% per year) for each month delayed past FRA, up to age 70. Claiming at 70 increases the benefit to approximately 124% of the FRA amount.

**When to claim early vs. late?** Claiming early makes sense if you need the income now, have health concerns that reduce life expectancy, or want to reduce portfolio withdrawals during a market downturn. Delaying to 70 is a better deal if you expect to live past ~82 (the typical breakeven age) and can fund spending from other sources in the meantime. Each year of delay is effectively an 8% guaranteed return — hard to beat elsewhere.

### Spousal Benefits

If both spouses have Social Security benefits, each is configured independently with separate FRA amounts and claiming ages. The simulation models both benefit streams with their respective start ages.

### Taxability

The simulation applies 85% taxability to Social Security income. This is the rate that applies to most retirees with significant other income. The actual IRS rules use a tiered system (0%, 50%, or 85% taxable) based on "combined income" (AGI + nontaxable interest + half of SS benefits), but the vast majority of retirees with investment income fall into the 85% tier.

### COLA

Social Security benefits receive annual cost-of-living adjustments (COLA), based on the Consumer Price Index. The COLA rate is configurable per-benefit — the default is 2.5%, which matches the long-term historical average. Recent years have seen higher adjustments (5.9% in 2022, 8.7% in 2023) due to elevated inflation, but those are outliers.

Setting COLA to 0% models benefits that stay flat in nominal terms — useful for a conservative "what if Congress freezes adjustments?" scenario. The actual COLA is applied each year after claiming begins, compounding over time.
