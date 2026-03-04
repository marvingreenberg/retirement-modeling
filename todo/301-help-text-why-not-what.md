# 301. Help text: explain the "why", not just the "what"

Review all help content in `ui/src/lib/help/en/` and ensure the text — where appropriate — explains who would use a setting, why they'd choose it, and what it implies. Not just what it does mechanically.

Examples:
- **Conservative growth**: who would enable this and why (pessimistic outlook, stress-testing)
- **Roth conversions**: why you'd convert, when it makes sense (lower bracket years, pre-RMD)
- **4% strategy**: what it means for spending flexibility, the research behind it
- **Stock percentage**: what different allocations imply for risk/return tradeoff, not just the formula
- **Cost basis**: why 0% is probably correct for a 401k (all pre-tax contributions = all gains), what a high vs low basis means for tax on withdrawal
- **Withdrawal order**: why the default order makes sense, when you'd change it
- **Guardrails**: who benefits from this strategy vs fixed dollar

The tone should be advisory — help the user make decisions, not just describe fields.
