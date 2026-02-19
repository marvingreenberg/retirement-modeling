# Withdrawal Plan Display Enhancements

## Deferred from 100-withdrawal-plan

The current WithdrawalPlan component shows 2-year withdrawal details extracted from
simulation results. Several aspects from the original todo were simplified:

### 1. Tax source identification
The original spec mentioned: "note that extra spending will be needed for taxes" and
"identify the source for the funds (either cash, brokerage, or different roth IRA)."
Currently the component shows total taxes and IRMAA but doesn't show which account
the tax payment comes from. The simulation handles tax payment via spending withdrawals,
but this isn't surfaced distinctly from regular spending withdrawals.

### 2. Conversion tax breakout
The component shows Roth conversion amount and conversion-related taxes, but doesn't
show these as a combined "cost of conversion" view (conversion + marginal tax impact).

### 3. Net available vs gross withdrawal
The plan shows spending target and surplus, but doesn't clearly distinguish between
gross withdrawals needed and net available after taxes. A "Total needed" column as
described in the original todo isn't present.

## Scope

- `ui/src/lib/components/WithdrawalPlan.svelte` — enhanced display
- May need backend changes to tag tax-payment withdrawals separately from spending withdrawals
