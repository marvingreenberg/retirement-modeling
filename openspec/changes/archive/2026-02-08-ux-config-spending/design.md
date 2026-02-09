## Context

After the `landing` change, the home page (`/`) has a two-panel layout: portfolio editor + simulate settings on the left, results on the right. The `/spending` route is a placeholder.

Spending configuration is currently split:
- **SpendingEditor** (inside PortfolioEditor's "Spending Plan" collapsible section): annual spending amount (`annual_spend_net`) and planned expenses array
- **SimulateSettings** (below PortfolioEditor in left panel): spending strategy dropdown, conditional params (withdrawal rate for % of Portfolio, guardrails config for Guardrails)

Both bind to the same `$portfolio.config` store, so moving them to a different page has no state management implications — the writable store is global.

## Goals / Non-Goals

**Goals:**
- Consolidate all spending controls on `/spending`: strategy, annual amount, conditional params, planned expenses
- Simplify PortfolioEditor by removing the Spending Plan section
- Simplify SimulateSettings by removing spending-related inputs
- Preserve all existing functionality — this is a layout reorganization

**Non-Goals:**
- Adding new spending strategies or parameters
- Changing the spending data model or validation
- Responsive/mobile layout optimization for the spending page

## Decisions

### Spending page layout

```
┌─────────────────────────────────────────────────────┐
│  Spending Configuration                              │
│                                                      │
│  ── Strategy ──────────────────────────────────────  │
│  [Spending Strategy ▼]  [Annual Spending $___]       │
│                                                      │
│  (conditional: % of Portfolio)                       │
│  [Withdrawal Rate ___]                               │
│                                                      │
│  (conditional: Guardrails)                           │
│  [Init WD Rate] [Floor %] [Ceiling %] [Adjust %]    │
│                                                      │
│  ── Planned Expenses ─────────────────────────────── │
│  [expense rows...]                                   │
│  [+ Add Expense]                                     │
└─────────────────────────────────────────────────────┘
```

A single-column page with two sections: strategy configuration at the top, planned expenses below. No two-panel layout needed — spending is a configuration page, not a split view.

**Rationale**: Spending settings are logically one group. Giving them a full page means no collapsible sections needed — everything is visible at once. The strategy dropdown and its conditional parameters sit naturally next to the annual spending amount.

**Alternative considered**: Keep planned expenses in PortfolioEditor, only move strategy to the spending page — rejected because it keeps the split that motivated this change.

### Component reuse

Reuse the existing `SpendingEditor.svelte` on the spending page, possibly with minor adjustments. The spending strategy inputs currently in SimulateSettings are small enough to inline directly in the spending page rather than extracting a separate component.

**Rationale**: SpendingEditor already handles planned expenses with validation. The strategy dropdown + conditional params are ~30 lines of template — not worth a separate component for a single use site.

### PortfolioEditor changes

Remove the "Spending Plan" `CollapsibleSection` and the `SpendingEditor` import from PortfolioEditor. The validation error auto-open for `config.planned_expenses` paths also gets removed since those errors will surface on the spending page.

### SimulateSettings changes

Remove the spending strategy dropdown, the conditional params blocks (% of Portfolio withdrawal rate, Guardrails config), and the "Withdrawal" label/InfoPopover. Keep: inflation, growth, conversion strategy, tax rates, RMD age, IRMAA limit, run mode, simulate button.

## Risks / Trade-offs

- **Spending validation errors not visible on home page**: If spending config has errors and the user hits Simulate on the home page, the error message says "Portfolio has validation errors" but the specific spending errors are on another page. → Mitigation: The validation error banner on the home page can mention checking the Spending page. This is acceptable since the spending page is one click away.
- **SpendingEditor reuse may need prop adjustments**: SpendingEditor currently receives `bind:config` and `bind:plannedExpenses`. On the spending page it will bind directly to the store. → Mitigation: SpendingEditor already binds to store-derived values, so the interface is compatible.
