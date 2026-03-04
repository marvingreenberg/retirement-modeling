## Spending Strategies

The spending strategy determines how much is withdrawn from the portfolio each year to fund retirement expenses.

### Strategy Selection

Three strategies are available:

**Fixed Dollar** — Uses a configured annual spending amount, adjusted for inflation each year. This is the simplest approach: set a target and the simulation inflates it annually. The "desired income" field directly controls spending.

**Percent of Portfolio** — Withdraws a fixed percentage of the current portfolio value each year. Spending rises and falls with the portfolio — there is no fixed target. The default rate is 4%, based on the Trinity Study finding that a 4% initial withdrawal rate historically survived most 30-year periods. Because spending tracks portfolio value, bad market years automatically reduce withdrawals.

**Guardrails (Guyton-Klinger)** — A hybrid approach that starts with an initial withdrawal rate applied to the starting portfolio balance, then adjusts spending when the effective withdrawal rate drifts outside configurable bands.

### Guardrail Floor

The floor band sets the lower boundary for the withdrawal rate as a fraction of the initial rate. The default is 80% (0.80). When the portfolio grows enough that the current withdrawal rate drops below `initial_rate x floor_percent`, spending is increased by the adjustment percentage. This prevents under-spending in strong markets.

### Guardrail Ceiling

The ceiling band sets the upper boundary. The default is 120% (1.20). When the portfolio drops enough that the current withdrawal rate exceeds `initial_rate x ceiling_percent`, spending is reduced by the adjustment percentage. This protects against over-spending in down markets.

Adjustments are applied as a percentage of current spending (default ±10%). Between the floor and ceiling, spending simply tracks inflation — no adjustment is made.
