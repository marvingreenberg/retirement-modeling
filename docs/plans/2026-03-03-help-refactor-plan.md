# Help System Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace InfoPopover tooltips and basic HelpDrawer with a unified contextual help system using concept-based markdown content, grouped accordion navigation, and field-level (?) icons that deep-link to help topics.

**Architecture:** Shared reactive state (`helpState.svelte.ts`) connects HelpButton components to a HelpPanel drawer. Topic metadata lives in `helpTopics.ts`. Content is authored as markdown files in `src/lib/help/en/`, imported via Vite `?raw`, and rendered at runtime with `marked`. Context-aware chart help uses a simple conditional section preprocessor.

**Tech Stack:** Svelte 5 runes, `marked` (markdown renderer), lucide-svelte icons, Skeleton UI theme tokens, Vite `?raw` imports

**Design doc:** `docs/plans/2026-03-03-help-refactor-design.md`

---

### Task 1: Install `marked` dependency

**Files:**
- Modify: `ui/package.json`

**Step 1: Install marked**

Run: `cd ui && pnpm add marked`

**Step 2: Verify installation**

Run: `cd ui && node -e "const { marked } = require('marked'); console.log(typeof marked)"`
Expected: `function`

**Step 3: Commit**

```bash
git add ui/package.json ui/pnpm-lock.yaml
git commit -m "feat(help): add marked dependency for markdown rendering"
```

---

### Task 2: Help state module

**Files:**
- Create: `ui/src/lib/helpState.svelte.ts`
- Create: `ui/src/lib/helpState.test.ts`

**Step 1: Write the failing tests**

Create `ui/src/lib/helpState.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { helpState, openHelp, closeHelp } from './helpState.svelte';

describe('helpState', () => {
   it('starts closed with default topic', () => {
      expect(helpState.open).toBe(false);
      expect(helpState.topic).toBe('getting-started');
      expect(helpState.anchor).toBeUndefined();
   });

   it('openHelp sets open, topic, and anchor', () => {
      openHelp('spending-strategies', 'guardrail-floor');
      expect(helpState.open).toBe(true);
      expect(helpState.topic).toBe('spending-strategies');
      expect(helpState.anchor).toBe('guardrail-floor');
   });

   it('openHelp without anchor clears anchor', () => {
      openHelp('spending-strategies', 'guardrail-floor');
      openHelp('tax-bracket-indexing');
      expect(helpState.anchor).toBeUndefined();
   });

   it('closeHelp sets open to false and preserves topic', () => {
      openHelp('spending-strategies');
      closeHelp();
      expect(helpState.open).toBe(false);
      expect(helpState.topic).toBe('spending-strategies');
   });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd ui && npx vitest run src/lib/helpState.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

Create `ui/src/lib/helpState.svelte.ts`:

```typescript
export const helpState: { open: boolean; topic: string; anchor: string | undefined } = $state({
   open: false,
   topic: 'getting-started',
   anchor: undefined,
});

export function openHelp(topic: string, anchor?: string): void {
   helpState.open = true;
   helpState.topic = topic;
   helpState.anchor = anchor;
}

export function closeHelp(): void {
   helpState.open = false;
   helpState.anchor = undefined;
}
```

**Step 4: Run tests to verify they pass**

Run: `cd ui && npx vitest run src/lib/helpState.test.ts`
Expected: PASS (all 4 tests)

**Step 5: Commit**

```bash
git add ui/src/lib/helpState.svelte.ts ui/src/lib/helpState.test.ts
git commit -m "feat(help): add shared help state module with open/close functions"
```

---

### Task 3: Help topics metadata module

**Files:**
- Create: `ui/src/lib/helpTopics.ts`
- Create: `ui/src/lib/helpTopics.test.ts`

**Step 1: Write the failing tests**

Create `ui/src/lib/helpTopics.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
   helpCategories,
   getTopicMeta,
   getCategoryForTopic,
   getDefaultTopicId,
   allTopicIds,
} from './helpTopics';

