# Detail Pane Improvements

## AGI Display

The displayed AGI should include the Roth conversion amount (verify — it may already).

## Effective Tax Rate (replaces Tax Bracket column)

Replace the "Bracket" column with an effective tax rate:

```
effective_rate = (cap_gains_tax + income_tax + conv_tax) / (total_withdrawals + total_income)
```

Display as `nn.n%` with color coding:
- Below 18%: green
- 18% to 23%: gradient from green → yellow → orange → red
- Above 23%: red

## Withdrawal Plan Changes

### Single year, side-by-side layout

Show one year instead of two. Sources and Uses displayed side by side (two columns). Roth Conversion section stays below Uses in the same column, with its own section divider.

### Linked to detail row selection

The Withdrawal Plan updates to show whichever detail row is selected in the table below. Initially show the first row.

## Column Reorder and Cleanup

Remove the Age column. New column order:

```
Year | Total Balance | AGI | Effective Tax Rate | Spending | (401k Dep) | Income Tax | (Cap Gains Tax) | (Conv Tax) | ∑ Tax PV | (Roth Conv) | (IRMAA) | (Income) | (Brokerage WD) | (PreTax WD) | (Roth WD)
```

- Brokerage WD includes cash withdrawals
- Columns in `()` are hidden when the entire column is zero across all years
- Hidden columns are still included in CSV/JSON export

## Column Headers

Use two-line headers to keep columns narrow:

```
Total        Conversion      Capital
Balance         Tax         Gains Tax
```

## ∑ Tax PV Column

Accumulated sum of the present value of all taxes paid, running total across years.
