# Start Year — Exploration and Pre-Retirement Modeling

## Current Behavior

`start_year` (default 2025) is used for:
1. Labeling output years (`current_year = cfg.start_year + year_idx`)
2. Matching planned expenses to years (one-time `year` or recurring `start_year`/`end_year`)
3. Nothing else — tax brackets use 2024 base values inflated from year 0 regardless of `start_year`

`retirement_age` exists in the model (optional field) but is only used for chart annotations (dashed vertical line). It has no effect on simulation logic.

The simulation always starts "now" — current age, current balances, retirement income starting at configured ages. There's no concept of a pre-retirement accumulation phase.

## Use Case: 58 y/o planning to retire at 63

A user who is 58 and plans to retire at 63 would want to model:

### What the system CAN do today
- Set age to 58, start_year to 2026, simulation_years to 37 (to age 95)
- Set SS start age to 67 or 70 (correctly deferred)
- Set income streams with start_age/end_age (e.g., pension starting at 63)
- Set planned expenses with year ranges
- Model withdrawal ordering, Roth conversions, RMDs from age 73
- Set an employment income stream (start_age=58, end_age=62) with salary — surplus goes to brokerage

### What the system CANNOT do today
- **Pre-retirement contributions**: 401k/IRA contributions during working years (ages 58-62) that grow the accounts before retirement withdrawals begin. Employment income streams support `pretax_401k` and `roth_401k` deductions already, but these are routed to retirement accounts — this partially works.
- **No-withdrawal pre-retirement phase**: The simulation withdraws from accounts every year to meet spending target, even when salary covers everything. When total income exceeds spending, the surplus is reinvested (excess_income_routing), so the net effect is close — but it creates unnecessary withdrawal/reinvestment churn in the year-by-year details.
- **Tax bracket stacking with salary**: Working years have salary income pushing into higher brackets, affecting Roth conversion strategy (might want to wait until retirement to convert). This actually DOES work since income streams are included in AGI.

## Assessment

The system is closer to handling pre-retirement than the initial analysis suggests:

1. **Employment income streams** already model salary with 401k contributions
2. **Excess income routing** already reinvests surplus when income > spending
3. **SS and pension start ages** already defer correctly
4. **Tax calculations** already include employment income in AGI

The main gap is that the simulation still runs withdrawal logic during pre-retirement years. When salary covers spending, the surplus is reinvested, but the simulation may still tap accounts for tax payments or planned expenses above salary.

## Recommendation: Option A (retirement_age gating)

Use the existing `retirement_age` field to gate withdrawal behavior in the simulation:

**Before retirement_age:**
- No spending withdrawals from accounts
- Income streams still flow (salary covers spending)
- No Roth conversions (salary already fills brackets)
- 401k contributions from employment streams still routed to accounts
- Surplus reinvested per excess_income_routing

**After retirement_age (or if null):**
- Current simulation logic (withdrawals, conversions, RMDs, etc.)

This is the minimal change that closes the gap. The retirement_age field already exists, the UI already has it, and the only change is in the simulation loop.

## Scope: Small

- `simulation.py`: Add retirement_age check around withdrawal and conversion logic
- Tests: Add pre-retirement phase test cases
- Help content: Update to explain retirement_age behavior

## Status: Ready to implement (low risk, high value)
