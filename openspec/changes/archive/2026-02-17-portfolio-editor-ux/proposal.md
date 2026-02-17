## Why

The three portfolio editor sections (Accounts, Budget, Income) have inconsistent visual styling and a reactivity bug. Budget uses an HTML table with horizontal lines while Accounts uses rounded cards with background fills. Income duplicates label headers on every row. Changing expense type (one-time to recurring) doesn't immediately update the When field due to Svelte 5 object mutation. Input fields lack select-on-focus, making editing awkward since users must manually select/delete before typing new values.

## What Changes

- **Fix reactivity bug**: Changing expense type dropdown from One-time to Recurring (or vice versa) will immediately switch the When column between single year and start/end year inputs
- **Select-all-on-focus**: All number and text inputs in Accounts, Budget, and Income editors will select their contents on focus, so typing immediately replaces the value
- **Visual consistency**: Budget section switches from HTML table to card-style rows matching Accounts (bg-surface-100 rounded cards with inline label+input pairs). Income section uses card-style layout for SS block and Other Income rows with single header above rows instead of duplicated per-row labels
- **E2E tests**: Add Playwright tests verifying select-on-focus behavior and type-change reactivity

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `portfolio-editor`: Change planned expenses from table layout to card-style rows; add select-on-focus to all editor inputs; fix expense type-change reactivity so conditional rendering updates immediately

## Impact

- `ui/src/lib/components/portfolio/SpendingEditor.svelte` — table-to-cards conversion, reactivity fix, select-on-focus
- `ui/src/lib/components/portfolio/IncomeEditor.svelte` — card-style layout, select-on-focus
- `ui/src/lib/components/portfolio/AccountsEditor.svelte` — select-on-focus
- Unit tests for SpendingEditor and IncomeEditor (layout changes)
- E2E tests for select-on-focus and type-change reactivity
- Existing `portfolio-editor/spec.md` requirements updated (table → cards)