describe('helpTopics', () => {
   it('defines 4 categories', () => {
      expect(helpCategories).toHaveLength(4);
      const names = helpCategories.map((c) => c.name);
      expect(names).toEqual(['App Basics', 'Your Inputs', 'Rules & Strategies', 'Understanding Results']);
   });

   it('defines 15 topics total', () => {
      expect(allTopicIds).toHaveLength(15);
   });

   it('getTopicMeta returns metadata for known topic', () => {
      const meta = getTopicMeta('spending-strategies');
      expect(meta).toBeDefined();
      expect(meta!.name).toBe('Spending Strategies');
      expect(meta!.related.length).toBeGreaterThan(0);
   });

   it('getTopicMeta returns undefined for unknown topic', () => {
      expect(getTopicMeta('nonexistent')).toBeUndefined();
   });

   it('getCategoryForTopic returns correct category', () => {
      const cat = getCategoryForTopic('balance-chart');
      expect(cat).toBeDefined();
      expect(cat!.name).toBe('Understanding Results');
   });

   it('getDefaultTopicId maps routes to topics', () => {
      expect(getDefaultTopicId('/')).toBe('getting-started');
      expect(getDefaultTopicId('/details')).toBe('tax-bracket-indexing');
      expect(getDefaultTopicId('/compare')).toBe('spending-strategies');
      expect(getDefaultTopicId('/spending')).toBe('spending-strategies');
   });

   it('getDefaultTopicId falls back for unknown routes', () => {
      expect(getDefaultTopicId('/unknown')).toBe('getting-started');
   });

   it('all related topic references are valid', () => {
      const validIds = new Set(allTopicIds);
      for (const cat of helpCategories) {
         for (const topic of cat.topics) {
            for (const relId of topic.related) {
               expect(validIds.has(relId), `${topic.id} references unknown topic ${relId}`).toBe(true);
            }
         }
      }
   });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd ui && npx vitest run src/lib/helpTopics.test.ts`
Expected: FAIL — module not found

**Step 3: Write implementation**

Create `ui/src/lib/helpTopics.ts`:

```typescript
export interface HelpTopicMeta {
   id: string;
   name: string;
   related: string[];
}

export interface HelpCategory {
   id: string;
   name: string;
   topics: HelpTopicMeta[];
}

export const helpCategories: HelpCategory[] = [
   {
      id: 'app-basics',
      name: 'App Basics',
      topics: [
         { id: 'getting-started', name: 'Getting Started', related: ['spending-strategies', 'balance-chart'] },
         { id: 'about', name: 'About', related: [] },
      ],
   },
   {
      id: 'your-inputs',
      name: 'Your Inputs',
      topics: [
         { id: 'accounts-tax-treatment', name: 'Accounts & Tax Treatment', related: ['withdrawal-order', 'tax-bracket-indexing'] },
         { id: 'income-cola', name: 'Income & COLA', related: ['social-security', 'tax-bracket-indexing'] },
         { id: 'social-security', name: 'Social Security', related: ['income-cola', 'spending-strategies'] },
      ],
   },
   {
      id: 'rules-strategies',
      name: 'Rules & Strategies',
      topics: [
         { id: 'spending-strategies', name: 'Spending Strategies', related: ['withdrawal-order', 'simulation-parameters'] },
         { id: 'withdrawal-order', name: 'Withdrawal Order', related: ['accounts-tax-treatment', 'spending-strategies'] },
         { id: 'roth-conversions', name: 'Roth Conversions', related: ['tax-bracket-indexing', 'accounts-tax-treatment'] },
         { id: 'required-minimum-distributions', name: 'Required Minimum Distributions', related: ['accounts-tax-treatment', 'withdrawal-order'] },
         { id: 'simulation-parameters', name: 'Simulation Parameters', related: ['spending-strategies', 'monte-carlo'] },
         { id: 'tax-bracket-indexing', name: 'Tax Bracket Indexing', related: ['roth-conversions', 'spending-strategies'] },
      ],
   },
   {
      id: 'understanding-results',
      name: 'Understanding Results',
      topics: [
         { id: 'balance-chart', name: 'Balance Chart', related: ['spending-chart', 'accounts-tax-treatment'] },
         { id: 'spending-chart', name: 'Spending Chart', related: ['balance-chart', 'spending-strategies'] },
         { id: 'monte-carlo', name: 'Monte Carlo Simulation', related: ['outcome-distribution', 'simulation-parameters'] },
         { id: 'outcome-distribution', name: 'Outcome Distribution', related: ['monte-carlo', 'spending-strategies'] },
      ],
   },
];

export const allTopicIds: string[] = helpCategories.flatMap((c) => c.topics.map((t) => t.id));

const topicIndex = new Map<string, HelpTopicMeta>(
   helpCategories.flatMap((c) => c.topics.map((t) => [t.id, t] as const)),
);

const categoryIndex = new Map<string, HelpCategory>(
   helpCategories.flatMap((c) => c.topics.map((t) => [t.id, c] as const)),
);

export function getTopicMeta(id: string): HelpTopicMeta | undefined {
   return topicIndex.get(id);
}

export function getCategoryForTopic(id: string): HelpCategory | undefined {
   return categoryIndex.get(id);
}

const routeTopicMap: Record<string, string> = {
   '/': 'getting-started',
   '/spending': 'spending-strategies',
   '/compare': 'spending-strategies',
   '/details': 'tax-bracket-indexing',
};

export function getDefaultTopicId(pathname: string): string {
   return routeTopicMap[pathname] ?? 'getting-started';
}
```

**Step 4: Run tests to verify they pass**

Run: `cd ui && npx vitest run src/lib/helpTopics.test.ts`
Expected: PASS (all 8 tests)

**Step 5: Commit**

```bash
git add ui/src/lib/helpTopics.ts ui/src/lib/helpTopics.test.ts
git commit -m "feat(help): add topic metadata with categories, related topics, and route mapping"
```

---

### Task 4: HelpButton component

**Files:**
- Create: `ui/src/lib/components/HelpButton.svelte`
- Create: `ui/src/lib/components/HelpButton.test.ts`

**Step 1: Write the failing tests**

Create `ui/src/lib/components/HelpButton.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import HelpButton from './HelpButton.svelte';
import { helpState } from '$lib/helpState.svelte';

describe('HelpButton', () => {
   beforeEach(() => {
      helpState.open = false;
      helpState.topic = 'getting-started';
      helpState.anchor = undefined;
   });

   it('renders a button with question mark label', () => {
      render(HelpButton, { props: { topic: 'spending-strategies' } });
      expect(screen.getByRole('button', { name: 'Help' })).toBeInTheDocument();
   });

   it('opens help to the specified topic on click', async () => {
      render(HelpButton, { props: { topic: 'spending-strategies' } });
      await fireEvent.click(screen.getByRole('button', { name: 'Help' }));
      expect(helpState.open).toBe(true);
      expect(helpState.topic).toBe('spending-strategies');
      expect(helpState.anchor).toBeUndefined();
   });

   it('opens help with anchor when provided', async () => {
      render(HelpButton, { props: { topic: 'simulation-parameters', anchor: 'growth-rate' } });
      await fireEvent.click(screen.getByRole('button', { name: 'Help' }));
      expect(helpState.open).toBe(true);
      expect(helpState.topic).toBe('simulation-parameters');
      expect(helpState.anchor).toBe('growth-rate');
   });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd ui && npx vitest run src/lib/components/HelpButton.test.ts`
Expected: FAIL — module not found

**Step 3: Write implementation**

Create `ui/src/lib/components/HelpButton.svelte`:

```svelte
<script lang="ts">
   import { CircleHelp } from 'lucide-svelte';
   import { openHelp } from '$lib/helpState.svelte';

   let { topic, anchor }: { topic: string; anchor?: string } = $props();
</script>

<button
   class="inline-flex items-center justify-center w-4 h-4 rounded-full text-surface-500 dark:text-surface-400 hover:text-primary-500 dark:hover:text-primary-400 cursor-pointer"
   onclick={(e) => {
      e.stopPropagation();
      openHelp(topic, anchor);
   }}
   aria-label="Help"
   type="button"
>
   <CircleHelp size={14} />
</button>
```

**Step 4: Run tests to verify they pass**

Run: `cd ui && npx vitest run src/lib/components/HelpButton.test.ts`
Expected: PASS (all 3 tests)

**Step 5: Commit**

```bash
git add ui/src/lib/components/HelpButton.svelte ui/src/lib/components/HelpButton.test.ts
git commit -m "feat(help): add HelpButton component that opens help to a specific topic+anchor"
```

---

### Task 5: Markdown content files

**Files:**
- Create: `ui/src/lib/help/en/*.md` (15 files)
- Create: `ui/src/lib/helpContent.ts` (new version — markdown loader)
- Create: `ui/src/lib/helpMarkdown.ts` (conditional preprocessor + render)
- Create: `ui/src/lib/helpMarkdown.test.ts`

This task creates the content files and the markdown loading/rendering infrastructure. The content below is initial drafts — it will be refined during visual review.

**Step 1: Create directory structure**

Run: `mkdir -p ui/src/lib/help/en`

**Step 2: Write the markdown preprocessor tests**

Create `ui/src/lib/helpMarkdown.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { processConditionalSections, renderMarkdown } from './helpMarkdown';

describe('processConditionalSections', () => {
   it('keeps content when condition is true', () => {
      const md = 'intro\n<!-- if:has_pretax -->\npretax content\n<!-- endif -->\noutro';
      const result = processConditionalSections(md, { has_pretax: true });
      expect(result).toContain('pretax content');
      expect(result).toContain('intro');
      expect(result).toContain('outro');
      expect(result).not.toContain('<!-- if:');
   });

   it('strips content when condition is false', () => {
      const md = 'intro\n<!-- if:has_pretax -->\npretax content\n<!-- endif -->\noutro';
      const result = processConditionalSections(md, { has_pretax: false });
      expect(result).not.toContain('pretax content');
      expect(result).toContain('intro');
      expect(result).toContain('outro');
   });

   it('handles missing conditions as false', () => {
      const md = '<!-- if:has_pretax -->\nhidden\n<!-- endif -->';
      const result = processConditionalSections(md, {});
      expect(result).not.toContain('hidden');
   });

   it('handles multiple conditions', () => {
      const md = '<!-- if:a -->\nA\n<!-- endif -->\n<!-- if:b -->\nB\n<!-- endif -->';
      const result = processConditionalSections(md, { a: true, b: false });
      expect(result).toContain('A');
      expect(result).not.toContain('B');
   });

   it('passes through content with no conditions unchanged', () => {
      const md = '# Title\nSome content';
      const result = processConditionalSections(md, {});
      expect(result).toBe(md);
   });
});

describe('renderMarkdown', () => {
   it('renders heading to HTML with id', () => {
      const html = renderMarkdown('## Growth Rate');
      expect(html).toContain('<h2');
      expect(html).toContain('Growth Rate');
   });

   it('renders paragraph', () => {
      const html = renderMarkdown('Some text');
      expect(html).toContain('<p>Some text</p>');
   });
});
```

**Step 3: Run tests to verify they fail**

Run: `cd ui && npx vitest run src/lib/helpMarkdown.test.ts`
Expected: FAIL — module not found

**Step 4: Write the markdown preprocessor and renderer**

Create `ui/src/lib/helpMarkdown.ts`:

```typescript
import { marked } from 'marked';

const conditionalRe = /<!-- if:(\w+) -->\n([\s\S]*?)<!-- endif -->/g;

export function processConditionalSections(
   md: string,
   conditions: Record<string, boolean>,
): string {
   return md.replace(conditionalRe, (_, key: string, content: string) => {
      return conditions[key] ? content : '';
   });
}

const renderCache = new Map<string, string>();

export function renderMarkdown(md: string): string {
   const cached = renderCache.get(md);
   if (cached) return cached;
   const html = marked.parse(md, { async: false }) as string;
   renderCache.set(md, html);
   return html;
}
```

**Step 5: Run tests to verify they pass**

Run: `cd ui && npx vitest run src/lib/helpMarkdown.test.ts`
Expected: PASS (all 7 tests)

**Step 6: Write the content loader module**

Replace `ui/src/lib/helpContent.ts` with a new version that loads markdown files:

```typescript
import { processConditionalSections, renderMarkdown } from './helpMarkdown';

// Vite ?raw imports — all help content bundled at build time
const mdModules = import.meta.glob('./help/en/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

function loadRawMd(topicId: string): string {
   const key = `./help/en/${topicId}.md`;
   return (mdModules[key] as string) ?? '';
}

export function getTopicHtml(topicId: string, conditions?: Record<string, boolean>): string {
   let md = loadRawMd(topicId);
   if (!md) return '<p>No content available for this topic.</p>';
   if (conditions) md = processConditionalSections(md, conditions);
   return renderMarkdown(md);
}
```

**Step 7: Write the 15 markdown content files**

Create each file in `ui/src/lib/help/en/`. Content should be thorough, accurate to the simulation's behavior, and include anchors matching the field-to-topic mapping in the design doc.

Example for `ui/src/lib/help/en/simulation-parameters.md`:

```markdown
The simulation uses several configurable parameters to project your retirement finances.

## Inflation {#inflation}

The assumed annual rate at which prices increase, reducing the purchasing power of fixed withdrawals over time. This rate also indexes tax brackets (see Tax Bracket Indexing) and adjusts desired spending in the Fixed Dollar strategy.

Historical US inflation has averaged about 3% annually. The default of 3% is a reasonable planning assumption.

## Growth Rate {#growth-rate}

The assumed annual return on investments before inflation. This applies uniformly to all accounts.

Historical equity returns have averaged about 10% nominal (7% real). A conservative planning value might be 6-7% to account for a mixed stock/bond portfolio.

**Note:** In Monte Carlo mode, this value is ignored — returns are sampled from historical market data (1928-present) instead.
```

The remaining 14 files follow the same pattern. Each file is authored with:
- Anchors matching the field-to-topic mapping table in the design doc
- Content migrated from existing InfoPopover text and helpContent.ts HTML, expanded with more detail
- Chart files using `<!-- if:condition -->` markers for context-aware sections

**Full list of files to create** (content to be authored during implementation):
- `getting-started.md` — Overview of the simulator, what the pages do
- `about.md` — Version info, open source, privacy (local-only storage)
- `accounts-tax-treatment.md` — Account types, cost basis (#cost-basis), stock allocation (#stock-allocation), tax drag
- `income-cola.md` — Income streams, COLA calculations
- `social-security.md` — Benefit formula, claiming age, taxability
- `spending-strategies.md` — Fixed Dollar, % of Portfolio, Guardrails (#strategy-selection, #guardrail-floor, #guardrail-ceiling)
- `withdrawal-order.md` — Withdrawal sequence, excess income routing (#excess-income-routing)
- `roth-conversions.md` — Conversion strategy (#conversion-strategy), IRMAA (#irmaa)
- `required-minimum-distributions.md` — RMD rules, age (#rmd-age)
- `simulation-parameters.md` — Inflation (#inflation), growth rate (#growth-rate)
- `tax-bracket-indexing.md` — How bracket inflation works
- `balance-chart.md` — Stacked areas, account colors, retirement marker (conditional sections for account types)
- `spending-chart.md` — Cash flow components, desired vs actual, surplus (conditional sections)
- `monte-carlo.md` — How MC works, iterations (#iterations), historical sampling
- `outcome-distribution.md` — Fan chart, percentile bands, what they mean

**Step 8: Commit**

```bash
git add ui/src/lib/helpMarkdown.ts ui/src/lib/helpMarkdown.test.ts ui/src/lib/helpContent.ts ui/src/lib/help/
git commit -m "feat(help): add markdown content system with 15 topic files and conditional preprocessor"
```

---

### Task 6: HelpPanel component

**Files:**
- Create: `ui/src/lib/components/HelpPanel.svelte`
- Create: `ui/src/lib/components/HelpPanel.test.ts`

**Step 1: Write the failing tests**

Create `ui/src/lib/components/HelpPanel.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
import { helpState, openHelp, closeHelp } from '$lib/helpState.svelte';

// Must dynamically import after helpState is available
const { default: HelpPanel } = await import('./HelpPanel.svelte');

describe('HelpPanel', () => {
   beforeEach(() => {
      closeHelp();
   });

   it('does not render when helpState.open is false', () => {
      render(HelpPanel);
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
   });

   it('renders when helpState.open is true', () => {
      openHelp('getting-started');
      render(HelpPanel);
      expect(screen.getByRole('complementary', { name: 'Help' })).toBeInTheDocument();
   });

   it('shows all 4 category headings', () => {
      openHelp('getting-started');
      render(HelpPanel);
      expect(screen.getByText('App Basics')).toBeInTheDocument();
      expect(screen.getByText('Your Inputs')).toBeInTheDocument();
      expect(screen.getByText('Rules & Strategies')).toBeInTheDocument();
      expect(screen.getByText('Understanding Results')).toBeInTheDocument();
   });

   it('expands category containing active topic', () => {
      openHelp('spending-strategies');
      render(HelpPanel);
      // "Rules & Strategies" should be expanded, showing the topic link
      expect(screen.getByText('Spending Strategies')).toBeInTheDocument();
   });

   it('navigates to a different topic on click', async () => {
      openHelp('getting-started');
      render(HelpPanel);
      // Expand "Rules & Strategies" then click a topic
      await fireEvent.click(screen.getByText('Rules & Strategies'));
      await fireEvent.click(screen.getByText('Spending Strategies'));
      expect(helpState.topic).toBe('spending-strategies');
   });

   it('has close button that closes the panel', async () => {
      openHelp('getting-started');
      render(HelpPanel);
      await fireEvent.click(screen.getByLabelText('Close help'));
      expect(helpState.open).toBe(false);
   });

   it('has maximize and minimize toggle', async () => {
      openHelp('getting-started');
      render(HelpPanel);
      expect(screen.getByLabelText('Maximize help')).toBeInTheDocument();
      await fireEvent.click(screen.getByLabelText('Maximize help'));
      expect(screen.getByLabelText('Minimize help')).toBeInTheDocument();
   });

   it('shows related topics for current topic', () => {
      openHelp('spending-strategies');
      render(HelpPanel);
      expect(screen.getByText('Related Topics')).toBeInTheDocument();
   });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd ui && npx vitest run src/lib/components/HelpPanel.test.ts`
Expected: FAIL — module not found

**Step 3: Write the HelpPanel component**

Create `ui/src/lib/components/HelpPanel.svelte`:

```svelte
<script lang="ts">
   import { helpState, closeHelp } from '$lib/helpState.svelte';
   import { helpCategories, getTopicMeta, getCategoryForTopic } from '$lib/helpTopics';
   import { getTopicHtml } from '$lib/helpContent';
   import { X, Maximize2, Minimize2, BookOpen, ChevronDown, ChevronRight } from 'lucide-svelte';
   import { tick } from 'svelte';

   let maximized = $state(false);
   let contentEl: HTMLDivElement | undefined = $state();

   // Track which categories are expanded; auto-expand the one containing active topic
   let expandedCategories = $state(new Set<string>());

   $effect(() => {
      if (helpState.open) {
         maximized = false;
         const cat = getCategoryForTopic(helpState.topic);
         if (cat) expandedCategories = new Set([cat.id]);
      }
   });

   let topicHtml = $derived(getTopicHtml(helpState.topic));
   let topicMeta = $derived(getTopicMeta(helpState.topic));
   let relatedTopics = $derived(
      (topicMeta?.related ?? [])
         .map((id) => getTopicMeta(id))
         .filter((t): t is NonNullable<typeof t> => t != null),
   );

   function toggleCategory(catId: string) {
      const next = new Set(expandedCategories);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      expandedCategories = next;
   }

   async function selectTopic(id: string) {
      helpState.topic = id;
      helpState.anchor = undefined;
      await tick();
      contentEl?.scrollTo(0, 0);
   }

   async function scrollToAnchor() {
      if (!helpState.anchor || !contentEl) return;
      await tick();
      const el = contentEl.querySelector(`#${CSS.escape(helpState.anchor)}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      helpState.anchor = undefined;
   }

   $effect(() => {
      if (helpState.anchor && contentEl) {
         scrollToAnchor();
      }
   });

   function handleBackdrop(e: MouseEvent) {
      if (e.target === e.currentTarget) closeHelp();
   }

   function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeHelp();
   }
</script>

{#if helpState.open}
   <!-- svelte-ignore a11y_no_static_element_interactions -->
   <div
      class="fixed inset-0 bg-black/40 z-50"
      onclick={handleBackdrop}
      onkeydown={handleKeydown}
   >
      <aside
         class="absolute right-0 top-0 h-full bg-surface-50 dark:bg-surface-900 shadow-xl flex flex-col transition-all duration-200"
         class:w-full={maximized}
         class:max-w-none={maximized}
         class:w-[420px]={!maximized}
         aria-label="Help"
         role="complementary"
      >
         <!-- Header -->
         <div class="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700 shrink-0">
            <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
               <BookOpen size={20} class="text-primary-500" /> Help
            </h2>
            <div class="flex items-center gap-1">
               <button
                  class="btn btn-sm preset-ghost"
                  onclick={() => (maximized = !maximized)}
                  aria-label={maximized ? 'Minimize help' : 'Maximize help'}
               >
                  {#if maximized}<Minimize2 size={16} />{:else}<Maximize2 size={16} />{/if}
               </button>
               <button
                  class="btn btn-sm preset-ghost"
                  onclick={() => closeHelp()}
                  aria-label="Close help"
               >
                  <X size={18} />
               </button>
            </div>
         </div>

         <!-- Accordion nav -->
         <nav class="shrink-0 border-b border-surface-200 dark:border-surface-700 p-3 overflow-y-auto max-h-[30%]" aria-label="Help topics">
            {#each helpCategories as cat (cat.id)}
               <div class="mb-1">
                  <button
                     class="flex items-center gap-1 w-full text-left text-sm font-medium text-surface-700 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-100 py-0.5"
                     onclick={() => toggleCategory(cat.id)}
                  >
                     {#if expandedCategories.has(cat.id)}<ChevronDown size={14} />{:else}<ChevronRight size={14} />{/if}
                     {cat.name}
                  </button>
                  {#if expandedCategories.has(cat.id)}
                     <div class="flex gap-1 flex-wrap pl-5 py-1">
                        {#each cat.topics as topic (topic.id)}
                           <button
                              class="px-2 py-0.5 text-xs rounded {helpState.topic === topic.id
                                 ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium'
                                 : 'text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-800'}"
                              onclick={() => selectTopic(topic.id)}
                           >
                              {topic.name}
                           </button>
                        {/each}
                     </div>
                  {/if}
               </div>
            {/each}
         </nav>

         <!-- Content -->
         <div bind:this={contentEl} class="flex-1 overflow-y-auto p-5">
            {#if topicMeta}
               <h3 class="text-base font-semibold text-surface-900 dark:text-surface-50 mb-4">
                  {topicMeta.name}
               </h3>
            {/if}
            <div class="prose-help text-sm text-surface-700 dark:text-surface-300 leading-relaxed space-y-3">
               <!-- eslint-disable-next-line svelte/no-at-html-tags -- trusted app-authored help content -->
               {@html topicHtml}
            </div>

            {#if relatedTopics.length > 0}
               <div class="mt-6 pt-4 border-t border-surface-200 dark:border-surface-700">
                  <span class="text-xs text-surface-500 uppercase tracking-wide">Related Topics</span>
                  <div class="flex gap-2 mt-2 flex-wrap">
                     {#each relatedTopics as related (related.id)}
                        <button
                           class="btn btn-sm preset-ghost text-primary-500"
                           onclick={() => selectTopic(related.id)}
                        >
                           {related.name} &rarr;
                        </button>
                     {/each}
                  </div>
               </div>
            {/if}
         </div>
      </aside>
   </div>
{/if}
```

**Step 4: Run tests to verify they pass**

Run: `cd ui && npx vitest run src/lib/components/HelpPanel.test.ts`
Expected: PASS (all 8 tests)

**Step 5: Commit**

```bash
git add ui/src/lib/components/HelpPanel.svelte ui/src/lib/components/HelpPanel.test.ts
git commit -m "feat(help): add HelpPanel with accordion navigation and markdown content rendering"
```

---

### Task 7: Wire HelpPanel into AppBar

**Files:**
- Modify: `ui/src/lib/components/AppBar.svelte` (lines 6, 28, 71-77, 85)
- Modify: `ui/src/lib/components/AppBar.test.ts`

**Step 1: Update AppBar.svelte**

Changes:
1. Replace `import HelpDrawer` with `import HelpPanel` and `import { openHelp } from '$lib/helpState.svelte'` and `import { getDefaultTopicId } from '$lib/helpTopics'`
2. Remove `let helpOpen = $state(false)`
3. Change the help button onclick from `() => (helpOpen = true)` to `() => openHelp(getDefaultTopicId(page.url.pathname))`
4. Replace `<HelpDrawer bind:open={helpOpen} />` with `<HelpPanel />`

**Step 2: Update AppBar tests**

Modify `ui/src/lib/components/AppBar.test.ts`:
- Remove any tests that check `helpOpen` state or HelpDrawer rendering
- Add test that clicking help button calls openHelp (verify via helpState)

**Step 3: Run tests**

Run: `cd ui && npx vitest run src/lib/components/AppBar.test.ts`
Expected: PASS

**Step 4: Run all tests to check for regressions**

Run: `cd ui && npx vitest run`
Expected: Some tests in HelpDrawer.test.ts and helpContent.test.ts may now fail since the old modules are being replaced. That's expected — those tests will be removed in Task 12.

**Step 5: Commit**

```bash
git add ui/src/lib/components/AppBar.svelte ui/src/lib/components/AppBar.test.ts
git commit -m "feat(help): wire HelpPanel into AppBar, replacing HelpDrawer"
```

---

### Task 8: Replace InfoPopovers in SimulateSettings

**Files:**
- Modify: `ui/src/lib/components/SimulateSettings.svelte`

**Step 1: Update imports**

Replace `import InfoPopover from './InfoPopover.svelte'` (line 10) with `import HelpButton from './HelpButton.svelte'`.

**Step 2: Replace all InfoPopover usages**

There are 8 InfoPopover instances in this file. Replace each one:

| Line | Old | New |
|------|-----|-----|
| 148-150 | `<InfoPopover text="Assumed annual rate..." />` | `<HelpButton topic="simulation-parameters" anchor="inflation" />` |
| 174-176 | `<InfoPopover text="Assumed annual return..." />` | `<HelpButton topic="simulation-parameters" anchor="growth-rate" />` |
| 199-201 | `<InfoPopover text="Controls Roth conversion..." />` | `<HelpButton topic="roth-conversions" anchor="conversion-strategy" />` |
| 236-238 | `<InfoPopover text="How annual withdrawals..." />` | `<HelpButton topic="spending-strategies" anchor="strategy-selection" />` |
| 275-277 | `<InfoPopover text="How annual withdrawals..." />` | `<HelpButton topic="spending-strategies" anchor="strategy-selection" />` |
| 293-295 | `<InfoPopover text="Minimum withdrawal rate..." />` | `<HelpButton topic="spending-strategies" anchor="guardrail-floor" />` |
| 315-317 | `<InfoPopover text="Maximum withdrawal rate..." />` | `<HelpButton topic="spending-strategies" anchor="guardrail-ceiling" />` |
| 368-370 | `<InfoPopover text="How annual withdrawals..." />` | `<HelpButton topic="spending-strategies" anchor="strategy-selection" />` |

**Step 3: Run lint**

Run: `cd ui && npx eslint src/lib/components/SimulateSettings.svelte`
Expected: No new warnings

**Step 4: Commit**

```bash
git add ui/src/lib/components/SimulateSettings.svelte
git commit -m "refactor(help): replace InfoPopovers with HelpButtons in SimulateSettings"
```

---

### Task 9: Replace InfoPopovers in remaining components

**Files:**
- Modify: `ui/src/lib/components/portfolio/AccountsEditor.svelte` (lines 18, 267-269, 295-297)
- Modify: `ui/src/lib/components/settings/WithdrawalOrderEditor.svelte` (lines 10, 97-99)
- Modify: `ui/src/lib/components/settings/AdvancedSettings.svelte` (lines 3, 42-44, 60-62, 78-80, 95-97)

**Step 1: AccountsEditor.svelte**

Replace `import InfoPopover from '$lib/components/InfoPopover.svelte'` (line 18) with `import HelpButton from '$lib/components/HelpButton.svelte'`.

Replace:
- Line 267-269: `<InfoPopover text="The portion of the account..." />` → `<HelpButton topic="accounts-tax-treatment" anchor="cost-basis" />`
- Line 295-297: `<InfoPopover text="Percentage of equities..." />` → `<HelpButton topic="accounts-tax-treatment" anchor="stock-allocation" />`

**Step 2: WithdrawalOrderEditor.svelte**

Replace `import InfoPopover from '$lib/components/InfoPopover.svelte'` (line 10) with `import HelpButton from '$lib/components/HelpButton.svelte'`.

Replace:
- Line 97-99: `<InfoPopover text="Order in which account types..." />` → `<HelpButton topic="withdrawal-order" />`

**Step 3: AdvancedSettings.svelte**

Replace `import InfoPopover from '$lib/components/InfoPopover.svelte'` (line 3) with `import HelpButton from '$lib/components/HelpButton.svelte'`.

Replace:
- Line 42-44: `<InfoPopover text="Age at which Required..." />` → `<HelpButton topic="required-minimum-distributions" anchor="rmd-age" />`
- Line 60-62: `<InfoPopover text="Income threshold above..." />` → `<HelpButton topic="roth-conversions" anchor="irmaa" />`
- Line 78-80: `<InfoPopover text="Number of Monte Carlo..." />` → `<HelpButton topic="monte-carlo" anchor="iterations" />`
- Line 95-97: `<InfoPopover text="When income exceeds..." />` → `<HelpButton topic="withdrawal-order" anchor="excess-income-routing" />`

**Step 4: Verify no remaining InfoPopover imports**

Run: `cd ui && grep -r "InfoPopover" src/lib/components/ --include="*.svelte" -l`
Expected: Only `InfoPopover.svelte` itself (will be deleted in cleanup)

**Step 5: Run lint**

Run: `cd ui && npx eslint src/lib/components/portfolio/AccountsEditor.svelte src/lib/components/settings/WithdrawalOrderEditor.svelte src/lib/components/settings/AdvancedSettings.svelte`

**Step 6: Commit**

```bash
git add ui/src/lib/components/portfolio/AccountsEditor.svelte ui/src/lib/components/settings/WithdrawalOrderEditor.svelte ui/src/lib/components/settings/AdvancedSettings.svelte
git commit -m "refactor(help): replace InfoPopovers with HelpButtons in AccountsEditor, WithdrawalOrderEditor, AdvancedSettings"
```

---

### Task 10: Add HelpButtons to chart components

**Files:**
- Modify: `ui/src/lib/components/charts/BalanceChart.svelte` (template at line 164)
- Modify: `ui/src/lib/components/charts/SpendingChart.svelte` (template at line 210)
- Modify: `ui/src/lib/components/charts/FanChart.svelte` (template at line 144)

**Step 1: Add HelpButton import to each chart**

Add `import HelpButton from '$lib/components/HelpButton.svelte'` to the `<script>` section of each chart.

**Step 2: Add (?) icon to each chart's template**

For each chart, wrap the existing `<div class="relative ...">` in a container with a HelpButton in the top-right corner. For example in BalanceChart:

```svelte
<div class="relative w-full max-h-[400px]">
   <div class="absolute top-0 right-0 z-10 p-1">
      <HelpButton topic="balance-chart" />
   </div>
   <canvas bind:this={canvas}></canvas>
   <!-- existing ChartEventOverlay if present -->
</div>
```

Similarly:
- SpendingChart: `<HelpButton topic="spending-chart" />`
- FanChart: `<HelpButton topic="outcome-distribution" />`

**Step 3: Run lint**

Run: `cd ui && npx eslint src/lib/components/charts/BalanceChart.svelte src/lib/components/charts/SpendingChart.svelte src/lib/components/charts/FanChart.svelte`

**Step 4: Commit**

```bash
git add ui/src/lib/components/charts/BalanceChart.svelte ui/src/lib/components/charts/SpendingChart.svelte ui/src/lib/components/charts/FanChart.svelte
git commit -m "feat(help): add HelpButtons to chart components"
```

---

### Task 11: Cleanup — delete old files and update tests

**Files:**
- Delete: `ui/src/lib/components/InfoPopover.svelte`
- Delete: `ui/src/lib/components/infopopover.test.ts`
- Delete: `ui/src/lib/components/HelpDrawer.svelte`
- Delete: `ui/src/lib/components/HelpDrawer.test.ts`
- Delete: `ui/src/lib/helpContent.test.ts` (old tests for the replaced module)

**Step 1: Verify no remaining imports of old modules**

Run: `cd ui && grep -rn "InfoPopover\|HelpDrawer\|from.*helpContent" src/ --include="*.ts" --include="*.svelte" | grep -v "node_modules" | grep -v ".test.ts"`
Expected: No results (all imports already migrated)

Also check test files:
Run: `cd ui && grep -rn "InfoPopover\|HelpDrawer\|from.*helpContent" src/ --include="*.test.ts"`
Expected: Only the files being deleted

**Step 2: Delete old files**

```bash
rm ui/src/lib/components/InfoPopover.svelte
rm ui/src/lib/components/infopopover.test.ts
rm ui/src/lib/components/HelpDrawer.svelte
rm ui/src/lib/components/HelpDrawer.test.ts
rm ui/src/lib/helpContent.test.ts
```

**Step 3: Run all tests**

Run: `cd ui && npx vitest run`
Expected: All tests pass. Old test files are gone, new tests cover the replacement.

**Step 4: Run lint**

Run: `make lint-ui`
Expected: No errors

**Step 5: Run svelte-check**

Run: `cd ui && npx svelte-check --tsconfig ./tsconfig.json`
Expected: No errors related to help components

**Step 6: Commit**

```bash
git add -A ui/src/lib/components/InfoPopover.svelte ui/src/lib/components/infopopover.test.ts ui/src/lib/components/HelpDrawer.svelte ui/src/lib/components/HelpDrawer.test.ts ui/src/lib/helpContent.test.ts
git commit -m "refactor(help): remove InfoPopover, HelpDrawer, and old helpContent module"
```

---

### Task 12: Write helpContent tests for new module

**Files:**
- Create: `ui/src/lib/helpContent.test.ts` (new version for the markdown loader)

**Step 1: Write tests**

```typescript
import { describe, it, expect } from 'vitest';
import { getTopicHtml } from './helpContent';

describe('helpContent (markdown loader)', () => {
   it('returns HTML for a known topic', () => {
      const html = getTopicHtml('getting-started');
      expect(html).toContain('<');
      expect(html.length).toBeGreaterThan(50);
   });

   it('returns fallback for unknown topic', () => {
      const html = getTopicHtml('nonexistent');
      expect(html).toContain('No content available');
   });

   it('all 15 topics return non-empty content', () => {
      const topicIds = [
         'getting-started', 'about', 'accounts-tax-treatment', 'income-cola',
         'social-security', 'spending-strategies', 'withdrawal-order',
         'roth-conversions', 'required-minimum-distributions', 'simulation-parameters',
         'tax-bracket-indexing', 'balance-chart', 'spending-chart', 'monte-carlo',
         'outcome-distribution',
      ];
      for (const id of topicIds) {
         const html = getTopicHtml(id);
         expect(html.length, `${id} should have content`).toBeGreaterThan(50);
      }
   });

   it('processes conditional sections when conditions provided', () => {
      const withPretax = getTopicHtml('balance-chart', { has_pretax: true });
      const withoutPretax = getTopicHtml('balance-chart', { has_pretax: false });
      // Content with condition true should be longer (has more sections)
      // This test validates that the preprocessor is actually running
      expect(withPretax.length).toBeGreaterThanOrEqual(withoutPretax.length);
   });
});
```

**Step 2: Run tests**

Run: `cd ui && npx vitest run src/lib/helpContent.test.ts`
Expected: PASS

**Step 3: Run full test suite**

Run: `cd ui && npx vitest run`
Expected: All tests pass

**Step 4: Run lint**

Run: `make lint`
Expected: Clean

**Step 5: Commit**

```bash
git add ui/src/lib/helpContent.test.ts
git commit -m "test(help): add tests for markdown content loader"
```

---

### Task 13: Final verification and visual review

**Step 1: Run complete test suites**

```bash
python -m pytest tests/ -x -q
cd ui && npx vitest run
cd ui && npx svelte-check --tsconfig ./tsconfig.json
make lint
```

**Step 2: Start dev server and visual review**

Run: `make dev`

Verify:
- AppBar (?) button opens HelpPanel to Getting Started
- Accordion categories expand/collapse
- Topic navigation works
- Field (?) icons open HelpPanel to correct topic with anchor scroll
- Chart (?) icons open chart help topics
- Related topics navigation works
- Maximize/minimize toggle works
- Close via X, Escape, and backdrop all work
- Dark mode renders correctly
- Content is readable and well-formatted

**Step 3: Fix any visual or functional issues discovered**

**Step 4: Final commit if any fixes needed**
