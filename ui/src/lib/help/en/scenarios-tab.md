## Scenarios & Comparison

The unified results view lets you build up a list of simulation runs and compare them side by side.

### Approach vs Scenarios

The results panel has two top-level tabs:

- **Approach** — configure the simulation: inflation, growth, spending strategy, conversion strategy, withdrawal order, and Monte Carlo iteration count
- **Scenarios** — the saved runs from this session, shown as a selectable table

Click **Simulate** in the Approach tab to run with the current settings. The result is appended to the Scenarios table, the new row is auto-selected, and the view switches to Scenarios.

### How runs are saved

Every Simulate click adds (or replaces) one row in Scenarios. Each row records the settings used and the resulting metrics.

- **Same settings re-run** — the existing row is _replaced_ with the new results (deduped by inflation rate, growth mode, spending strategy, conversion strategy, and withdrawal order)
- **Different settings** — a new row is appended
- **Portfolio inputs change** (accounts, balances, ages, income streams) — the entire Scenarios table is _cleared_ because the old runs are no longer comparable. You'll see a notice when this happens.

### Selecting scenarios

Click any row's checkbox to select it for viewing. Up to **two** scenarios can be selected at once.

- One selected → the result panes (Balance / Spending / Monte Carlo / Details) show that single scenario
- Two selected → result panes show both side by side for direct comparison

The **×** button on a row removes it. **Clear All** removes everything.

### Columns

- **Withdrawal** — the spending strategy and withdrawal order priority
- **Conversion** — the Roth conversion strategy
- **Final Balance** — the simulation's ending portfolio value
- **After-Tax Final Balance** — the same value adjusted for embedded tax liability on pre-tax accounts. This is usually the more meaningful comparison than raw Final Balance — see the _After-Tax Balance_ topic for how it's computed and why brokerage isn't discounted.
- **Total Taxes (PV)** — lifetime taxes paid in present-value dollars
- **Success Rate** — Monte Carlo success percentage (if MC was run)

### Tips

- Run the same configuration with two different conversion strategies to see the after-tax impact
- Switch withdrawal order (brokerage-first vs IRA-first) on an otherwise identical run to see the trade-off
- Use the side-by-side **Details** tab to drill into a specific year and see exactly where the strategies diverge
- The **Balance** tab tooltips show the year's after-tax estimate alongside the raw total
