## Context

The portfolio editor has three sub-editors (Accounts, Budget/Spending, Income) that evolved independently and now have inconsistent visual styling. AccountsEditor uses card-style rows with `bg-surface-100` backgrounds. SpendingEditor uses an HTML `<table>` with border lines. IncomeEditor repeats label headers on every income stream row.

Additionally, SpendingEditor has a reactivity bug: `handleTypeChange` mutates the expense object in place. Svelte 5's `{#each}` conditional blocks (`{#if expense.expense_type === 'one_time'}`) don't re-evaluate when an object property is mutated — the object reference in the array hasn't changed. The existing `plannedExpenses = [...plannedExpenses]` spread only creates a new array, not new objects.

All inputs across editors lack select-on-focus, requiring users to manually select existing values before typing replacements.

## Goals / Non-Goals

**Goals:**
- Fix the expense type-change reactivity bug so the When field switches immediately
- Add select-all-on-focus to all text and number inputs in all three editors
- Make Budget and Income sections visually consistent with Accounts (card-style rows)
- Add E2E tests for select-on-focus and type-change reactivity

**Non-Goals:**
- Changing the data model or backend API
- Adding new fields or capabilities to any editor
- Modifying the CollapsibleSection or PortfolioEditor wrapper components
- Changing AccountsEditor layout (it's the target style)

## Decisions

### 1. Reactivity fix: replace object in array

**Decision**: In `handleTypeChange`, create a shallow copy of the expense, modify the copy, and replace it in the array:

```typescript
function handleTypeChange(i: number, newType: 'one_time' | 'recurring') {
  const expense = { ...plannedExpenses[i] };
  if (newType === 'recurring') {
    expense.start_year = expense.year;
    expense.end_year = undefined;
    expense.year = undefined;
  } else {
    expense.year = expense.start_year;
    expense.start_year = undefined;
    expense.end_year = undefined;
  }
  expense.expense_type = newType;
  plannedExpenses[i] = expense;
  plannedExpenses = [...plannedExpenses];
}
```

**Why**: This ensures Svelte 5 sees a new object reference at the array index, triggering re-evaluation of `{#if expense.expense_type === 'one_time'}`.

**Alternative considered**: Using `{#key expense.expense_type}` to force block re-render — rejected because it causes unnecessary DOM teardown/rebuild and doesn't fix the root cause.

### 2. Select-all-on-focus via onfocus handler

**Decision**: Add `onfocus={(e) => e.currentTarget.select()}` to all `<input>` elements (text and number) in AccountsEditor, SpendingEditor, and IncomeEditor.

**Why**: Native browser API, zero dependencies, works consistently. When user clicks or tabs into a field, all text is selected so typing immediately replaces it.

**Alternative considered**: A global action/directive — rejected as over-engineering for simple `onfocus` attribute.

### 3. Budget: table to card rows

**Decision**: Replace `<table>/<thead>/<tbody>/<tr>/<td>` in SpendingEditor with card-style `<div>` rows matching AccountsEditor's pattern: `<div class="p-3 bg-surface-100 dark:bg-surface-800 rounded flex-wrap">` with inline label+input pairs. Keep "Annual Spending" as a standalone row above expense cards.

**Why**: Matches Accounts visual style. Cards are more flexible for responsive layouts and the conditional When field (one vs two inputs) works better outside table cells.

### 4. Income: card blocks with single headers

**Decision**:
- SS section: wrap in a card-style `bg-surface-100` block with "Social Security" heading inside
- Other Income: single "Other Income" heading above all stream rows, each stream in a card-style row without repeated labels (use `placeholder` and `aria-label` for field identification, matching compact inline style)

**Why**: Eliminates duplicated labels per row, matches Accounts card styling.

## Risks / Trade-offs

- **Layout width**: Card rows with many inline fields may wrap on narrow screens. Mitigation: `flex-wrap` is already used in AccountsEditor and works well.
- **Test updates**: Existing unit tests query by table structure. Mitigation: Update tests to query by role/label instead of DOM structure.
- **Income label removal**: Removing per-row labels reduces discoverability for first-time users. Mitigation: Use placeholder text in inputs and keep aria-labels for accessibility. The heading above provides context.
