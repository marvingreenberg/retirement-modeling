## Context

Income streams and SS use `start_age`/`end_age` (ages). Account `available_at_age` is also an age. Users think in calendar years. The backend model stays age-based — conversion is UI-only.

## Goals / Non-Goals

**Goals:**
- Display age fields as year inputs with "(age N)" hint text
- Keep backend data model unchanged (ages)
- Add soft validation warnings for unreasonable values

**Non-Goals:**
- Changing the backend model to use years
- Hard validation that blocks saving

## Decisions

**Conversion formula**: `year = config.start_year + (age - ownerAge)` where `ownerAge` is `current_age_primary` or `current_age_spouse` depending on stream/account owner. Reverse: `age = ownerAge + (year - config.start_year)`.

**Display pattern**: Show the year as the input value, with a small hint text like "(age 72)" beside or below it. The underlying data stays as age.

**AccountsEditor config prop**: Pass `config` (or just `startYear`, `primaryAge`, `spouseAge`) to enable the conversion. Minimal prop surface — just what's needed.

**Validation**: Show orange warning text for ages > simulation end (current_age + simulation_years) or < current_age. Non-blocking — just informational.

## Risks / Trade-offs

- Adds coupling between editors and config — but these editors are already tightly coupled to the data model, and the config is already passed to IncomeEditor.
