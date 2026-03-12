## Compare View

The Compare page shows simulation results side by side, letting you see how different settings affect outcomes.

### How Snapshots Work

Every time you run a simulation, a snapshot is automatically added to the Compare table. Each snapshot captures the key settings (inflation, growth, spending strategy, conversion strategy, withdrawal order) along with the results.

### What Makes a "Different" Run

The Compare table uses your simulation settings to decide whether a run is new or a repeat:

- **Changed settings** (inflation rate, growth mode, spending strategy, conversion target, withdrawal order) → a **new row** appears
- **Same settings** re-run → the existing row is **replaced** with updated results
- **Changed inputs** (accounts, balances, ages, income streams) → the table is **cleared** because the old snapshots are no longer comparable — they were based on different financial inputs

### How to Use Compare

1. Run a simulation with your current settings
2. Change one setting (e.g., switch from "No Conversion" to "22% Bracket")
3. Run again — both results appear side by side
4. Repeat to build up a comparison across multiple scenarios

The **Clear All** button removes all snapshots and starts fresh.

### Reading the Table

Single Run and Monte Carlo results are shown in separate sections. Key columns:

- **Withdrawal** — spending strategy and withdrawal order priority
- **Final Balance** — ending portfolio value (red if depleted)
- **Total Taxes / IRMAA** — lifetime totals (red highlights indicate high values)
- **Roth Conv Acct** — total converted to Roth over the simulation
- **Spending Range** (Monte Carlo) — range of actual spending across simulated paths
