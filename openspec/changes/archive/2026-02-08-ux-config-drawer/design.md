## Context

SimulateSettings currently renders 7 inputs in 2 rows plus run mode controls. Tax-related settings (state tax, cap gains, RMD age, IRMAA limit) rarely change between runs.

## Goals / Non-Goals

**Goals:**
- Reduce visual clutter in the main settings area
- Advanced settings accessible but not prominent
- One-component change — keep everything in SimulateSettings

**Non-Goals:**
- Separate page or modal for advanced settings
- Persisting "advanced open" state across sessions

## Decisions

1. **Inline disclosure**: Use a simple text toggle ("Advanced ▸" / "Advanced ▾") below the primary row to show/hide the tax settings row. No separate component needed.

2. **Default collapsed**: Advanced section starts collapsed. When expanded, it shows the same tax inputs row as before.

3. **Summary text unchanged**: The collapsed summary already shows only inflation, growth, and conversion. No change needed.

## Risks / Trade-offs

- Users who frequently change tax rates will need an extra click. Acceptable since these change much less often than growth/inflation assumptions.
