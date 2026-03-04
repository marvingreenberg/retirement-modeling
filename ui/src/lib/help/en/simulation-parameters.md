## Simulation Parameters

These global settings control the economic assumptions used across all simulation years.

### Inflation

The assumed annual rate of price increases, applied to spending targets, tax bracket indexing, and COLA adjustments. The default is 3%.

Higher inflation erodes purchasing power faster, requiring larger withdrawals to maintain the same lifestyle. It also affects tax bracket thresholds — brackets are indexed to inflation so that rising prices alone don't push income into higher brackets.

In Monte Carlo mode, this configured value is **not used** — historical inflation rates from the sampled year sequences are applied instead.

### Conservative Growth {#conservative-growth}

By default, each account grows at a rate determined by its stock/bond allocation (see Stock Allocation in Accounts & Tax Treatment). Enable "Conservative growth assumptions" to reduce all account growth rates by 25%, modeling a lower-return environment.

For example, a 60/40 account normally grows at 7.6%. With conservative growth enabled, it grows at 5.7% (7.6% × 0.75).

This setting only affects single deterministic simulations. In Monte Carlo mode, historical market returns are sampled directly and this setting has no effect.
