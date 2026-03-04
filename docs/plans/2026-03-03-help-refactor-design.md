# Help System Refactor Design

## Summary

Replace the current InfoPopover (i) tooltips and basic HelpDrawer with a unified contextual help system. Users click (?) icons on fields or charts to open a help panel with concept-based content organized by financial planning ontology. Content lives in per-topic markdown files for i18n readiness.

## Current State

- **InfoPopover**: 15 inline (i) icons across 5 files showing short popover text
- **HelpDrawer**: Right-side drawer with 4 concept topics, pill-button navigation, accessible from AppBar (?) button
- **helpContent.ts**: Inline HTML strings for 4 topics

## New Components

### HelpPanel (replaces HelpDrawer)

Right-side drawer, 420px wide (expandable to full width). Stacked layout:

```
┌──────────────────────────────┐
│ [Help]                   [X] │  Header
├──────────────────────────────┤
│ ▾ App Basics                 │  Accordion nav (~20-25% height)
│   Getting Started  ·  About  │  Topics as inline pills/links
│ ▸ Your Inputs                │  Active topic highlighted
│ ▾ Rules & Strategies         │
│   Spending · Withdrawal ...  │
│ ▸ Understanding Results      │
├──────────────────────────────┤
│                              │
│  Topic Title                 │  Scrollable content area
│  ══════════                  │  (~70-80% height)
│                              │
│  Rendered markdown content   │
│  with anchor headings...     │
│                              │
├──────────────────────────────┤
│ Related: [Topic] [Topic]     │  Footer with cross-references
└──────────────────────────────┘
```

**Behavior:**
- Accordion groups expand/collapse. Topics shown as compact inline links.
- Clicking a topic loads its markdown content below.
- (?) icon click auto-expands the relevant group, highlights the topic, loads content, scrolls to anchor.
- Close via X button, Escape key, or backdrop click.
- Maximize toggle expands to full width (existing behavior preserved).
- Dark mode support via Skeleton theme tokens.

### HelpButton (replaces InfoPopover)

Small (?) icon component using CircleHelp from lucide-svelte.

```svelte
<HelpButton topic="simulation-parameters" anchor="growth-rate" />
```

Props:
- `topic: string` — topic ID to open
- `anchor?: string` — optional heading anchor to scroll to within the topic

Clicking calls a shared `openHelp(topic, anchor)` function that sets shared state read by HelpPanel.

### Shared Help State

Module-level or store-based reactive state:

```typescript
// helpState.ts
export const helpState = $state({ open: false, topic: 'getting-started', anchor: undefined });
export function openHelp(topic: string, anchor?: string) { ... }
export function closeHelp() { ... }
```

HelpButton writes to this state; HelpPanel reads from it. AppBar's existing (?) button calls `openHelp()` with the route-default topic.

## Topic Structure

### Categories & Topics

| Category | Topic ID | Display Name |
|----------|----------|-------------|
| **App Basics** | `getting-started` | Getting Started |
| | `about` | About |
| **Your Inputs** | `accounts-tax-treatment` | Accounts & Tax Treatment |
| | `income-cola` | Income & COLA |
| | `social-security` | Social Security |
| **Rules & Strategies** | `spending-strategies` | Spending Strategies |
| | `withdrawal-order` | Withdrawal Order |
| | `roth-conversions` | Roth Conversions |
| | `required-minimum-distributions` | Required Minimum Distributions |
| | `simulation-parameters` | Simulation Parameters |
| | `tax-bracket-indexing` | Tax Bracket Indexing |
| **Understanding Results** | `balance-chart` | Balance Chart |
| | `spending-chart` | Spending Chart |
| | `monte-carlo` | Monte Carlo Simulation |
| | `outcome-distribution` | Outcome Distribution |

### Topic Metadata (helpTopics.ts)

```typescript
interface HelpTopic {
    id: string;
    name: string;
    category: string;
    related: string[];      // IDs of related topics
    anchors: string[];      // known anchor IDs within the markdown
}

interface HelpCategory {
    id: string;
    name: string;
    topics: string[];       // ordered topic IDs
}
```

### Field-to-Topic Mapping

