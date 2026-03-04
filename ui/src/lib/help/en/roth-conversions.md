## Roth Conversions

A Roth conversion moves money from a pre-tax account (Traditional IRA, 401k, etc.) into a Roth account. The converted amount is taxed as ordinary income in the year of conversion, but all future growth and withdrawals from the Roth account are tax-free.

### Why Convert?

Converting pre-tax funds to Roth can reduce lifetime taxes when done strategically — particularly in years with low other income (early retirement before Social Security starts, for example). The goal is to pay taxes at today's lower brackets to avoid paying at higher effective rates later, when RMDs, Social Security, and other income may push income into higher brackets.

### Conversion Strategy

The conversion strategy controls how aggressively the simulation converts pre-tax balances each year:

- **No Conversion** (standard) — No automatic conversions are performed.
- **IRMAA Tier 1** — Converts up to the point where adjusted gross income (AGI) stays below the first IRMAA threshold (~$206,000 for married filing jointly). This avoids triggering Medicare premium surcharges while still converting meaningfully.
- **Fill 22% Bracket** — Converts enough to fill up to the top of the 22% federal tax bracket. Useful when current income is well below that boundary.
- **Fill 24% Bracket** — Converts enough to fill up to the top of the 24% federal tax bracket. More aggressive, but can be worthwhile when pre-tax balances are large and future RMDs would push income higher.

The simulation converts from the first available pre-tax account each year. Conversion tax is paid from the converted amount or from other available funds.

### IRMAA

IRMAA (Income-Related Monthly Adjustment Amount) is a surcharge added to Medicare Part B and Part D premiums for higher-income individuals. Medicare uses income from two years prior (Modified Adjusted Gross Income) to determine surcharges.

There are multiple IRMAA tiers with increasing surcharges. The Tier 1 threshold for married filing jointly is approximately $206,000 (2024, indexed to inflation). Exceeding this threshold by even $1 triggers the surcharge for the full year, making it a significant cliff to manage. The IRMAA Tier 1 conversion strategy specifically targets staying below this boundary.
