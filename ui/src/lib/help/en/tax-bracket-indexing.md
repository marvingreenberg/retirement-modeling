## Tax Bracket Indexing

The IRS annually adjusts federal tax brackets, the standard deduction, IRMAA thresholds, and capital gains brackets using **Chained CPI-U** (C-CPI-U), a measure of consumer inflation. This indexing keeps bracket thresholds roughly aligned with rising prices so that inflation alone doesn't push people into higher brackets — a phenomenon known as "bracket creep."

### Why It Matters

Without indexing, a 30-year simulation would use fixed dollar amounts for tax brackets. As inflation compounds, incomes that start in the 12% bracket would gradually cross into 22%, then 24%, purely from inflation — not from real income growth. This would dramatically overstate tax liability in later years and bias withdrawal strategies toward being overly conservative.

### How the Simulation Handles It

The simulation uses the configured inflation rate as a proxy for Chained CPI-U when indexing brackets each year. The actual difference between general CPI and Chained CPI-U is typically 0.2-0.3% per year — small enough that the proxy is reasonable for planning purposes.

All dollar-denominated tax parameters are indexed: federal income tax brackets, the standard deduction, long-term capital gains thresholds, and IRMAA tier boundaries.

### Monte Carlo Tax Regimes

In Monte Carlo mode, the simulation can optionally sample historical tax regimes (different bracket structures from different eras) to account for the possibility that tax policy may change over a 30+ year retirement. This is separate from inflation indexing — it models legislative changes like the Tax Cuts and Jobs Act (TCJA), not annual CPI adjustments.
