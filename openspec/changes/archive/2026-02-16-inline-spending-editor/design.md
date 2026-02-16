## Context

The spending configuration is currently split: a minimal Budget collapsible in PortfolioEditor shows annual spending and a link to `/spending`, while the full SpendingEditor with planned expenses lives on its own page. The planned expenses use repeated label blocks per row, consuming significant vertical space.

## Goals / Non-Goals

**Goals:**
- Consolidate all spending editing into the Budget collapsible section
- Replace per-expense label blocks with a compact table layout
- Remove the `/spending` route and all navigation references to it

**Non-Goals:**
- Changing spending calculation logic or backend models
- Modifying the annual spending input behavior (already annual-primary)
- Adding new spending features

## Decisions

**1. Inline SpendingEditor in Budget section**
The Budget collapsible will import and render SpendingEditor directly, passing `$portfolio.config` and `$portfolio.config.planned_expenses` as bindable props. The current "Full spending plan" link and expense count summary are replaced by the actual editor.

**2. Table layout for planned expenses**
Replace the `{#each}` block of flex-wrapped label divs with an HTML `<table>`. Columns: Name, Amount ($), Type, When, Infl., ✕. The "When" column renders contextually:
- One-time: single year input
- Recurring: "start – end" with two inputs separated by an en-dash

The Type column uses a `<select>` with the existing `onchange` → `handleTypeChange` pattern.

**3. Route removal approach**
Delete `ui/src/routes/spending/` entirely. Remove the navItem from AppBar, the guided tour step referencing spending, and the helpContent route mapping. Update tests accordingly.

## Risks / Trade-offs

- **Wider collapsible**: The table may be wider than the current Budget section content. Mitigated by using compact column widths (w-28 for name, w-24 for amount, w-24 for year inputs).
- **Responsive behavior**: Table may not wrap well on narrow screens. Acceptable since the app is primarily desktop-targeted; the existing flex layout also had wrapping issues.
