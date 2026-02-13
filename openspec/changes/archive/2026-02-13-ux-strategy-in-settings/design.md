## Context

SimulateSettings has primary assumptions (inflation, growth, conversion), an Advanced toggle (tax/RMD/IRMAA world parameters), and run mode controls. The spending strategy and its params live on the separate /spending page alongside planned expenses.

## Goals / Non-Goals

**Goals:**
- Strategy dropdown appears between primary row and Advanced toggle in SimulateSettings
- Conditional params (withdrawal rate for POP, guardrails config) inline below strategy
- Collapsed summary includes strategy info (e.g., "Fixed/$120K")
- /spending renamed to /budget, keeps only annual spend + planned expenses

**Non-Goals:**
- Changing how strategies work or adding new ones
- Moving annual_spend_net into SimulateSettings (it stays on /budget)

## Decisions

1. **Strategy placement**: New row between primary assumptions and Advanced toggle. Shows strategy dropdown. When strategy is `percent_of_portfolio`, show withdrawal rate inline. When `guardrails`, show guardrails params inline. `fixed_dollar` and `rmd_based` need no extra params.

2. **Collapsed summary format**: Include strategy shorthand. Format: `"3.0% infl, 7.0% growth, IRMAA Tier 1, Fixed/$120K"`. For POP: `"...4.0%/POP"`. For guardrails: `"...Guardrails/4.5%"`.

3. **Route rename**: Move `ui/src/routes/spending/` to `ui/src/routes/budget/`. Update AppBar nav and all test references.

4. **Warning text**: Update "$0 spending" warning to reference "Budget page" instead of "Spending page".

## Risks / Trade-offs

- SimulateSettings gets taller when guardrails is selected (4 extra params). Acceptable since it's the user's active choice and they need to see what they're configuring.
