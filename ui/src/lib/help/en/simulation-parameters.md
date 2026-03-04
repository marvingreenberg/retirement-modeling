## Simulation Parameters

These global settings control the economic assumptions used across all simulation years.

### Inflation

The assumed annual rate of price increases, applied to spending targets, tax bracket indexing, and COLA adjustments. The default is 3%.

Higher inflation erodes purchasing power faster, requiring larger withdrawals to maintain the same lifestyle. It also affects tax bracket thresholds — brackets are indexed to inflation so that rising prices alone don't push income into higher brackets.

In Monte Carlo mode, this configured value is **not used** — historical inflation rates from the sampled year sequences are applied instead.

### Growth Rate

The assumed annual investment return applied to all accounts. The default is 7%, which approximates the long-term nominal return of a diversified stock portfolio.

This is a nominal rate (before subtracting inflation). A 7% growth rate with 3% inflation implies roughly 4% real growth. More conservative portfolios (heavy in bonds or cash) may warrant a lower assumption — 4-5% nominal is common for balanced portfolios.

In Monte Carlo mode, this configured value is **not used** — historical market returns from the sampled year sequences are applied instead. The growth rate setting only matters for single deterministic simulations.
