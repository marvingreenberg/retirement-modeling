## Context

The simulation loop calls `withdraw_from_accounts()` multiple times per year (RMD, spending categories). It currently discards per-account detail, returning only aggregate amounts. The Details page shows a year-by-year table with aggregated columns.

## Goals / Non-Goals

**Goals:**
- Track which accounts are withdrawn from, how much, and for what purpose (RMD, spending, conversion)
- Display a "Withdrawal Plan" card for the first 2 simulation years on the Details page
- Show per-account withdrawals, conversion details, and estimated tax breakdown

**Non-Goals:**
- Detailed tax optimization suggestions
- Multi-year planning beyond 2 years
- Per-account withdrawal plan export

## Decisions

**Per-account tracking**: Add `per_account: dict[str, float]` to `WithdrawalResult`. The simulation loop accumulates these into `AccountWithdrawal` entries in `YearResult`, tagged by purpose (rmd, spending, conversion).

**Data model**: Add to YearResult:
```python
class AccountWithdrawal(BaseModel):
    account_id: str
    account_name: str
    amount: float
    purpose: str  # "rmd", "spending", "conversion"

withdrawal_details: list[AccountWithdrawal] = []
```

**Frontend display**: A card-based section above the year-by-year table showing Year 1 and Year 2 side by side (or stacked on mobile). Each card shows:
- Spending target, income sources (SS, streams), shortfall
- Per-account withdrawals grouped by purpose
- Conversion amount and source
- Tax estimate breakdown (ordinary + capital gains + IRMAA)

**Conversion details**: The simulation already tracks conversion amount and tax. The conversion source is always the eligible pre-tax accounts — `withdraw_from_eligible_pretax()` just needs the same per-account tracking.

## Risks / Trade-offs

- Adds ~20 bytes per account per year to the API response. For 10 accounts over 30 years, ~6KB additional — negligible.
- Per-account details are only useful for the first few years; later years are too uncertain. Displaying only 2 years keeps it actionable.