| Component | Field | Topic | Anchor |
|-----------|-------|-------|--------|
| SimulateSettings | Inflation % | `simulation-parameters` | `inflation` |
| SimulateSettings | Growth % | `simulation-parameters` | `growth-rate` |
| SimulateSettings | Conversion | `roth-conversions` | `conversion-strategy` |
| SimulateSettings | Strategy | `spending-strategies` | `strategy-selection` |
| SimulateSettings | Floor Rate % | `spending-strategies` | `guardrail-floor` |
| SimulateSettings | Ceiling Rate % | `spending-strategies` | `guardrail-ceiling` |
| AccountsEditor | Basis % | `accounts-tax-treatment` | `cost-basis` |
| AccountsEditor | Stocks % | `accounts-tax-treatment` | `stock-allocation` |
| WithdrawalOrderEditor | Withdrawal Order | `withdrawal-order` | (top of topic) |
| AdvancedSettings | RMD Age | `required-minimum-distributions` | `rmd-age` |
| AdvancedSettings | IRMAA Limit | `roth-conversions` | `irmaa` |
| AdvancedSettings | MC Iterations | `monte-carlo` | `iterations` |
| AdvancedSettings | Excess Income | `withdrawal-order` | `excess-income-routing` |

Chart (?) icons:
- BalanceChart → `balance-chart`
- SpendingChart → `spending-chart`
- FanChart → `outcome-distribution`

## Content System

### File Layout

```
src/lib/help/
  en/
    getting-started.md
    about.md
    accounts-tax-treatment.md
    income-cola.md
    social-security.md
    spending-strategies.md
    withdrawal-order.md
    roth-conversions.md
    required-minimum-distributions.md
    simulation-parameters.md
    tax-bracket-indexing.md
    balance-chart.md
    spending-chart.md
    monte-carlo.md
    outcome-distribution.md
```

### Markdown Format

Standard markdown with heading-based anchors:

```markdown
The simulator supports several approaches to annual spending...

## Fixed Dollar {#strategy-selection}

Withdraws a fixed inflation-adjusted amount each year...

## Guardrails

Adjusts spending dynamically based on withdrawal rate...

### Floor Rate {#guardrail-floor}

The minimum withdrawal rate. When actual rate drops below this...

### Ceiling Rate {#guardrail-ceiling}

The maximum withdrawal rate. When actual rate exceeds this...
```

### Context-Aware Chart Content

Chart markdown files use HTML comment markers for conditional sections:

```markdown
## Account Breakdown

<!-- if:has_pretax -->
**Pre-tax (red)**: Traditional IRA and 401(k) balances...
<!-- endif -->

<!-- if:has_roth_conversion -->
**Roth Conversion (purple)**: Converted amounts...
<!-- endif -->
```

A preprocessor strips sections whose conditions aren't met, based on the current portfolio state (which accounts exist, which income streams are active, etc.).

### Rendering

- Import markdown files at build time via Vite `?raw` imports
- Render to HTML at runtime with `marked` (~13KB gzipped)
- Cache rendered HTML per topic (re-render only when conditions change for context-aware topics)
- Apply existing `.prose-help` CSS class for styling

### i18n Readiness

- Content in separate markdown files per locale directory (`en/`, future `es/`, etc.)
- Topic metadata (names, category names) in `helpTopics.ts` — extractable to locale files later
- Add i18n extraction to a future todo item

## Files to Create

- `ui/src/lib/components/HelpPanel.svelte`
- `ui/src/lib/components/HelpButton.svelte`
- `ui/src/lib/helpState.ts` (or `helpState.svelte.ts` for runes)
- `ui/src/lib/helpTopics.ts`
- `src/lib/help/en/*.md` (15 markdown files)

## Files to Modify

- `ui/src/lib/components/AppBar.svelte` — swap HelpDrawer for HelpPanel
- `ui/src/lib/components/SimulateSettings.svelte` — replace 8 InfoPopover with HelpButton
- `ui/src/lib/components/portfolio/AccountsEditor.svelte` — replace 2 InfoPopover
- `ui/src/lib/components/WithdrawalOrderEditor.svelte` — replace 1 InfoPopover
- `ui/src/lib/components/AdvancedSettings.svelte` — replace 4 InfoPopover
- `ui/src/lib/components/charts/BalanceChart.svelte` — add HelpButton
- `ui/src/lib/components/charts/SpendingChart.svelte` — add HelpButton
- `ui/src/lib/components/charts/FanChart.svelte` — add HelpButton
- `ui/package.json` — add `marked` dependency

## Files to Delete

- `ui/src/lib/components/InfoPopover.svelte`
- `ui/src/lib/components/HelpDrawer.svelte`
- `ui/src/lib/helpContent.ts`

## Testing

- Unit tests for HelpButton (renders ?, click triggers openHelp with correct topic/anchor)
- Unit tests for HelpPanel (renders accordion, topic navigation, content loading, anchor scrolling)
- Unit tests for helpState (open/close, topic switching)
- Unit tests for markdown preprocessing (conditional section stripping)
- Update existing component tests that reference InfoPopover
- E2E test: click field (?), verify help panel opens to correct topic
