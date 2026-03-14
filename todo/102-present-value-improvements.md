# Present Value Improvements

## PV Toggle

Add a slider (on/off) to display charts and summary metrics in present value dollars, dividing by `(1 + inflation_rate) ^ year_index`.

## What changes when PV is enabled

- **Charts:** Balance chart, fan chart y-axis values converted to PV $
- **Summary metrics:** Total Taxes, Total IRMAA, Spending Range displayed as PV $
- **Detail table:** ∑ Tax PV column (see todo/101) always shows PV; other columns optionally if toggle is on
- **Headers:** Append "(PV $)" to affected column/metric headers when PV mode is active

## Help Link

Add a `(?)` help button next to the PV toggle linking to a help topic explaining:
- What present value means
- Why it matters when comparing dollar amounts across a 30-year horizon
- Example: "$100K in year 20 at 3% inflation is ~$55K in today's dollars"
