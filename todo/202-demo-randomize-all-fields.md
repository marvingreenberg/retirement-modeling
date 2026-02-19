# Randomize All Sensitive Fields for Demo Mode

## Problem

`randomizeForDemo()` currently only scales account balances (0.3-0.7x) and replaces
profile names with "Alex"/"Sam". Other potentially identifying financial data remains
untouched:

- `annual_spend_net` (exact spending amount)
- `planned_expenses` (names like "Kitchen remodel" and dollar amounts)
- `income_streams` (pension amounts, employer-identifying names)
- `social_security` benefits (primary and spouse)
- `ss_auto` FRA amounts
- `config.irmaa_limit_tier_1` (hints at income level)

If someone wants to share a demo or screenshot, these values could still identify them.

## Suggested Fix

Extend `randomizeForDemo()` to also:
1. Scale `annual_spend_net` by same random factor range, round to $1000
2. Replace planned expense names with generic labels ("Expense 1", "Expense 2") and scale amounts
3. Replace income stream names with generic labels ("Income 1") and scale amounts
4. Scale SS benefit amounts
5. Scale ss_auto FRA amounts correspondingly
6. Leave rates/percentages unchanged (inflation, growth, tax rate — these aren't identifying)

## Scope

- `ui/src/lib/stores.ts` — expand `randomizeForDemo()`
- `ui/src/lib/stores.test.ts` — add tests for new randomized fields
