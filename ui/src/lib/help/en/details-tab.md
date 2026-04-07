## Details Tab

The **Details** tab shows two views of the selected scenario(s): the year-specific Withdrawal Plan card and the year-by-year breakdown table.

### Withdrawal Plan Card

A cash-flow breakdown for the highlighted year, organized into Sources and Uses (with Roth Conversion as a separate full-width row when present):

- **Sources** — RMDs, income streams (Social Security, pensions, employment), and withdrawals from accounts grouped by purpose (spending, tax)
- **Uses** — base spending, planned expenses, taxes (Federal Income, State, Capital Gains, Conversion), IRMAA surcharges, employer 401(k) deposits, and any reinvested surplus
- **Roth Conversion** — when present, shown below the columns with per-account amounts

The accounting identity holds — Sources total equals Uses total — so you can verify where every dollar came from and went.

### Year-by-Year Table

Each row is one simulation year. Click a row to update the Withdrawal Plan card above for that year.

Key columns:

- **Year** / **Total Balance** / **AGI**
- **Eff Tax Rate** — combined federal + state + capital gains burden as a percentage of total cash flow. Color-coded: green below 18%, blending to red at 23%+.
- **Spending** — total spending (base + planned expenses)
- **Income Tax** — federal ordinary-income tax (excludes capital gains and conversion tax)
- **State Tax** — flat-rate state income tax (excludes Social Security for VA)
- **Cap Gains Tax** — federal long-term capital gains tax
- **Conv Tax** — federal tax on Roth conversions (state portion is included in State Tax)
- **Roth Conv** — amount converted from pre-tax to Roth that year
- **IRMAA** — Medicare premium surcharge (with 2-year lookback)
- **Income** — total income from all streams
- Per-account withdrawals: **Brok WD**, **PreTax WD**, **RMD**, **Roth WD**

### Conditional Columns

Columns are hidden when their values are zero across all simulated years (e.g., 401k deposits, conversion tax, IRMAA, capital gains tax). This keeps the table readable for simpler scenarios.

### Side-by-Side Comparison

When two scenarios are selected in the Scenarios table, both Details panes appear side by side with **synced scrolling** — change the scroll position in one and the other follows. Click the same year in either to update both Withdrawal Plan cards.

### After-Tax Considerations

The Details table shows raw **Total Balance**, not the after-tax estimate. The after-tax value of each year's balance depends on how much is in pre-tax versus Roth/brokerage — see the _After-Tax Balance_ topic for the formula. For a quick after-tax comparison across scenarios, use the _After-Tax Final Balance_ column in the Scenarios table.

### When to Use Details

The charts show trends; Details shows exact numbers. Use it to:

- Trace exactly how a year's spending was funded
- Understand a chart spike — find the responsible income event or planned expense
- Verify the federal vs. state vs. capital gains tax breakdown
- Check that income streams start and stop at the right ages
- See how Roth conversions interact with tax brackets year by year
