# Retirement Simulation Strategies

This document explains the spending strategies and Roth conversion strategies available in the retirement simulation tool. These strategies are designed to be used during your retirement years, when you are drawing income from your savings.

## Monte Carlo Considerations

When running with `--with-montecarlo`, the simulation uses historical S&P 500 returns (1928-2023, averaging 11.7% nominal) paired with historical inflation. This is higher than typical conservative planning assumptions (5-7%).

The Monte Carlo shows what would have happened historically, while the single-run simulation uses your configured (usually conservative) assumptions. Both are useful:
- **Single run**: Flexible Conservative planning baseline
- **Monte Carlo**: Range of historical outcomes, useful for stress-testing

## Spending Strategies

Spending strategies control how much you withdraw from your portfolio each year to live on in retirement.

### Fixed Dollar (`fixed_dollar`)

**How it works**: Withdraw a fixed amount (e.g., $100,000) adjusted for inflation each year. Adjusting for inflation preserves the purchasing power of the amount over time.

**Example**: Start with $100K/year. If your expenses increase by 3% due to inflation, you would withdraw $103K in the second year, and so on.

**When to use**: You want a predictable and stable income throughout retirement, regardless of market conditions. This is suitable for retirees who have consistent expenses.

**Risk**: In bad markets, withdrawing a fixed amount may accelerate the depletion of your portfolio.

---

### Percent of Portfolio (`percent_of_portfolio`)

**How it works**: Withdraw a fixed percentage (e.g., 4%) of your portfolio's current value each year.

**Example**: $2M portfolio at 4% = $80K. If the portfolio drops to $1.5M the next year, the withdrawal decreases to $60K.

**When to use**: You are flexible with your annual income and want your withdrawals to automatically adjust to market performance. This method makes it very unlikely you will ever run out of money.

**Risk**: Your income is not stable and will fluctuate with the market, which can make budgeting difficult.

---

### Guardrails / Guyton-Klinger (`guardrails`)

**How it works**: This is a dynamic withdrawal strategy that adjusts spending based on how your portfolio is performing. It starts with a base withdrawal rate and then adjusts spending up or down if your withdrawal rate hits certain "guardrails." The specific implementation in this tool uses the following logic:

- If the current withdrawal rate drops below a lower "floor" (e.g., 3%), it suggests you can afford to spend more, so your spending for the next year increases by a set percentage (e.g., 10%) plus inflation.
- If the current withdrawal rate exceeds an upper "ceiling" (e.g., 6%), it suggests your spending is too high, so your spending for the next year is cut by a set percentage (e.g., 10%).
- If the withdrawal rate is between the floor and the ceiling, your spending is simply adjusted for inflation.

This approach is inspired by, but not identical to, the original Guyton-Klinger rules, which have more complex adjustments.

**When to use**: You want a mostly stable income in retirement but are willing to make adjustments during extreme market conditions. It's a compromise between the stability of the Fixed Dollar strategy and the safety of the Percent of Portfolio strategy.

**Risk**: Requires the discipline to reduce your spending when the rules dictate. The adjustments can still lead to some income volatility.

---

### RMD-Based (`rmd_based`)

**How it works**: Withdraw an amount each year based on the IRS's Required Minimum Distribution (RMD) formula. The RMD is calculated by dividing your tax-deferred account balance by a life expectancy factor from the IRS.

**Example**: At age 73, the IRS divisor is approximately 26.5. If you have $1 million in your IRA, your RMD would be about $37,735 ($1,000,000 / 26.5).

**When to use**: You want a systematic approach that automatically increases withdrawal rates as you age, reflecting shorter remaining time horizon. Mathematically ensures you won't outlive your money (though the amount may become small).

**Risk**: Early years have low withdrawal rates, so you may underspend when you're healthiest and most able to enjoy it.

---

## Roth Conversion Strategies

Roth conversion strategies determine how much money you move from tax-deferred accounts (like a Traditional IRA or 401k) to a Roth IRA each year during retirement. This can help manage your tax liability, especially before Required Minimum Distributions (RMDs) begin.

**Important**: Tax laws, including income brackets and IRMAA thresholds, change over time. The values used are for the 2024 tax year.  This application indexes tax
brackets -- increases them over time -- as current tax law does.

### Standard (`standard`)

**How it works**: No voluntary Roth conversions are made. You only withdraw from your tax-deferred accounts when required by the RMD rules.

**When to use**:
- You are in a high tax bracket -- perhaps one spouse is still working --   and expect to be in a lower one for the remainder of your retirement.
- You want to minimize your tax bill in the present.
- You need to preserve cash, as conversions require paying taxes now.

---

### IRMAA Tier 1 (`irmaa_tier_1`)

**How it works**: Convert just enough from your traditional IRA/401k to a Roth account to bring your Modified Adjusted Gross Income (MAGI) right up to the threshold for the first tier of IRMAA. For 2024, this threshold is **$206,000** for those married filing jointly. This strategy avoids the Medicare premium surcharges that come with higher income levels.

**IRMAA** (Income-Related Monthly Adjustment Amount) is an extra charge added to your Medicare Part B and Part D premiums if your income is above a certain level.  The surcharge can be $2000-$5000/year or more for very high income.

