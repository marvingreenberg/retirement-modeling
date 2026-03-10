## Income & COLA

Income streams represent recurring money flowing into the portfolio during the simulation — employment wages, pensions, rental income, and other sources. Each stream has a start age, optional end age, and annual amount.

### Income Types

- **Employment** — Wages or salary. Can include pre-tax 401k and Roth 401k contributions that are deducted from the gross amount and routed to the appropriate retirement accounts.
- **Pension** — Defined benefit pension payments. Typically start at retirement and continue for life.
- **Rental** — Income from real estate or other rental properties.
- **Other** — Any other recurring income source (annuities, royalties, part-time work, etc.).

Social Security is configured separately through its own dedicated section, not as a generic income stream.

### Current Salary

When a retirement age is set and is more than one year away, a **Current Salary** section appears above Other Income. This provides a compact way to enter working-years salary for the primary earner (and spouse, if applicable) without manually creating income streams.

Fields per earner:

- **Salary ($/yr)** — current annual gross salary
- **Growth %** — expected annual salary growth (default 3%)
- **End Year** — when salary stops (defaults to retirement year)
- **Pre-tax 401k / Roth 401k** — annual contribution amounts, routed to retirement accounts

The salary section automatically creates employment income streams behind the scenes. These are hidden from the Other Income list to avoid duplication.

### COLA (Cost of Living Adjustment)

Each income stream can have its own COLA rate, representing annual increases to keep pace with inflation. The effective amount in any year is:

`base_amount x (1 + cola_rate) ^ years_active`

where `years_active` is the number of years since the stream started. Year 0 (the start age) uses the base amount with no adjustment.

A pension with a 2% COLA and $30,000 base amount would pay $30,000 in year 0, $30,600 in year 1, $31,212 in year 2, and so on. Setting COLA to 0 means the nominal amount stays flat — which sounds fine at first, but over 20 years at 3% inflation, a flat $30,000 has the purchasing power of about $16,600 in today's dollars. If your pension has no COLA, plan for this erosion.

### Taxability

Each income stream has a taxable percentage. Most income is fully taxable (100%), but some sources like municipal bond income or return-of-capital distributions may be partially or fully tax-exempt.
