## Context

The UI has several input/display issues that create confusion: inflation expects decimal but labels suggest %, conversion strategy appears when irrelevant, spending is annual-only despite users thinking in monthly terms, and the API returns monthly/annual spend data that the UI ignores.

The backend already returns `initial_monthly_spend` and `initial_annual_spend` in the simulation summary. The `setPct()` helper in SimulateSettings already converts between display % and stored decimal. The TypeScript types don't include the spending fields yet.

## Goals / Non-Goals

**Goals:**
- Make inflation and percentage inputs unambiguous with consistent display and field-level errors
- Disable conversion strategy selector when user is at/past RMD age, with explanation
- Show spending as monthly-primary with annual secondary
- Display effective spending from simulation results in SimulateView and landing page summary
- Update TypeScript types to include API spending fields

**Non-Goals:**
- Changing how the backend computes or returns spending data
- Restructuring validation logic (just improving error display location)
- Adding new spending strategies

## Decisions

**Decision: Keep annual storage, display monthly**
The backend and portfolio store use annual amounts. The UI will divide by 12 for display and multiply by 12 for storage. This avoids any backend changes and keeps the store compatible.

Alternative: Store monthly in the frontend and convert at API boundary. Rejected — adds conversion complexity at every store read.

**Decision: Field-level validation errors for config inputs**
Currently validation errors from SimulateSettings inputs (inflation, growth) show in the PortfolioEditor error banner. Move these errors to inline display next to the input that caused them. The Zod validation already provides field paths — use them to route errors to the correct input.

Alternative: Keep the current banner approach. Rejected — users can't find which field caused the error.

**Decision: Disable conversion selector with tooltip when past RMD age**
When `profile.primaryAge >= portfolio.config.rmd_start_age`, disable the conversion strategy dropdown and show a tooltip explaining conversions only apply before RMD age. Visually gray out the control.

Alternative: Hide the control entirely. Rejected — hiding makes it seem like the feature doesn't exist, while disabling teaches the user why.

**Decision: Show effective spending in results summary**
Add `initial_monthly_spend` and `initial_annual_spend` to the TypeScript `SimulationResponse.summary` type. Display in SimulateView results as a spending line: "$X,XXX/mo ($XXX,XXX/yr)". Also update the landing page summary bar to show monthly spending.

## Risks / Trade-offs

- [Rounding] Monthly display of annual amounts may show fractional cents (e.g., $120,001/yr ÷ 12). Use `Math.round()` for monthly display.
- [Conversion edge case] User might change age after setting conversion strategy. The `$derived` reactivity handles this — the disabled state updates automatically when age or RMD config changes.
