## Why

The planned expense editor has several UX issues: recurring expenses don't show start/end fields until the section is collapsed and reopened (reactivity bug), recurring expenses use age-based fields (Start Age/End Age) when year-based fields (Start Year/End Year) are more intuitive and consistent with one-time expenses, and the base spending input is labeled "Monthly" when the underlying model is annual. Switching between one-time and recurring also loses context unnecessarily.

## What Changes

- **Fix reactivity bug**: Recurring expenses show Start/End fields immediately on type change without requiring section collapse/reopen
- **Change recurring fields from age to year**: Replace `start_age`/`end_age` with `start_year`/`end_year` on PlannedExpense model (backend + frontend) **BREAKING**
- **Make base spending annual-primary**: Change spending input label to "Annual Spending ($/yr)" with monthly shown as detail text beneath
- **Preserve start date on type switch**: When switching between one_time and recurring, keep the start/at year value; clear only the end year
- Update simulation engine to use year-based recurring expense logic instead of age-based
- Update Zod validation schema, backend Pydantic model, and sample data

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `spending-page`: Change spending input from monthly-primary to annual-primary with monthly detail; planned expense recurring fields change from age to year
- `portfolio-editor`: Budget section summary and compact display updated to reflect annual-primary spending

## Impact

- **Backend model**: `PlannedExpense` fields `start_age`/`end_age` → `start_year`/`end_year`
- **Simulation engine**: `calculate_planned_expenses()` changes from age comparison to year comparison for recurring expenses
- **Frontend types**: `PlannedExpense` interface updated
- **Zod schema**: Validation rules updated for year fields
- **Stores**: Sample portfolio data updated
- **Components**: SpendingEditor, PortfolioEditor budget section
- **Tests**: Backend simulation tests, frontend component tests, Zod schema tests
