## Why

The "Add Income" button doesn't immediately show new income streams — user must close/reopen the section. This is a Svelte 5 reactivity bug: IncomeEditor mutates `config.income_streams` but doesn't reassign the `config` prop, so the store doesn't update. Additionally, all three editor sections (Accounts, Income, Expenses) repeat column labels on every row. The user wants a single header row above data rows, matching a compact table-like layout while keeping card-style row backgrounds.

## What Changes

- **Fix Add Income reactivity**: Extract `incomeStreams` as a separate `$bindable()` prop so reassignment propagates to the store (matching the SpendingEditor pattern for `plannedExpenses`)
- **Single header row for all editors**: Replace per-row labels with a single header row above data rows in AccountsEditor, IncomeEditor (Other Income), and SpendingEditor. Use fixed column widths to align headers with inputs. Show "no items" message when empty (not an empty header).
- **Fixed widths for expense columns**: Use consistent column widths so the variable "When" column (single year vs start–end) aligns properly across rows

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `portfolio-editor`: Fix Add Income reactivity; change Accounts, Income streams, and Expenses from per-row labels to single header row with data rows underneath

## Impact

- `ui/src/lib/components/portfolio/IncomeEditor.svelte` — new `$bindable()` prop, single header layout
- `ui/src/lib/components/portfolio/AccountsEditor.svelte` — single header layout
- `ui/src/lib/components/portfolio/SpendingEditor.svelte` — single header layout with fixed widths
- `ui/src/lib/components/portfolio/PortfolioEditor.svelte` — pass `incomeStreams` binding
- Unit and E2E tests updated
