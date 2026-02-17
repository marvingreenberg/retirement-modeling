## Context

IncomeEditor receives `config` as a `$bindable()` prop. Its `addStream` function does `config.income_streams = [...]` which mutates a sub-property but doesn't reassign `config` itself. The parent passes `bind:config={$portfolio.config}` — since the config reference doesn't change, the Svelte store doesn't see the update. AccountsEditor and SpendingEditor work because their list props (`accounts`, `plannedExpenses`) are separate `$bindable()` props that get reassigned directly.

All three editors repeat column labels inside every row card. The user wants a single header row above the data rows, like a table header but with card-style row backgrounds.

## Goals / Non-Goals

**Goals:**
- Fix Add Income reactivity so new streams appear immediately on click
- Single header row above data rows in AccountsEditor, IncomeEditor (Other Income), and SpendingEditor
- Fixed column widths in SpendingEditor for the variable-width When column
- "No items" message when lists are empty (not an empty header row)

**Non-Goals:**
- Changing the Social Security card layout (it stays as-is with inline labels)
- Adding new fields to any editor

## Decisions

### 1. Income streams as separate `$bindable()` prop

Extract `incomeStreams` from `config` into its own `$bindable()` prop, matching the SpendingEditor pattern. PortfolioEditor passes `bind:incomeStreams={$portfolio.config.income_streams}`. This way `incomeStreams = [...incomeStreams, newItem]` reassigns the prop directly, triggering store update.

### 2. Single header row pattern

For each editor with repeating items (Accounts, Income streams, Expenses):
- When items exist: render a header row (plain text, no background) with column names at fixed widths, then data rows underneath with `bg-surface-100` background but NO labels — just inputs aligned to the header columns.
- When no items exist: show a message (e.g. for accounts the existing "Add an account" warning handles this; for income streams just show the "Add Income" button without a header).
- Use consistent `w-*` classes on both header cells and input containers to ensure alignment.

### 3. Fixed column widths for SpendingEditor

Use fixed widths that accommodate the When column's two states:
- Name: `w-28`, Amount: `w-24`, Type: `w-28`, When: `w-44` (fits two w-20 inputs + dash), Infl: `w-12`, Remove: `w-10`

These same widths apply to both the header row and each data row.
