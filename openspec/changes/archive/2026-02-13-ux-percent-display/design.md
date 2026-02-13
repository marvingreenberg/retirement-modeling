## Context

All percentage values in the portfolio store are decimals (0.03 = 3%). The API expects decimals. Input fields currently bind directly to store values, showing raw decimals.

## Goals / Non-Goals

**Goals:**
- Display percentage inputs as human-readable values (3.0 not 0.03)
- Accept human-friendly input (type "3" for 3%)
- Convert cleanly between display and store values

**Non-Goals:**
- Changing the API or store format (stays as decimals)
- Adding percentage formatting to non-input displays (charts, tables)

## Decisions

1. **Conversion approach**: Use reactive `$derived` values for display and `oninput` handlers to write back. Each % input reads `storeValue * 100` and writes `inputValue / 100` to the store.

2. **Affected inputs**: inflation_rate, investment_growth_rate, tax_rate_state, tax_rate_capital_gains, withdrawal_rate, guardrails_config.initial_withdrawal_rate, guardrails_config.floor_percent, guardrails_config.ceiling_percent, guardrails_config.adjustment_percent.

3. **Step/min/max**: Multiply current constraints by 100 (e.g., step 0.005 becomes 0.5, max 0.5 becomes 50).

## Risks / Trade-offs

- Floating point precision: `0.03 * 100 = 3.0000000000000004`. Use rounding to 2 decimal places on display.
