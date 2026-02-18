001-fix-conversions

You can only convert Regular IRAs to Roth IRAs.  You cant convert cash or
funds from a brokerage account into Roth IRAs.

Change the logic for conversions to only consider existing IRA as a source
for Roth conversion.

In addition, add additional account types, and automate some things

Type
Brokerage           Default Cost basis to 40% (assumes some longer time horizon)
Cash/CD             Grey out cost basis and set to 100, taxable grayed out set to 0
Roth IRA, Roth 401K Cost basis 100%, 0% taxable
401k, 403b, 457b    Cost basis 0, 100% taxable
IRA, SEP IRA, SIMPLE IRA   Cost basic 0%, 100% taxable


As part of this, can we make conversions CREATE an "IRA conversions" account automatically
when doing conversions, of type Roth Conversion, that displays separately, so that the chart shows four layers

Brokerage
Roth
IRA Conversions (Roth)
IRA (PreTax)

If a layer is not present (No IRA, No conversions) don't even ahow the line or the
graph label


Can you also review ApplicationDetails.md and ensure there is sufficient explanation
about Roth conversions (when and why they are valuable, when you can do them - like you have IRAs, ... to
convert, and why can't use brokerage as a source.).

Also something about RMDs, the RMD time bomb and its affect on taxes due.

Also have a section about why the
diferent bases are set and what they mean.

Brokerage at 40% basis — Your reasoning is directionally right, but 40% might actually be generous for truly long-held investments. A single dollar at ~7% growth for 25 years becomes ~$5.43, making basis only ~18%. However, most people contribute over time (not a single lump sum), so the effective blended basis is higher since recent contributions have less growth. 40% is a defensible "good enough" default. Letting the user override it covers edge cases.
Cash/CD — Makes sense. Interest is taxed as earned, so withdrawals are return of principal.
Roth accounts — Correct for qualified distributions at retirement age. Fine for the simulation.
401k/403b/457b and Traditional IRAs at 0% basis — Correct and conservative. The edge cases (after-tax 401k contributions, non-deductible IRA contributions tracked on Form 8606) are uncommon enough that 0% is a reasonable default.
One thing I'd flag: Your simulation needs to distinguish how the taxable portion is taxed. The 60% gains in a brokerage account are taxed at long-term capital gains rates (0%, 15%, or 20% depending on income), while the 100% taxable portion of 401k/IRA withdrawals is taxed as ordinary income. That's a significant difference — potentially 22-24% vs 15% for many retirees. If your simulation treats all "taxable" amounts at the same rate, it could meaningfully overstate the tax burden on brokerage withdrawals.
