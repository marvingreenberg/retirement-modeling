## Social Security

Social Security benefits are modeled using the actual actuarial adjustment formulas applied by the SSA. The key input is the Full Retirement Age (FRA) benefit amount — what the SSA projects at age 67 (for most current workers).

### Claiming Age

Benefits can be claimed between ages 62 and 70. The claiming age significantly affects the monthly amount:

- **Early claiming (before FRA):** Benefits are reduced by 5/9 of 1% per month for the first 36 months early, and 5/12 of 1% per month beyond that. Claiming at 62 with an FRA of 67 reduces the benefit to approximately 70% of the FRA amount.
- **At FRA (age 67):** The full benefit amount is received.
- **Delayed claiming (after FRA):** Benefits increase by 2/3 of 1% per month (8% per year) for each month delayed past FRA, up to age 70. Claiming at 70 increases the benefit to approximately 124% of the FRA amount.

### Spousal Benefits

If both spouses have Social Security benefits, each is configured independently with separate FRA amounts and claiming ages. The simulation models both benefit streams with their respective start ages.

### Taxability

The simulation applies 85% taxability to Social Security income. This is the rate that applies to most retirees with significant other income. The actual IRS rules use a tiered system (0%, 50%, or 85% taxable) based on "combined income" (AGI + nontaxable interest + half of SS benefits), but the vast majority of retirees with investment income fall into the 85% tier.

### COLA

Social Security benefits receive annual cost-of-living adjustments. In the simulation, this is handled through the configured inflation rate, which indexes the benefit amount each year after claiming begins.
