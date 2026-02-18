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

- **Early claiming (before FRA - Full Retirement Age):** Benefit is reduced by 5/9 of 1% per month for the first 36 months early, and 5/12 of 1% per month beyond 36 months. Claiming at 62 (with FRA 67) reduces the benefit to about 70% of the FRA amount.
- **Delayed claiming (after FRA):** Benefit increases by 2/3 of 1% per month (8% per year) for each month delayed past FRA, up to age 70. Claiming at 70 increases the benefit to about 124% of the FRA amount.
- **Taxability:** The simulation applies the IRS tiered taxability formula: 0% below $32k combined income, 50% between $32k-$44k, and 85% above $44k (for married filing jointly). Combined income is defined as adjusted gross income + nontaxable interest + half of Social Security benefits.

## Income Stream COLA

Income streams (pensions, annuities, etc.) can have a per-stream cost-of-living adjustment (COLA) rate. The effective amount in any year is `base_amount × (1 + cola_rate) ^ years_active`, where `years_active` is the number of years since the stream started. Year 0 (the start age) uses the base amount with no adjustment.

## Roth Conversions

Roth conversions move money from pre-tax retirement accounts into Roth accounts, paying income tax now to avoid it later. This is valuable when current tax rates are lower than expected future rates — common in early retirement before Social Security and RMDs begin.  It is also a factor for higher net-worth families, when later RMDs force higher income, taxed at much higher tax brackets.

**Conversion-eligible accounts:** Only IRA-type accounts (Traditional IRA, SEP IRA, SIMPLE IRA) can be directly converted to Roth. Employer plans (401(k), 403(b), 457(b)) must generally first be rolled over to an IRA before conversion. The simulation models conversion from these sources equivalently, since the extra step can be always be taken.

**Conversion tracking:** Roth conversions are deposited into a separate "Roth Conversions" account to track their growth independently from original Roth contributions. This distinction matters because conversion amounts have a 5-year seasoning period before tax-free withdrawal (though the simulation does not model this constraint). The balance chart shows four layers: Pre-tax, Roth Conversions, Roth, and Brokerage.

**Conversion strategies:** The simulator offers several strategies that limit annual conversion amounts to stay within tax-efficient thresholds:
- **None:** No conversions
- **IRMAA Tier 1:** Convert up to the IRMAA income threshold to avoid Medicare surcharges
- **22% Bracket / 24% Bracket:** Convert up to the top of the specified federal tax bracket

## Required Minimum Distributions (RMDs)

Starting at age 73 (under SECURE 2.0), the IRS requires annual withdrawals from pre-tax retirement accounts based on life expectancy divisors. RMDs apply to all pre-tax account types (IRA, 401(k), 403(b), 457(b), SEP IRA, SIMPLE IRA). Roth IRAs and Roth 401(k)s are exempt from RMDs during the owner's lifetime (SECURE 2.0, effective 2024).

**The "tax time bomb":** Large pre-tax balances force large RMDs which push retirees into higher tax brackets and can trigger IRMAA surcharges. Roth conversions before RMD age can reduce this exposure.

**Aggregation rules:** An individual with multiple IRAs can take the total RMD amount from any of the IRA accounts. However, 401(k) and 457(b) plans require separate RMD withdrawals from each account. The simulation computes RMDs per owner across all their pre-tax accounts.

## Cost Basis by Account Type

Cost basis ratio represents what fraction of an account's value is original contributions (not gains). This affects taxation on withdrawals:

- **Pre-tax accounts (IRA, 401(k), 403(b), etc.):** Cost basis 0% — all withdrawals are taxed as ordinary income since contributions were tax-deductible
- **Roth accounts (Roth IRA, Roth 401(k), Roth Conversions):** Cost basis 100% — withdrawals are tax-free (contributions were after-tax)
- **Cash/CD:** Cost basis 100% — no tax on withdrawal of principal (interest taxed as earned, not modeled)
- **Brokerage:** Variable (default 40%) — only the gains portion (1 - cost_basis_ratio) is subject to capital gains tax on withdrawal

## Capital Gains vs Ordinary Income

Brokerage account withdrawals are taxed differently from pre-tax account withdrawals:
- **Pre-tax withdrawals:** Taxed as ordinary income (federal brackets + state tax)
- **Brokerage withdrawals:** Only the gains portion is taxed, using progressive capital gains brackets (0%/15%/20%) that stack on top of ordinary income. Long-term capital gains fill brackets starting from the taxpayer's ordinary income level.

This distinction means brokerage accounts are more tax-efficient for withdrawals when the effective capital gains rate is lower than the marginal income tax rate.
