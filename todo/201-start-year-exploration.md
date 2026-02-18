# Start Year — Exploration and Pre-Retirement Modeling

## Current Behavior

`start_year` (default 2025) is used for:
1. Labeling output years (`current_year = cfg.start_year + year_idx`)
2. Matching planned expenses to years (one-time `year` or recurring `start_year`/`end_year`)
3. Nothing else — tax brackets use 2024 base values inflated from year 0 regardless of `start_year`

The simulation always starts "now" — current age, current balances, retirement income starting at configured ages. There's no concept of a pre-retirement accumulation phase.

## Use Case: 58 y/o planning to retire at 63

A user who is 58 and plans to retire at 63 would want to model:

### What the system CAN do today
- Set age to 58, start_year to 2026, simulation_years to 37 (to age 95)
- Set SS start age to 67 or 70 (correctly deferred)
- Set income streams with start_age/end_age (e.g., pension starting at 63)
- Set planned expenses with year ranges
- Model withdrawal ordering, Roth conversions, RMDs from age 73

### What the system CANNOT do today
- **Pre-retirement contributions**: 401k/IRA contributions during working years (ages 58-62) that grow the accounts before retirement withdrawals begin
- **Pre-retirement income**: W-2 salary that covers spending so no withdrawals are needed for the first 5 years. Currently, the simulation withdraws from accounts every year to meet spending target
- **Different spending phases**: Working-years spending (lower, covered by salary) vs retirement spending (from portfolio)
- **Tax bracket stacking with salary**: Working years have salary income pushing into higher brackets, affecting Roth conversion strategy (might want to wait until retirement to convert)
- **Inflation-adjusted brackets for future start**: If start_year=2031, tax brackets should be pre-inflated by 5 years from their 2024 base (Issue #17)

## Ideas to Explore

### Option A: Retirement date field (simplest)
Add `retirement_age` (or `retirement_year`) field. Before retirement age:
- No withdrawals from accounts
- Configurable annual contribution amount per account
- Income streams still gated by their own start_age
- Spending assumed covered externally (salary)

After retirement age: current simulation logic kicks in.

### Option B: Pre-retirement income stream
Model salary as an income stream with `start_age=58, end_age=62, taxable_pct=1.0`. If total income exceeds spending, surplus goes to contributions (reverse of current surplus-to-brokerage). This reuses existing mechanics but the contribution targets need configuration.

### Option C: Two-phase simulation
Explicitly split into accumulation phase (contributions, no withdrawals, salary covers spending) and distribution phase (current logic). Each phase could have its own spending target.

### Option D: Just document limitations
Document that the simulator models the distribution phase only. Users should set their age and balances to their expected retirement-year values. This is what many retirement calculators do.

## Questions to Resolve
- How important is pre-retirement modeling vs just being able to say "I'll retire at 63 with these projected balances"?
- Should pre-retirement contributions be modeled, or just the retirement phase with projected starting balances?
- Does the start_year actually serve a useful purpose beyond labeling, or should it just default to current year?