**When to use**: You are on Medicare (or will be soon) and want to do Roth conversions without increasing your Medicare premiums. This is a good balance between the benefits of conversions and the cost of IRMAA.

---

### 22% Bracket (`22_percent_bracket`)

**How it works**: Convert enough money to "fill up" the 22% federal income tax bracket. For 2024, for those married filing jointly, this means converting enough to bring your taxable income up to **$201,050**.

**When to use**: You are in a low-income "gap" period of retirement (e.g., after you've stopped working but before Social Security and RMDs begin) and you expect your income to be higher later in retirement. This allows you to pay taxes at a known, lower rate now.

---

### 24% Bracket (`24_percent_bracket`)

**How it works**: Convert enough money to "fill up" a portion or all of the 24% federal income tax bracket. For 2024, for those married filing jointly, this bracket ends at **$383,900**.

**When to use**: You have a very large pre-tax balance and want to aggressively convert funds in your early retirement years before RMDs begin. This is for those willing to pay a 24% tax rate now to avoid potentially higher tax rates (e.g., 32%+) in the future.

**Trade-off**: This strategy will likely trigger IRMAA surcharges if you are on Medicare. You should weigh the long-term tax benefits of the Roth conversion against the short-term cost of higher Medicare premiums.

---

### Deeper Dive: The Roth Conversion vs. IRMAA Trade-Off

The core idea of a Roth conversion in retirement is to strategically pay taxes now (at what you hope is a lower rate) to avoid being forced into a higher tax bracket later when Required Minimum Distributions (RMDs) begin. However, for retirees on Medicare, this calculation is complicated by IRMAA.

**What is IRMAA?**

IRMAA is a surcharge you pay on your Medicare Part B (medical) and Part D (prescription drug) premiums if your Modified Adjusted Gross Income (MAGI) from **two years prior** exceeds certain thresholds. Since Roth conversions are included in your MAGI, a large conversion can trigger these surcharges.

**The Cost: How much is the IRMAA "Penalty"?**

The "penalty" isn't a one-time fee; it's a significant increase in your monthly Medicare premiums for an entire year. The amounts are adjusted annually for inflation.

For example, here are the **2026 IRMAA surcharges**, which are based on your **2024 MAGI**:

| 2024 MAGI (Married Filing Jointly) | Monthly Part B Surcharge (per person) | Monthly Part D Surcharge (per person) | Total Annual Surcharge (for a couple) |
| :--- | :--- | :--- | :--- |
| Up to $206,000 | $0 | $0 | **$0** |
| $206,001 - $258,000 | +$70.00 | +$13.20 | **+$1,996.80** |
| $258,001 - $322,000 | +$174.70 | +$34.30 | **+$5,016.00** |
| $322,001 - $386,000 | +$279.50 | +$55.40 | **+$8,037.60** |
| $386,001 - $750,000 | +$384.30 | +$76.40 | **+$11,056.80** |
| Above $750,000 | +$419.30 | +$82.40 | **+$12,040.80** |

*Note: These are based on 2024 figures and will change. Single filers have different thresholds.*

As you can see, the surcharges are substantial. A couple whose income pushes them from $206,000 to $259,000 would pay an extra **$5,016** in Medicare premiums for that year. Because of the two-year lookback, a large Roth conversion in 2024 results in higher premiums in 2026. This effect is temporary; if your income goes back down in 2025, your premiums will revert to the standard amount in 2027.

**The Benefit: Why Pay More Taxes Now?**

The primary benefit is to reduce future RMDs. RMDs start at age 73 (or 75, depending on your birth year) and are calculated based on your tax-deferred account balance. For individuals with large pre-tax savings (e.g., over $1.5 million), RMDs can be substantial and, when combined with other income like pensions and Social Security, can push them into a much higher tax bracket (e.g., 32%, 35%, or even 37%).

**When does a "Fill the Bracket" strategy make sense?**

This strategy is most effective for retirees who find themselves in a temporary "tax trough"—the years after they stop working but before RMDs and potentially Social Security begin.

*   **Ideal Candidate:** A 65-year-old couple with $2 million in a traditional 401(k)/IRA and other income of $80,000/year. Their current taxable income is low, placing them in the 12% or 22% bracket.
*   **The Problem:** At age 75, their RMDs could be $80,000+, pushing their total income well into the 24% or even 32% bracket.
*   **The Strategy:** In the years from age 65 to 74, they can strategically convert amounts to their Roth IRA, "filling up" the 22% or 24% brackets each year. They are choosing to pay taxes at 22/24% now to avoid paying 32%+ later.
*   **The Trade-Off:** In doing this, they might perform a conversion that brings their MAGI to $300,000. For that year, they would pay the income tax on the conversion PLUS an extra $5,016 in Medicare premiums two years later. The bet is that this combined cost is *still less* than the higher taxes they would have paid on RMDs for the rest of their lives.

This strategy is about long-term optimization. It's a calculated decision to accept a known, manageable cost today to avoid a potentially larger, less controllable tax burden in the future.
