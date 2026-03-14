# UI Cleanup Bundle Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up the UI: simplify withdrawal strategy to a binary toggle, fix version display, remove start year, fix help anchor, improve chart colors/formatting, and add missing help content.

**Architecture:** Frontend-heavy changes across Svelte components, Chart.js configs, and markdown help content. One small backend change (start_year default). No changes to simulation logic.

**Tech Stack:** SvelteKit (Svelte 5 runes), Chart.js, Skeleton UI, FastAPI/Pydantic, Marked (markdown rendering)

**Spec:** `docs/superpowers/specs/2026-03-12-ui-cleanup-bundle-design.md`

---

## Chunk 1: Foundation — Chart Utilities, Help Anchor Fix, Start Year Removal

### Task 1: Shared Y-axis tick formatter

**Files:**
- Create: `ui/src/lib/components/charts/formatTick.ts`
- Create: `ui/src/lib/components/charts/formatTick.test.ts`

- [ ] **Step 1: Write the test**

```typescript
// ui/src/lib/components/charts/formatTick.test.ts
import { describe, it, expect } from 'vitest';
import { formatTick } from './formatTick';

describe('formatTick', () => {
   it('formats values >= 1M with one decimal', () => {
      expect(formatTick(1_000_000)).toBe('$1.0M');
      expect(formatTick(1_500_000)).toBe('$1.5M');
      expect(formatTick(2_000_000)).toBe('$2.0M');
      expect(formatTick(10_000_000)).toBe('$10.0M');
   });

   it('formats values >= 1K in $K notation', () => {
      expect(formatTick(1_000)).toBe('$1K');
      expect(formatTick(100_000)).toBe('$100K');
      expect(formatTick(500_000)).toBe('$500K');
      expect(formatTick(999_999)).toBe('$1000K');
   });

   it('formats values < 1K as plain dollars', () => {
      expect(formatTick(500)).toBe('$500');
      expect(formatTick(0)).toBe('$0');
   });

   it('handles string input from Chart.js', () => {
      expect(formatTick('1500000')).toBe('$1.5M');
      expect(formatTick('500000')).toBe('$500K');
   });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ui && npx vitest run src/lib/components/charts/formatTick.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// ui/src/lib/components/charts/formatTick.ts
export function formatTick(v: number | string): string {
   const n = Number(v);
   if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
   if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
   return `$${n.toFixed(0)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ui && npx vitest run src/lib/components/charts/formatTick.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ui/src/lib/components/charts/formatTick.ts ui/src/lib/components/charts/formatTick.test.ts
git commit -m "feat: add shared Y-axis tick formatter with $M notation"
```

---

### Task 2: Wire formatTick into all three charts

**Files:**
- Modify: `ui/src/lib/components/charts/SpendingChart.svelte:196` (tick callback)
- Modify: `ui/src/lib/components/charts/BalanceChart.svelte:150` (tick callback)
- Modify: `ui/src/lib/components/charts/FanChart.svelte:146` (tick callback)

- [ ] **Step 1: Update SpendingChart.svelte**

Replace line 196:
```typescript
// OLD:
callback: (v) => `$${(Number(v) / 1000).toFixed(0)}K`,
// NEW:
callback: (v) => formatTick(v as number),
```

Add import at top of `<script>`:
```typescript
import { formatTick } from './formatTick';
```

- [ ] **Step 2: Update BalanceChart.svelte**

Same pattern — replace tick callback at line 150 and add import.

- [ ] **Step 3: Update FanChart.svelte**

Same pattern — replace tick callback at line 146 and add import.

- [ ] **Step 4: Run existing chart tests**

Run: `cd ui && npx vitest run`
Expected: All pass (chart tests don't assert tick formatting directly)

- [ ] **Step 5: Commit**

```bash
git add ui/src/lib/components/charts/SpendingChart.svelte ui/src/lib/components/charts/BalanceChart.svelte ui/src/lib/components/charts/FanChart.svelte
git commit -m "refactor: use shared formatTick in all chart Y-axes"
```

---

### Task 3: Fix conservative growth help anchor

**Files:**
- Modify: `ui/src/lib/helpMarkdown.ts:17-22`
- Create: `ui/src/lib/helpMarkdown.test.ts` (if not existing — test the renderer)

- [ ] **Step 1: Write the test**

```typescript
// ui/src/lib/helpMarkdown.test.ts
import { describe, it, expect } from 'vitest';
import { renderMarkdown } from './helpMarkdown';

describe('renderMarkdown', () => {
   it('generates id from heading text', () => {
      const html = renderMarkdown('### Some Heading');
      expect(html).toContain('<h3 id="some-heading">Some Heading</h3>');
   });

   it('uses explicit {#id} anchor and strips it from text', () => {
      const html = renderMarkdown('### Conservative Growth {#conservative-growth}');
      expect(html).toContain('id="conservative-growth"');
      expect(html).toContain('>Conservative Growth</h3>');
      expect(html).not.toContain('{#');
   });

   it('handles explicit anchor with different text slug', () => {
      const html = renderMarkdown('## My Section {#custom-id}');
      expect(html).toContain('id="custom-id"');
      expect(html).toContain('>My Section</h2>');
   });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ui && npx vitest run src/lib/helpMarkdown.test.ts`
Expected: Second and third tests FAIL (explicit anchor not stripped)

- [ ] **Step 3: Update the heading renderer**

In `ui/src/lib/helpMarkdown.ts`, replace lines 17-22:

```typescript
heading({ text, depth }: Tokens.Heading): string {
   const anchorMatch = text.match(/\s*\{#([a-z0-9-]+)\}\s*$/);
   let id: string;
   let displayText: string;
   if (anchorMatch) {
      id = anchorMatch[1];
      displayText = text.slice(0, anchorMatch.index!).trim();
   } else {
      id = text
         .toLowerCase()
         .replace(/[^a-z0-9]+/g, '-')
         .replace(/(^-|-$)/g, '');
      displayText = text;
   }
   return `<h${depth} id="${id}">${displayText}</h${depth}>\n`;
},
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ui && npx vitest run src/lib/helpMarkdown.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ui/src/lib/helpMarkdown.ts ui/src/lib/helpMarkdown.test.ts
git commit -m "fix: support explicit {#id} anchors in help markdown headings"
```

---

### Task 4: Remove Start Year from settings UI

**Files:**
- Modify: `ui/src/routes/settings/+page.svelte:294-305` (remove Start Year input)
- Modify: `ui/src/routes/settings/settings.test.ts` (remove Start Year assertion)
- Modify: `src/retirement_model/models.py:335` (add default)

- [ ] **Step 1: Update backend model**

In `src/retirement_model/models.py`, add import at top:
```python
from datetime import date
```

Replace line 335:
```python
# OLD:
start_year: int = Field(ge=2000, le=2100)
# NEW:
start_year: int = Field(default_factory=lambda: date.today().year, ge=2000, le=2100)
```

- [ ] **Step 2: Run backend tests to verify no breakage**

Run: `python -m pytest tests/ -x -q`
Expected: All pass (existing tests provide start_year explicitly)

- [ ] **Step 3: Remove Start Year input from settings page**

In `ui/src/routes/settings/+page.svelte`, delete the Start Year label+input block (lines ~294-305):
```svelte
<!-- DELETE this entire block: -->
<label class="flex flex-col gap-1 text-sm font-medium...">
   Start Year
   <input
      type="number"
      class="input text-sm"
      bind:value={portfolio.value.config.start_year}
      min="2000"
      max="2100"
   />
</label>
```

Note: The Retirement Year input (lines ~310-335) references `start_year` for calculations — this is fine since the store still provides it automatically.

- [ ] **Step 4: Update settings test**

In `ui/src/routes/settings/settings.test.ts`, remove or update the assertion at line 70:
```typescript
// REMOVE:
expect(screen.getByText('Start Year')).toBeInTheDocument();
```

- [ ] **Step 5: Run frontend tests**

Run: `cd ui && npx vitest run src/routes/settings/settings.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/retirement_model/models.py ui/src/routes/settings/+page.svelte ui/src/routes/settings/settings.test.ts
git commit -m "feat: remove Start Year setting, default to current year"
```

---

## Chunk 2: Withdrawal Strategy Simplification

### Task 5: Rewrite WithdrawalOrderEditor as binary toggle

**Files:**
- Modify: `ui/src/lib/components/settings/WithdrawalOrderEditor.svelte` (full rewrite)
- Modify: `ui/src/lib/components/settings/WithdrawalOrderEditor.test.ts` (if exists, else create)

- [ ] **Step 1: Check for existing tests**

Run: `find ui/src -name 'WithdrawalOrder*test*' -o -name 'WithdrawalOrder*spec*'`

- [ ] **Step 2: Write the test**

```typescript
// ui/src/lib/components/settings/WithdrawalOrderEditor.test.ts
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import WithdrawalOrderEditor from './WithdrawalOrderEditor.svelte';
import type { Account, WithdrawalCategory } from '$lib/types';

const brokerageAccount: Account = {
   id: '1', name: 'Brokerage', type: 'brokerage', balance: 100000,
   owner: 'primary', stock_pct: 0.6,
};
const iraAccount: Account = {
   id: '2', name: 'IRA', type: 'ira', balance: 200000,
   owner: 'primary', stock_pct: 0.6,
};

describe('WithdrawalOrderEditor', () => {
   it('renders two radio options', () => {
      const order: WithdrawalCategory[] = ['cash', 'brokerage', 'pretax', 'roth'];
      render(WithdrawalOrderEditor, {
         props: { order, accounts: [brokerageAccount, iraAccount] },
      });
      expect(screen.getByLabelText(/Brokerage first/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/IRA\/401k first/i)).toBeInTheDocument();
   });

   it('selects Brokerage first when brokerage is before pretax', () => {
      const order: WithdrawalCategory[] = ['cash', 'brokerage', 'pretax', 'roth'];
      render(WithdrawalOrderEditor, {
         props: { order, accounts: [brokerageAccount, iraAccount] },
      });
      const radio = screen.getByLabelText(/Brokerage first/i) as HTMLInputElement;
      expect(radio.checked).toBe(true);
   });

   it('selects IRA/401k first when pretax is before brokerage', () => {
      const order: WithdrawalCategory[] = ['cash', 'pretax', 'brokerage', 'roth'];
      render(WithdrawalOrderEditor, {
         props: { order, accounts: [brokerageAccount, iraAccount] },
      });
      const radio = screen.getByLabelText(/IRA\/401k first/i) as HTMLInputElement;
      expect(radio.checked).toBe(true);
   });

   it('shows advisory when Brokerage first is selected', () => {
      const order: WithdrawalCategory[] = ['cash', 'brokerage', 'pretax', 'roth'];
      render(WithdrawalOrderEditor, {
         props: { order, accounts: [brokerageAccount, iraAccount] },
      });
      expect(screen.getByText(/MAY allow more Roth conversion/i)).toBeInTheDocument();
   });

   it('does not show advisory when IRA/401k first is selected', () => {
      const order: WithdrawalCategory[] = ['cash', 'pretax', 'brokerage', 'roth'];
      render(WithdrawalOrderEditor, {
         props: { order, accounts: [brokerageAccount, iraAccount] },
      });
      expect(screen.queryByText(/MAY allow more Roth conversion/i)).not.toBeInTheDocument();
   });

   it('changes order when clicking a radio button', async () => {
      const order: WithdrawalCategory[] = ['cash', 'brokerage', 'pretax', 'roth'];
      render(WithdrawalOrderEditor, {
         props: { order, accounts: [brokerageAccount, iraAccount] },
      });
      const iraRadio = screen.getByLabelText(/IRA\/401k first/i);
      await fireEvent.click(iraRadio);
      expect((iraRadio as HTMLInputElement).checked).toBe(true);
   });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd ui && npx vitest run src/lib/components/settings/WithdrawalOrderEditor.test.ts`
Expected: FAIL (component still has old structure)

- [ ] **Step 4: Rewrite the component**

Replace entire content of `ui/src/lib/components/settings/WithdrawalOrderEditor.svelte`:

```svelte
<script lang="ts">
   import type { WithdrawalCategory, Account } from '$lib/types';
   import { TAX_CATEGORY_MAP } from '$lib/types';
   import HelpButton from '$lib/components/HelpButton.svelte';

   let {
      order = $bindable(),
      accounts = [],
   }: {
      order: WithdrawalCategory[];
      accounts?: Account[];
   } = $props();

   let isBrokerageFirst = $derived(
      order.indexOf('brokerage') < order.indexOf('pretax'),
   );

   function setOrder(brokerageFirst: boolean) {
      order = brokerageFirst
         ? ['cash', 'brokerage', 'pretax', 'roth']
         : ['cash', 'pretax', 'brokerage', 'roth'];
   }
</script>

<fieldset class="flex flex-col gap-2">
   <legend class="text-sm font-medium text-surface-700-200">
      Withdrawal Order
      <HelpButton topic="withdrawal-order" />
   </legend>
   <label class="flex items-center gap-2 text-sm">
      <input
         type="radio"
         name="withdrawal-order"
         checked={!isBrokerageFirst}
         onchange={() => setOrder(false)}
         class="radio"
      />
      IRA/401k first
   </label>
   <label class="flex items-center gap-2 text-sm">
      <input
         type="radio"
         name="withdrawal-order"
         checked={isBrokerageFirst}
         onchange={() => setOrder(true)}
         class="radio"
      />
      Brokerage first
   </label>
   {#if isBrokerageFirst}
      <p class="text-xs text-warning-600">
         Withdrawing from brokerage first MAY allow more Roth conversion, which MAY be advantageous
         <HelpButton topic="withdrawal-order" />
      </p>
   {/if}
</fieldset>
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd ui && npx vitest run src/lib/components/settings/WithdrawalOrderEditor.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add ui/src/lib/components/settings/WithdrawalOrderEditor.svelte ui/src/lib/components/settings/WithdrawalOrderEditor.test.ts
git commit -m "feat: simplify withdrawal order to binary toggle"
```

---

### Task 6: Conditional display in SimulateSettings

**Files:**
- Modify: `ui/src/lib/components/SimulateSettings.svelte:390-394`

- [ ] **Step 1: Add conditional check**

In `SimulateSettings.svelte`, add a derived value in the `<script>` section:

```typescript
import { TAX_CATEGORY_MAP } from '$lib/types';

let showWithdrawalOrder = $derived.by(() => {
   const accounts = portfolio.value.accounts;
   const hasBrokerage = accounts.some(
      (a) => TAX_CATEGORY_MAP[a.type] === 'brokerage',
   );
   const hasPretax = accounts.some(
      (a) => TAX_CATEGORY_MAP[a.type] === 'pretax',
   );
   return hasBrokerage && hasPretax;
});
```

- [ ] **Step 2: Wrap the WithdrawalOrderEditor in conditional**

Replace lines ~390-394:
```svelte
{#if showWithdrawalOrder}
   <WithdrawalOrderEditor
      bind:order={portfolio.value.config.withdrawal_order}
      accounts={portfolio.value.accounts}
   />
{/if}
```

Note: Remove the `conversionStrategy` prop — no longer needed.

- [ ] **Step 3: Run full frontend tests**

Run: `cd ui && npx vitest run`
Expected: All pass

- [ ] **Step 4: Commit**

```bash
git add ui/src/lib/components/SimulateSettings.svelte
git commit -m "feat: only show withdrawal order when both account types present"
```

---

### Task 7: Update snapshot key and Compare table display

**Files:**
- Modify: `ui/src/routes/+page.svelte:57-93` (snapshot building)
- Modify: `ui/src/lib/components/CompareView.svelte:67,86,147,159` (column rendering)

- [ ] **Step 1: Update snapshot building in +page.svelte**

Replace lines 90-92 in `buildSnapshotBase()`:
```typescript
// OLD:
withdrawalOrder: (c.withdrawal_order ?? [])
   .map((w: string) => w[0])
   .join('-'),
// NEW:
withdrawalOrder: (c.withdrawal_order ?? []).indexOf('brokerage') <
   (c.withdrawal_order ?? []).indexOf('pretax')
   ? 'brk-first'
   : 'ira-first',
```

- [ ] **Step 2: Update CompareView column header**

In `CompareView.svelte`, the "Withdrawal" column header (lines 67, 147) stays as-is. Update the cell rendering to show two lines.

At line 86 (single run row), change:
```svelte
<!-- OLD: -->
<td class="text-left">{snap.spendingStrategy}</td>
<!-- NEW: -->
<td class="text-left">
   <div>{snap.spendingStrategy}</div>
   {#if snap.withdrawalOrder}
      <div class="text-xs opacity-70">
         {snap.withdrawalOrder === 'brk-first' ? 'Brokerage first' : 'IRA/401k first'}
      </div>
   {/if}
</td>
```

Apply the same pattern at line 159 (Monte Carlo row).

- [ ] **Step 3: Run frontend tests**

Run: `cd ui && npx vitest run`
Expected: All pass

- [ ] **Step 4: Commit**

```bash
git add ui/src/routes/+page.svelte ui/src/lib/components/CompareView.svelte
git commit -m "feat: show withdrawal priority in Compare table"
```

---

### Task 8: Remove recommendWithdrawalOrder from taxDrag.ts

**Files:**
- Modify: `ui/src/lib/taxDrag.ts` (remove function and related types)
- Check: Any imports of `recommendWithdrawalOrder` elsewhere

- [ ] **Step 1: Search for usages**

Run: `cd ui && grep -r 'recommendWithdrawalOrder\|WithdrawalRecommendation' src/`

- [ ] **Step 2: Remove the function and types**

In `ui/src/lib/taxDrag.ts`, remove `recommendWithdrawalOrder()` (lines ~32-93) and `WithdrawalRecommendation` type (lines ~27-30). Keep any other functions in the file.

- [ ] **Step 3: Remove any imports of it**

Update any files that imported `recommendWithdrawalOrder` — the rewritten `WithdrawalOrderEditor` no longer needs it.

- [ ] **Step 4: Run tests**

Run: `cd ui && npx vitest run`
Expected: All pass

- [ ] **Step 5: Commit**

```bash
git add ui/src/lib/taxDrag.ts
git commit -m "refactor: remove recommendWithdrawalOrder, no longer needed"
```

---

## Chunk 3: Chart Colors and Desired Spending Line

### Task 9: Unify spending chart colors (fill = border)

**Files:**
- Modify: `ui/src/lib/components/charts/SpendingChart.svelte:62-111`

- [ ] **Step 1: Update color definitions**

In `SpendingChart.svelte`, replace the stacked datasets array (lines 62-111):

```typescript
const stackedDatasets = [
   {
      label: 'Spending',
      data: baseSpendingData,
      borderColor: '#06b6d4',
      backgroundColor: '#06b6d4',
      order: 2,
      ...areaStyle,
   },
   {
      label: 'Planned Expenses',
      data: expenseData,
      borderColor: '#14b8a6',
      backgroundColor: '#14b8a6',
      order: 3,
      ...areaStyle,
   },
   {
      label: 'Income Tax',
      data: incomeTaxData,
      borderColor: '#737373',
      backgroundColor: '#737373',
      order: 4,
      ...areaStyle,
   },
   {
      label: 'Conversion Tax',
      data: convTaxData,
      borderColor: '#a78bfa',
      backgroundColor: '#a78bfa',
      order: 5,
      ...areaStyle,
   },
   {
      label: 'IRMAA',
      data: irmaaData,
      borderColor: '#f87171',
      backgroundColor: '#f87171',
      order: 6,
      ...areaStyle,
   },
   {
      label: 'Surplus \u2192 Reinvested',
      data: surplusData,
      borderColor: '#4ade80',
      backgroundColor: '#4ade80',
      order: 7,
      ...areaStyle,
   },
].filter((ds) => hasNonZero(ds.data));
```

- [ ] **Step 2: Verify visually**

Run: `make dev` and check the spending chart — all areas should have solid colors with matching fill/border.

- [ ] **Step 3: Run tests**

Run: `cd ui && npx vitest run`
Expected: All pass

- [ ] **Step 4: Commit**

```bash
git add ui/src/lib/components/charts/SpendingChart.svelte
git commit -m "feat: unify spending chart fill/border colors, new IRMAA/conversion colors"
```

---

### Task 10: Show desired spending line for fixed strategy

**Files:**
- Modify: `ui/src/lib/components/SimulateView.svelte:33-46`

- [ ] **Step 1: Remove the fixed_dollar guard**

In `SimulateView.svelte`, update the `desiredSpending` derivation (lines 33-46):

```typescript
// OLD:
let desiredSpending: number[] = $derived.by(() => {
   if (
      !config ||
      !singleResult ||
      config.spending_strategy === 'fixed_dollar'
   )
      return [];
   // ...

// NEW:
let desiredSpending: number[] = $derived.by(() => {
   if (!config || !singleResult) return [];
   // ... rest unchanged
```

- [ ] **Step 2: Verify visually**

Run: `make dev`, run a fixed dollar simulation. The dashed "Desired Spending" line should appear tracking the top of the spending area.

- [ ] **Step 3: Run tests**

Run: `cd ui && npx vitest run`
Expected: All pass

- [ ] **Step 4: Commit**

```bash
git add ui/src/lib/components/SimulateView.svelte
git commit -m "feat: show desired spending line for fixed dollar strategy"
```

---

## Chunk 4: Version Display and Help Content

### Task 11: Restyle version/history in AppBar

**Files:**
- Modify: `ui/src/lib/components/AppBar.svelte:50-73`

- [ ] **Step 1: Restructure the version display**

In `AppBar.svelte`, replace the version/history block (lines ~55-73). The current version is a small `<span>` and the history link is a full button below. Change to a single flex row:

```svelte
<!-- Replace the version/history area inside SkAppBar.Lead -->
<div class="flex items-center gap-2 text-sm">
   <span class="font-medium text-surface-600">v{appVersion}</span>
   {#if previousVersionUrl && previousVersion}
      <a
         href={previousVersionUrl}
         target="_blank"
         rel="noopener noreferrer"
         class="btn btn-sm preset-tonal px-2 py-0.5 text-xs"
      >
         &#x1F551; v{previousVersion}
      </a>
   {/if}
</div>
```

Key changes:
- Both on same line via `flex items-center gap-2`
- Current version: `font-medium text-surface-600` (matches button prominence)
- History button: `px-2 py-0.5 text-xs` (minimal padding)
- Remove the old large button and separate version span

- [ ] **Step 2: Verify visually**

Run: `make dev` and check the AppBar. Both versions should be on one line under the title with similar prominence.

- [ ] **Step 3: Run tests**

Run: `cd ui && npx vitest run`
Expected: All pass

- [ ] **Step 4: Commit**

```bash
git add ui/src/lib/components/AppBar.svelte
git commit -m "feat: compact version/history display on single line"
```

---

### Task 12: Update withdrawal-order help content

**Files:**
- Modify: `ui/src/lib/help/en/withdrawal-order.md`

- [ ] **Step 1: Rewrite the help content**

Replace entire content of `ui/src/lib/help/en/withdrawal-order.md`:

```markdown
## Withdrawal Order

When spending exceeds income in a given year, the simulation draws down accounts in a configured order.

### How It Works

Cash and CD accounts are always withdrawn first — they earn minimal returns and have no tax advantage. Roth accounts are always withdrawn last — tax-free compounding is the most powerful benefit to preserve.

The choice you make is which account type comes next: **brokerage** or **IRA/401k**.

### IRA/401k First (Default)

Withdraws from traditional IRA and 401k accounts before brokerage. This is the conventional approach:

- **Tax-deferred compounding** — keeps brokerage assets (taxed only on gains at favorable capital gains rates) growing while spending down fully-taxed pre-tax accounts
- **Simpler tax picture** — pre-tax withdrawals are ordinary income, easy to predict

### Brokerage First

Withdraws from taxable brokerage accounts before IRA/401k. This can be advantageous in specific situations:

- **Roth conversion headroom** — by not drawing down IRA/401k for spending, the taxable income stays lower, leaving room to convert IRA/401k assets to Roth at lower tax brackets. Over time, this can shift more wealth into tax-free Roth accounts.
- **Reduces tax drag** — brokerage accounts generate taxable dividends and capital gains distributions every year whether you withdraw or not. Spending these assets first eliminates that ongoing tax drag.
- **Best when conversions are active** — if you're running a Roth conversion strategy (filling a bracket each year), brokerage-first ensures the conversion has maximum headroom.

### Excess Income Routing

When total income (from employment, pensions, Social Security, etc.) exceeds spending needs in a given year, the surplus must go somewhere. The excess income routing setting controls which account receives it:

- **Brokerage** (default) — Surplus goes to taxable investment accounts.
- **IRA First** — Surplus is contributed to traditional IRA (up to annual limits), remainder to brokerage.
- **Roth IRA First** — Surplus is contributed to Roth IRA (up to annual limits and income phase-out), remainder to brokerage.
```

- [ ] **Step 2: Commit**

```bash
git add ui/src/lib/help/en/withdrawal-order.md
git commit -m "docs: update withdrawal order help for binary choice"
```

---

### Task 13: Add planned-expenses help topic

**Files:**
- Create: `ui/src/lib/help/en/planned-expenses.md`
- Modify: `ui/src/lib/helpTopics.ts` (register topic)

- [ ] **Step 1: Write the help content**

```markdown
## Planned Expenses

Planned expenses model spending above your base annual budget — large one-time costs or recurring commitments with specific year ranges.

### One-Time Expenses

A single expense in a specific year. Examples: new roof ($25,000 in 2028), car purchase ($40,000 in 2030). Set the same year for both start and end.

### Recurring Expenses

An annual cost over a range of years. Examples: college tuition ($50,000/year from 2027–2030), long-term care ($80,000/year from 2040–2050). The amount is in today's dollars and is adjusted for inflation each year.

### How They Appear

In the spending chart, planned expenses show as a separate band stacked on top of base spending. In years with no planned expenses, only the base spending appears. This makes it easy to see when large costs hit and how they affect total outflows.

### Base Spending vs Planned Expenses

**Base annual spending** is the steady-state cost of the retirement lifestyle — housing, food, insurance, travel, etc. It applies every year.

**Planned expenses** are additional costs that don't fit the steady-state pattern. Separating them lets you see how one-time or temporary costs affect the plan without inflating the baseline.
```

- [ ] **Step 2: Register in helpTopics.ts**

In `ui/src/lib/helpTopics.ts`, add to the "Your Inputs" category (after `pre-retirement` at line 49):

```typescript
{
   id: 'planned-expenses',
   name: 'Planned Expenses',
   related: ['spending-strategies', 'spending-chart'],
},
```

- [ ] **Step 3: Wire HelpButton on spending/budget page**

Check the spending page (`ui/src/routes/spending/+page.svelte`) or the `SpendingEditor` component for a natural place to add a HelpButton for `planned-expenses`. Add it near the planned expenses section header.

- [ ] **Step 4: Run tests**

Run: `cd ui && npx vitest run`
Expected: All pass

- [ ] **Step 5: Commit**

```bash
git add ui/src/lib/help/en/planned-expenses.md ui/src/lib/helpTopics.ts ui/src/lib/components/portfolio/SpendingEditor.svelte
git commit -m "docs: add planned expenses help topic"
```

---

### Task 14: Add details-page help topic

**Files:**
- Create: `ui/src/lib/help/en/details-page.md`
- Modify: `ui/src/lib/helpTopics.ts`

- [ ] **Step 1: Write the help content**

```markdown
## Details View

The Details page shows a year-by-year breakdown of the simulation — every number behind the charts, laid out in a table.

### What the Columns Show

Each row is one simulation year. Key columns include:

- **Year / Age** — calendar year and the primary person's age
- **Spending** — total spending for the year (base + planned expenses)
- **Income** — total income from all streams (Social Security, pensions, employment)
- **Withdrawals** — amounts drawn from each account type to cover any spending gap
- **Taxes** — federal income tax, conversion tax, and IRMAA surcharges
- **Balances** — end-of-year balance for each account type
- **Roth Conversions** — amount converted from pre-tax to Roth that year

### When to Use Details

The charts show trends — Details shows exact numbers. Use it when you want to:

- Check a specific year's tax bill or withdrawal amount
- Understand why a chart shows an unusual spike or dip
- Verify that income streams start and stop at the right ages
- See how Roth conversions interact with tax brackets year by year
```

- [ ] **Step 2: Register in helpTopics.ts**

Add to "Understanding Results" category (after `outcome-distribution`):

```typescript
{
   id: 'details-page',
   name: 'Details View',
   related: ['balance-chart', 'spending-chart'],
},
```

- [ ] **Step 3: Update routeTopicMap**

In `helpTopics.ts`, change the `/details` default topic (line ~140):

```typescript
// OLD:
'/details': 'tax-bracket-indexing',
// NEW:
'/details': 'details-page',
```

- [ ] **Step 4: Commit**

```bash
git add ui/src/lib/help/en/details-page.md ui/src/lib/helpTopics.ts
git commit -m "docs: add details page help topic"
```

---

### Task 15: Add compare-page help topic

**Files:**
- Create: `ui/src/lib/help/en/compare-page.md`
- Modify: `ui/src/lib/helpTopics.ts`

- [ ] **Step 1: Write the help content**

```markdown
## Compare View

The Compare page shows simulation results side by side, letting you see how different settings affect outcomes.

### How Snapshots Work

Every time you run a simulation, a snapshot is automatically added to the Compare table. Each snapshot captures the key settings (inflation, growth, spending strategy, conversion strategy, withdrawal order) along with the results.

### What Makes a "Different" Run

The Compare table uses your simulation settings to decide whether a run is new or a repeat:

- **Changed settings** (inflation rate, growth mode, spending strategy, conversion target, withdrawal order) → a **new row** appears
- **Same settings** re-run → the existing row is **replaced** with updated results
- **Changed inputs** (accounts, balances, ages, income streams) → the table is **cleared** because the old snapshots are no longer comparable — they were based on different financial inputs

### How to Use Compare

1. Run a simulation with your current settings
2. Change one setting (e.g., switch from "No Conversion" to "22% Bracket")
3. Run again — both results appear side by side
4. Repeat to build up a comparison across multiple scenarios

The **Clear All** button removes all snapshots and starts fresh.

### Reading the Table

Single Run and Monte Carlo results are shown in separate sections. Key columns:

- **Withdrawal** — spending strategy and withdrawal order priority
- **Final Balance** — ending portfolio value (red if depleted)
- **Total Taxes / IRMAA** — lifetime totals (red highlights indicate high values)
- **Roth Conv Acct** — total converted to Roth over the simulation
- **Spending Range** (Monte Carlo) — range of actual spending across simulated paths
```

- [ ] **Step 2: Register in helpTopics.ts**

Add to "Understanding Results" category:

```typescript
{
   id: 'compare-page',
   name: 'Compare View',
   related: ['details-page', 'monte-carlo'],
},
```

- [ ] **Step 3: Update routeTopicMap**

```typescript
// OLD:
'/compare': 'spending-strategies',
// NEW:
'/compare': 'compare-page',
```

- [ ] **Step 4: Wire HelpButton on compare and details pages**

Check if the Compare and Details page components already have HelpButtons. If not, add them in the page header area. The exact placement depends on the existing layout — look for a natural spot near the page title.

- [ ] **Step 5: Run tests**

Run: `cd ui && npx vitest run`
Expected: All pass

- [ ] **Step 6: Commit**

```bash
git add ui/src/lib/help/en/compare-page.md ui/src/lib/helpTopics.ts
git commit -m "docs: add compare page help topic"
```

---

## Chunk 5: Final Integration and Lint

### Task 16: Run full test suites and lint

- [ ] **Step 1: Run backend tests**

Run: `python -m pytest tests/ -x -q`
Expected: All pass

- [ ] **Step 2: Run frontend tests**

Run: `cd ui && npx vitest run`
Expected: All pass

- [ ] **Step 3: Run svelte-check**

Run: `cd ui && npx svelte-check --tsconfig ./tsconfig.json`
Expected: No errors

- [ ] **Step 4: Run linters**

Run: `make lint`
Expected: Clean

- [ ] **Step 5: Fix any issues found, commit fixes**

- [ ] **Step 6: Final commit if needed**

```bash
git commit -m "chore: lint fixes for UI cleanup bundle"
```
