# Deferred UX Improvements

These items were identified during fix-simulation-bugs but deferred as non-critical polish.

## Age-to-Year Display Conversion
- Income editor: convert age inputs to year inputs with age hint text (e.g., "2032 (age 72)")
- Account editor: show `available_at_age` as "Available: 2032" derived from owner age + start_year
- Requires passing config (start_year, ages) down to AccountsEditor and IncomeEditor

## Validation Warnings
- Income editor: show warning for impossible ages (e.g., start_age > expected lifespan)
- Account editor: validate available_at_age is reasonable for the owner's current age
