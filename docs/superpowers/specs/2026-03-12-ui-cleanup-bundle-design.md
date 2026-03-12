# UI Cleanup Bundle — Design Spec

## Overview

A collection of UI/UX improvements: simplify withdrawal strategy, fix version display, remove start year, fix help anchor, improve chart colors/formatting, and add missing help content.

---

## 1. Simplify Withdrawal Strategy

### Problem
The drag-and-drop 4-category withdrawal order editor exposes complexity that doesn't produce visible differences in the UI. Cash is always first (no compounding advantage) and Roth always last (best tax-free growth). The only meaningful choice is brokerage vs IRA/401k priority.

### Design

**Replace** the `WithdrawalOrderEditor` drag-and-drop pills with a simple two-option selector (toggle or select): "Brokerage first" / "IRA/401k first".

**Frontend mapping:** The toggle sets the full `withdrawal_order` array:
- Brokerage first → `['cash', 'brokerage', 'pretax', 'roth']`
- IRA/401k first → `['cash', 'pretax', 'brokerage', 'roth']`

**Backend:** No changes — continues to accept the 4-element `withdrawal_order` list.

**Conditional display:** Only show the withdrawal order section when the portfolio has at least one brokerage account AND at least one IRA or 401k (pretax) account. The check goes in `SimulateSettings.svelte` (where `WithdrawalOrderEditor` is rendered), using the existing `TAX_CATEGORY_MAP` from `types.ts` to classify accounts — e.g., `accounts.some(a => TAX_CATEGORY_MAP[a.account_type] === 'brokerage')` and similarly for `'pretax'`.

