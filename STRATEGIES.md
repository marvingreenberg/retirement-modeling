# Retirement Simulation Strategies

This document explains the spending strategies and Roth conversion strategies available in the retirement simulation tool.

## Spending Strategies

Spending strategies control how much you withdraw each year from your portfolio.

### Fixed Dollar (`fixed_dollar`)

**How it works**: Withdraw a fixed amount (e.g., $100,000) adjusted for inflation each year.

**Example**: Start with $100K/year. Year 2 at 3% inflation = $103K. Year 3 = $106K.

**When to use**: You have predictable expenses and want stable, inflation-adjusted income regardless of market conditions. This is the classic "4% rule" approach.

**Risk**: In bad markets, you continue withdrawing the same amount, potentially depleting your portfolio faster.

---

### Percent of Portfolio (`percent_of_portfolio`)

**How it works**: Withdraw a fixed percentage (e.g., 4%) of your current portfolio value each year.

**Example**: $2M portfolio at 4% = $80K. If portfolio drops to $1.5M, withdrawal drops to $60K.

**When to use**: You can tolerate variable income and want spending to automatically adjust to market conditions. Portfolio is very unlikely to deplete since withdrawals shrink as the portfolio shrinks.

**Risk**: Income is unpredictable. Bad market years mean significant spending cuts.

---

### Guardrails / Guyton-Klinger (`guardrails`)

**How it works**: Start with a base withdrawal rate, but adjust spending up or down when your current withdrawal rate crosses certain thresholds.

- If withdrawal rate drops below floor (portfolio grew a lot): increase spending by 10%
- If withdrawal rate exceeds ceiling (portfolio dropped): decrease spending by 10%
- Otherwise: adjust for inflation as usual

**Default thresholds**:
- Floor: 3% (you're withdrawing too little)
- Ceiling: 6% (you're withdrawing too much)

**When to use**: You want mostly stable income but are willing to make adjustments when market conditions are extreme. Balances the stability of fixed-dollar with the safety of percent-of-portfolio.

**Risk**: Requires discipline to actually cut spending when the guardrail triggers.

---

### RMD-Based (`rmd_based`)

**How it works**: Withdraw based on IRS Required Minimum Distribution percentages, which increase with age (roughly: divide portfolio by remaining life expectancy).

**Example**: At 73, divisor is ~26.5, so withdraw 3.8%. At 85, divisor is ~16, so withdraw 6.25%.

**When to use**: You want a systematic approach that automatically increases withdrawal rates as you age, reflecting shorter remaining time horizon. Mathematically ensures you won't outlive your money (though the amount may become small).

**Risk**: Early years have low withdrawal rates, so you may underspend when you're healthiest and most able to enjoy it.

---

## Roth Conversion Strategies

Conversion strategies control how aggressively you convert pre-tax (Traditional IRA/401k) money to Roth accounts. Converting creates taxable income now but provides tax-free growth and withdrawals later.

### Standard (`standard`)

**How it works**: No voluntary Roth conversions. Only take Required Minimum Distributions when mandated.

**When to use**:
- You're already in a high tax bracket
- You expect to be in a lower bracket in retirement
- You need to preserve cash (conversions require paying taxes now)

---

### IRMAA Tier 1 (`irmaa_tier_1`)

**How it works**: Convert up to the IRMAA Tier 1 threshold (~$206,000 AGI for married filing jointly). Stops before triggering Medicare premium surcharges.

**IRMAA** (Income-Related Monthly Adjustment Amount) adds $70-400+/month per person to Medicare Part B and D premiums when income exceeds thresholds.

**When to use**: You're on Medicare (65+) and want to do Roth conversions without incurring the IRMAA penalty. Good balance between conversion benefits and avoiding extra costs.

---

### 22% Bracket (`22_percent_bracket`)

**How it works**: Convert up to the top of the 22% federal tax bracket (~$201,050 for married filing jointly in 2024).

**When to use**: You believe your future tax rate will be 22% or higher, so paying 22% now is a good deal. The 22% bracket is historically low and may increase with future tax law changes.

---

### 24% Bracket (`24_percent_bracket`)

**How it works**: Convert up to the top of the 24% federal tax bracket (~$383,900 for married filing jointly in 2024).

**When to use**: You have substantial pre-tax balances and want aggressive conversion before RMDs force you into higher brackets. Willing to pay 24% now to avoid 32%+ later when RMDs kick in.

**Trade-off**: Will trigger IRMAA surcharges if you're 65+, but the long-term Roth benefits may outweigh the short-term Medicare cost.

---

## Choosing a Strategy

| Situation | Spending Strategy | Conversion Strategy |
|-----------|-------------------|---------------------|
| Predictable expenses, sleep well at night | `fixed_dollar` | `irmaa_tier_1` |
| Large portfolio, can handle variability | `percent_of_portfolio` | `24_percent_bracket` |
| Want balance of stability and safety | `guardrails` | `22_percent_bracket` |
| Very large pre-tax balance, not yet on Medicare | `fixed_dollar` | `24_percent_bracket` |
| On Medicare, want to minimize costs | `guardrails` | `irmaa_tier_1` |
| Conservative, let RMDs handle it | `rmd_based` | `standard` |

## Monte Carlo Considerations

When running with `--with-montecarlo`, the simulation uses historical S&P 500 returns (1928-2023, averaging 11.7% nominal) paired with historical inflation. This is higher than typical conservative planning assumptions (5-7%).

The Monte Carlo shows what would have happened historically, while the single-run simulation uses your configured (usually conservative) assumptions. Both are useful:
- **Single run**: Conservative planning baseline
- **Monte Carlo**: Range of historical outcomes, useful for stress-testing
