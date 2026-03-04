# Review Growth Rates, Tax Drag, and Global Input Growth Rate

## Current Behavior

- **Global `investment_growth_rate`**: Single rate applied to all accounts (except cash_cd which gets 0%).
- **Per-account `stock_pct`**: Only used to compute tax drag on brokerage accounts. Higher stock % = less drag. Effective brokerage rate = `investment_growth_rate - tax_drag(stock_pct)`. Tax-sheltered accounts (IRA, 401k, Roth) get the full global rate.
- **Monte Carlo mode**: Ignores both `investment_growth_rate` and tax drag entirely — generates its own return sequences.
- **Import flow**: Computes a blended estimated return from holdings and sets it as the global `investment_growth_rate`.

## Questions to Consider

0. The initial default global growth rate - it gets saved and is baked into the sample data.
   Use a consistent value for it.  Or is it somehow a function of all the account data?

1. **Per-account growth rates**: Should accounts with different `stock_pct` values grow at different rates in single-run mode too? A 90% equity account and a 40% equity bond-heavy account currently grow at the same nominal rate (minus tax drag for brokerage only). Is that the right model?

2. **Monte Carlo + tax drag**: MC generates random return sequences but `apply_growth` still applies tax drag to brokerage accounts using those MC returns. Is that correct, or should MC also model tax drag differently?

3. **Import-derived growth rate**: The import sets the global growth rate from a weighted average of all imported accounts. If accounts have very different allocations (e.g., aggressive brokerage + conservative bond IRA), a single blended rate may not represent either well.  (Oh - that answers 0). What about imports when for some the QFX doesn't have the type info.

4. **stock_pct scope**: Currently `stock_pct` only affects tax drag. Should it also influence the account's growth rate? e.g., `rate = stock_pct * equity_return + (1 - stock_pct) * bond_return`. This would make single-run mode more realistic but adds complexity.  (Um, 3 and 4 seem to contradict each other)

5. **UI clarity**: The strategy tab growth rate and per-account stock % are not obviously connected. Users may not realize stock_pct only affects tax drag. Consider whether the UI should explain the relationship or whether the model should change to make them interact more intuitively.