**Remove the "Apply" button and `recommendWithdrawalOrder()`.** The recommendation logic in `taxDrag.ts` is no longer needed — the binary toggle is simple enough that the advisory text covers the guidance. Default selection: derive from the current `withdrawal_order` array (if `pretax` comes before `brokerage`, it's "IRA/401k first", otherwise "Brokerage first").

When "Brokerage first" is selected, show an inline advisory:
> Withdrawing from brokerage first MAY allow more Roth conversion, which MAY be advantageous ❓

The ❓ links to the `withdrawal-order` help topic.

**Compare table:** The "Withdrawal" column currently shows only spending strategy (e.g., "Fixed $115K"). Change to include withdrawal priority:
```
Fixed $115K
IRA/401k first
```
Two lines in the cell.

**Snapshot key:** The `withdrawalOrder` field in `ComparisonSnapshot` changes from the `c-b-p-r` abbreviation to one of two literal strings: `"brk-first"` or `"ira-first"`. This value is used in `snapshotKey()` for deduplication and displayed in the Compare table as "Brokerage first" / "IRA/401k first".

### Files affected
- `ui/src/lib/components/settings/WithdrawalOrderEditor.svelte` — rewrite to toggle
- `ui/src/lib/components/SimulateSettings.svelte` — conditional display logic using `TAX_CATEGORY_MAP`
- `ui/src/routes/+page.svelte` — snapshot building (withdrawalOrder → `"brk-first"` / `"ira-first"`)
- `ui/src/lib/components/CompareView.svelte` — column rendering (two-line withdrawal cell)
- `ui/src/lib/help/en/withdrawal-order.md` — update content for binary choice
- `ui/src/lib/taxDrag.ts` — remove `recommendWithdrawalOrder()` (no longer used)

---

## 2. Version/History Display

### Problem
The historical version button is too prominent (full tonal button with large margins). The current version text is too small/subtle relative to it.

### Design

Put both on a **single line** under the app title:
```
📈 Retirement Planner
v2.2.0   🕐 v2.1.0
```

- Current version (`v2.2.0`): plain text, same font/color/prominence as the history link — not clickable
- History link (`🕐 v2.1.0`): keep as a button/link but with **minimal padding/margins** — compact inline appearance
- Both should have the same visual weight

### Files affected
- `ui/src/lib/components/AppBar.svelte` — restructure version display area

---

## 3. Remove Start Year Setting

### Problem
Start year is always "now" — there's no scenario where simulating from a past or future start makes sense. Retirement year (already implemented) handles the "not retired yet" case.

### Design

- **Frontend:** Remove the "Start Year" input from `/settings` Basic Info page. Continue setting `start_year = new Date().getFullYear()` in the store default.
- **Backend:** Add `default_factory=lambda: datetime.date.today().year` to the `start_year` field in the Pydantic model, making it optional in the API. Import `datetime` at the top of `models.py`. Keep the field for backward compatibility.
- **Frontend store:** `start_year` continues to be set automatically; no user-facing control. The `SimulationConfig` type in `types.ts` stays required (store always sets it). The Zod `simulationConfigSchema` in `schema.ts` already has `start_year` as optional in `SimulationConfigInput`; verify `SimulationConfigFull` also makes it optional or retains it as required (fine either way since the store always provides it).

### Files affected
- `ui/src/routes/settings/+page.svelte` — remove Start Year input and its label
- `ui/src/routes/settings/settings.test.ts` — remove assertion for "Start Year" presence
- `src/retirement_model/models.py` — add `default_factory` to `start_year` field, import `datetime`
- Backend tests referencing `start_year` in fixtures continue to pass (field still accepted)

---

## 4. Fix Conservative Growth Anchor

### Problem
The markdown heading `### Conservative Growth {#conservative-growth}` uses explicit anchor syntax, but the custom Marked renderer in `helpMarkdown.ts` auto-generates IDs from heading text. The `{#conservative-growth}` text is included literally in the slug, producing a broken anchor ID.

### Design

Update the Marked renderer's `heading` handler to:
1. Detect `{#some-id}` at the end of heading text
2. Strip it from the displayed text
3. Use the explicit ID for the element's `id` attribute
4. Fall back to auto-generated slug when no explicit ID is present

### Files affected
- `ui/src/lib/helpMarkdown.ts` — update heading renderer

---

## 5. Chart Improvements

### 5a. Unified fill/border colors

**Problem:** Each stacked area in the spending chart has a different border color and fill color, which makes the legend confusing (swatch shows fill, line shows border).

**Design:** For all stacked area datasets in the spending chart, set `borderColor` equal to `backgroundColor` (or set `borderWidth: 0`). This makes legend swatches unambiguous.

**Excluded:** Monte Carlo fan chart (`FanChart.svelte`) — bands and their boundaries should remain visually distinct.

Updated color scheme for spending chart areas (single color, fill = border):
| Area | Color |
|------|-------|
| Spending | `#06b6d4` (cyan-500) |
| Planned Expenses | `#14b8a6` (teal-500) |
| Income Tax | `#737373` (neutral-500) |
| Conversion Tax | `#a78bfa` (violet-400, links to Roth/conversion theme) |
| IRMAA | `#f87171` (red-400, distinct from conversion tax) |
| Surplus → Reinvested | `#4ade80` (green-400) |

Exact hex values may be adjusted during implementation for contrast on the beige background.

### 5b. Desired Spending line for fixed strategy

**Problem:** The "Desired Spending" dashed line is only shown for non-fixed strategies. For fixed dollar, it should show the inflation-adjusted target (which tracks the spending area exactly).

**Design:** Remove the `config.spending_strategy === 'fixed_dollar'` guard in `SimulateView.svelte`'s `desiredSpending` derivation. For fixed dollar, the dashed line tracks the inflation-adjusted spending target — it will overlap the top of the spending area exactly. This is intentional: it provides a consistent visual element across all strategies. The line uses a distinct style (dashed, different color) so even when overlapping it reads as "target" rather than a duplicate data series.

### 5c. Y-axis formatting — $K to $M

**Problem:** Large values display as `$1000K` instead of `$1.0M`.

**Design:** Create a shared tick formatter function used by all three chart components (SpendingChart, BalanceChart, FanChart):
```
value >= 1,000,000 → "$1.0M", "$1.5M", "$2.0M" etc.
value >= 1,000     → "$100K", "$500K" etc.
value < 1,000      → "$500", "$999" etc.
```

Threshold for switching to M notation: tick value >= 1,000,000. Values below that use $K notation (e.g., $100K, $500K). The user's original request was for the switch when "scale change is > $100K" — meaning when the axis range reaches into the millions, not that individual ticks at $100K switch.

### Files affected
- `ui/src/lib/components/charts/SpendingChart.svelte` — colors, tick formatter
- `ui/src/lib/components/charts/BalanceChart.svelte` — tick formatter
- `ui/src/lib/components/charts/FanChart.svelte` — tick formatter
- `ui/src/lib/components/charts/formatTick.ts` — new shared utility (tiny, single function)
- `ui/src/lib/components/SimulateView.svelte` — remove fixed_dollar guard on desiredSpending

---

## 6. Help Content — New Sections

### 6a. Planned Expenses (`planned-expenses.md`)

Category: "Your Inputs"

Content covers:
- One-time vs recurring expenses and how year ranges work
- How planned expenses appear as a separate band in the spending chart (stacked on top of base spending)
- Distinction from base annual spending (which is the steady-state retirement lifestyle cost)

### 6b. Details Page (`details-page.md`)

Category: "Understanding Results"

Content covers:
- What the year-by-year table shows
- Key columns and how to read them (withdrawals by account type, tax breakdown, running balances)
- When to use Details vs the charts (charts for trends, Details for specific-year numbers)

### 6c. Compare Page (`compare-page.md`)

Category: "Understanding Results"

Content covers:
- Snapshots are auto-added each time a simulation runs
- What constitutes a "different" run — settings changes (inflation, growth, spending strategy, conversion, withdrawal order) create a new row; re-running with same settings replaces the existing row
- Input changes (accounts, ages, balances) clear the comparison table because the baseline has changed — the old snapshots aren't comparable
- How to use Compare: run a simulation, change a setting, run again, see both side by side
- The "Clear All" button

### Files affected
- `ui/src/lib/help/en/planned-expenses.md` — new
- `ui/src/lib/help/en/details-page.md` — new
- `ui/src/lib/help/en/compare-page.md` — new
- `ui/src/lib/helpTopics.ts` — register new topics, update `routeTopicMap`: `/compare` → `'compare-page'`, `/details` → `'details-page'` (currently `/spending` → `'spending-strategies'`, keep as-is since planned-expenses is a sub-topic within that page)
- Wire `HelpButton` components on the spending/budget editor, details page, and compare page

---

## Out of Scope
- Backend withdrawal logic changes
- Pre-retirement / retirement year enhancements (todo 201)
- Monte Carlo fan chart color changes
