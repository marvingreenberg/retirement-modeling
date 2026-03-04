## Monte Carlo Simulation

Monte Carlo simulation stress-tests a retirement plan against historical market variability rather than assuming a single fixed growth rate and inflation.

### How It Works

Instead of one simulation with constant rates, Monte Carlo runs many simulations (default: 1000), each using a different sequence of annual returns and inflation sampled from historical data (1928 to present). This captures the real-world pattern of market volatility — booms, crashes, and recoveries in varying orders.

Each iteration samples a contiguous block of historical years (with wrap-around), preserving the correlation between returns and inflation that existed in the actual data. This is more realistic than independently randomizing each year.

### Configured Growth and Inflation Are Not Used

In Monte Carlo mode, the configured growth rate and inflation rate settings are **overridden** by the historical data. Each iteration uses the actual returns and inflation from its sampled year sequence. The configured values only apply to single deterministic simulations.

### Iterations

The number of iterations controls how many random sequences are simulated. More iterations produce more stable percentile estimates but take longer to compute.

- **500** — Fast, reasonable for quick exploration. Percentile estimates may shift slightly between runs.
- **1000** (default) — Good balance of stability and speed. Median and middle percentiles are reliable.
- **2000+** — Tail percentiles (5th, 95th) stabilize. Useful when extreme scenarios matter for planning.

Results are displayed as percentile bands on a fan chart (see Outcome Distribution), showing the range of possible outcomes rather than a single projected path.

### Tax Regime Sampling

Monte Carlo can optionally vary the tax regime across iterations, sampling from historical federal tax bracket structures. This models the uncertainty of future tax policy — whether rates will rise, fall, or restructure over a 30+ year retirement.
