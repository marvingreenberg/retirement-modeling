## Context

The PlannedExpense model uses `start_age`/`end_age` for recurring expenses and `year` for one-time expenses. The spending input is monthly-primary with annual shown as detail. The SpendingEditor uses Svelte's `{#if expense.expense_type === 'one_time'}` conditional rendering, but newly created expenses default to `one_time` without `start_age`/`end_age` fields — switching to `recurring` doesn't trigger proper field initialization, requiring a collapse/reopen to render correctly.

## Goals / Non-Goals

**Goals:**
- Fix reactivity so type switching immediately shows correct fields
- Unify date fields: both one-time and recurring use calendar years
- Make spending annual-primary (input in $/yr, show monthly as detail)
- Preserve start year when switching type, clear only end year

**Non-Goals:**
- Changing how the simulation engine processes expenses beyond the age→year conversion
- Migrating existing saved portfolio JSON files (breaking change accepted)
- Changing income stream age-based fields

## Decisions

**1. Year fields instead of age fields for recurring expenses**
- Replace `start_age: int | None` / `end_age: int | None` with `start_year: int | None` / `end_year: int | None`
- Simulation engine switches from age comparison to year comparison
- Rationale: Calendar years are concrete and consistent with one-time expenses. Age is ambiguous when there's a spouse with different age.

**2. Reactivity fix via explicit field initialization on type change**
- Add an `onchange` handler on the type dropdown that sets appropriate default fields
- When switching to `recurring`: set `start_year = expense.year`, clear `end_year`
- When switching to `one_time`: set `year = expense.start_year`, clear `start_year`/`end_year`
- This preserves the "start/at" date across type switches

**3. Annual-primary spending input**
- Label changes to "Annual Spending ($/yr)"
- Monthly equivalent shown as detail text below: "$X,XXX/mo"
- No model change needed — `annual_spend_net` is already the stored field
- PortfolioEditor budget summary also switches to annual-primary with monthly detail

## Risks / Trade-offs

- **Breaking change on PlannedExpense model**: Saved portfolio JSON with `start_age`/`end_age` won't load correctly → Accepted, no migration needed at this stage
- **Simulation correctness**: Must verify recurring expenses still apply correctly with year-based comparison → Unit tests will cover this
