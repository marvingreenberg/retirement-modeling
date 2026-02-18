## Context

Visual polish pass to improve readability, density, and labeling across the main portfolio editing UI. All changes are CSS/markup — no logic or backend changes.

## Goals / Non-Goals

**Goals:**
- Rename app to "Retirement Planner" with a small icon
- Increase readability of nav bar, section headers, and strategy controls
- Reduce vertical density in account rows
- Fix label wrapping and misleading text
- Redesign simulate button as prominent left-justified square

**Non-Goals:**
- Changing any simulation logic
- Restructuring component hierarchy
- Mobile-specific responsive changes

## Decisions

**AppBar:**
- Title: "Retirement Planner" with a lucide icon (e.g., `TrendingUp` or `LineChart`) next to it
- Nav item icons: `size={18}` (from 16), text stays `btn-sm`
- Help icon: `size={22}` (from 20)

**Section headers (CollapsibleSection + PortfolioEditor):**
- Section title text: add `text-lg font-semibold` to the title span
- Section icons in PortfolioEditor: `size={20}` (from 16)

**AccountsEditor density:**
- Row padding: `p-2` (from `p-3`)
- Row gap: `gap-2` (from `gap-3`)
- Space between rows: reduce outer `space-y-3` to `space-y-1.5`
- Name input: `w-44` (from `w-36`)
- Header label: "Basis, as %" (from "Cost Basis %")
- Remove "(now)" hint text entirely
- Header row gap matches data rows

**SimulateSettings:**
- Rename "Standard" option to "No Conversion"
- Withdrawal Strategy label: `text-sm` (from `text-xs`), use standard text color (not muted)
- Simulate button: large square button (~48x48px) with 🔁 icon, left-justified, spanning the height of both the growth/inflation row and the strategy row. Use `aspect-square` or explicit sizing. The settings inputs go to its right in a column.

## Risks / Trade-offs

- Wider name field (`w-44`) may cause wrapping on narrower viewports — acceptable since the row already uses `flex-wrap`
- Larger section headers shift visual hierarchy — intentional per user request
- Square simulate button is unconventional but provides a clear action target
