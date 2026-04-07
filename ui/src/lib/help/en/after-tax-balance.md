## After-Tax Estimated Balance

The **After-Tax Est.** adjusts the total portfolio balance to reflect the embedded tax liability of pre-tax accounts. Not all dollars in a retirement portfolio have the same after-tax value, and a higher total balance can be misleading if most of it is sitting in a traditional IRA.

### How it's calculated

```
After-Tax Est. = Brokerage + Roth + Roth Conversions + Pre-tax × (1 − effective rate)
```

The **effective rate** is the year's combined federal + state income tax rate on the projected AGI. For Virginia, Social Security is excluded from the state base.

### Why brokerage isn't discounted: assumed step-up at death

The simulation treats the final balance as the amount that passes to heirs, and assumes a **step-up in cost basis at death**. Under current law, brokerage accounts receive a step-up — eliminating capital gains on appreciation accumulated during the original owner's lifetime. So brokerage dollars are valued at face.

Roth accounts (IRA and 401(k)) also pass tax-free to heirs (subject to the 10-year distribution rule for non-spouse beneficiaries), so they're valued at face too.

Traditional pre-tax accounts (IRA, 401(k), 403(b), etc.) are inherited _with_ their embedded tax liability — there is no step-up for retirement accounts. The beneficiary still owes ordinary income tax on every dollar withdrawn. So pre-tax balances are discounted by the effective rate.

### Account-by-account

- **Roth IRA / Roth 401(k)** — $1 in Roth = $1 after tax, both for the owner and for heirs.
- **Brokerage** — $1 face value, justified by step-up at death.
- **Traditional IRA / 401(k) / 403(b)** — $1 might only be worth $0.75–$0.85 after federal and state taxes, depending on the projected effective rate.

### Why it matters

Comparing two scenarios by total balance alone can be misleading. A no-conversion scenario may show a _higher_ total balance, but much of that balance sits in pre-tax accounts with an embedded tax liability. The after-tax estimate often reveals that a Roth conversion scenario leaves more spendable wealth — both for the owner and for heirs.

### Where it appears

- **Scenarios table** — the _After-Tax Final Balance_ column compares ending values across runs. This is usually the more meaningful comparison than raw Final Balance.
- **Balance chart tooltip** — shows the After-Tax Est. line below the total balance for each year.
- The **Year-by-Year Details** table shows raw Total Balance only — apply the formula above to estimate the after-tax value, or switch to the Scenarios table for the final-year comparison.

### Caveats

- The discount uses the _projected_ effective rate from each simulation year, which depends on AGI in that year. If the heirs' tax situation differs significantly from the projected one, actual after-tax values will differ.
- The step-up assumption depends on current tax law. If Congress eliminates the step-up, brokerage would also need a discount and the formula above would understate embedded liability.
- This is an approximation, not a tax filing. The actual tax owed in any given year depends on how much is withdrawn and the marginal rates at that time — see the year-by-year details table for actual modeled tax payments.
