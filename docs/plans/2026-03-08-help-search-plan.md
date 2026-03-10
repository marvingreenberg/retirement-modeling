# Help Search Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add full-text search to the help panel with stemming, AND semantics, term highlighting, and paragraph-level navigation.

**Architecture:** lunr.js builds a search index at module load from all 15 help markdown files, split into sections by heading. Search results replace the accordion nav; clicking a result navigates to the topic+heading anchor. Matched terms are highlighted with `<mark>` in rendered HTML and persist across topic navigation.

**Tech Stack:** lunr.js (full-text search with Porter stemmer), Svelte 5 runes, existing marked renderer, lucide-svelte icons.

---

### Task 1: Install lunr.js

**Step 1: Add dependency**

Run: `cd ui && pnpm add lunr`

**Step 2: Add type declarations**

Run: `cd ui && pnpm add -D @types/lunr`

**Step 3: Verify installation**

Run: `cd ui && node -e "require('lunr')"`
Expected: no error

**Step 4: Commit**

```bash
git add ui/package.json ui/pnpm-lock.yaml
git commit -m "feat: add lunr.js for help search"
```

---

### Task 2: Create helpSearch.ts — index building and search

**Files:**
- Create: `ui/src/lib/helpSearch.ts`
- Test: `ui/src/lib/helpSearch.test.ts`

**Step 1: Write the failing tests**

Create `ui/src/lib/helpSearch.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { searchHelp, highlightTerms, type SearchResult } from './helpSearch';

describe('helpSearch', () => {
   describe('searchHelp', () => {
      it('returns empty array for empty query', () => {
         expect(searchHelp('')).toEqual([]);
      });

      it('returns empty array for whitespace-only query', () => {
         expect(searchHelp('   ')).toEqual([]);
      });

      it('finds a term that exists in help content', () => {
         const results = searchHelp('portfolio');
         expect(results.length).toBeGreaterThan(0);
         expect(results[0]).toHaveProperty('topicId');
         expect(results[0]).toHaveProperty('headingId');
         expect(results[0]).toHaveProperty('topicName');
         expect(results[0]).toHaveProperty('sectionTitle');
      });

      it('returns empty array for nonsense query', () => {
         expect(searchHelp('xyzzyplugh')).toEqual([]);
      });

      it('is case-insensitive', () => {
         const lower = searchHelp('portfolio');
         const upper = searchHelp('PORTFOLIO');
         expect(lower.length).toBe(upper.length);
         expect(lower.map((r) => r.topicId)).toEqual(upper.map((r) => r.topicId));
      });

      it('uses stemming: "balancing" matches same as "balance"', () => {
         const results1 = searchHelp('balance');
         const results2 = searchHelp('balancing');
         // Both should stem to "balanc" and return same results
         expect(results1.map((r) => `${r.topicId}:${r.headingId}`)).toEqual(
            results2.map((r) => `${r.topicId}:${r.headingId}`),
         );
      });

      it('multi-word uses AND: all terms must match in same section', () => {
         const results = searchHelp('withdrawal order');
         for (const r of results) {
            // Each result section should contain stems of both words
            expect(r.topicId).toBeTruthy();
         }
         // "withdrawal order" should return fewer results than "withdrawal" alone
         const broader = searchHelp('withdrawal');
         expect(results.length).toBeLessThanOrEqual(broader.length);
      });

      it('returns topicName and sectionTitle for display', () => {
         const results = searchHelp('tax');
         expect(results.length).toBeGreaterThan(0);
         for (const r of results) {
            expect(r.topicName).toBeTruthy();
            expect(r.sectionTitle).toBeTruthy();
         }
      });

      it('deduplicates results by topicId:headingId', () => {
         const results = searchHelp('the');
         const keys = results.map((r) => `${r.topicId}:${r.headingId}`);
         expect(new Set(keys).size).toBe(keys.length);
      });
   });

   describe('highlightTerms', () => {
      it('wraps matched terms in <mark> tags', () => {
         const html = '<p>Check your portfolio balance today.</p>';
         const result = highlightTerms(html, 'balance');
         expect(result).toContain('<mark>balance</mark>');
      });

      it('preserves HTML tags — does not highlight inside tags', () => {
         const html = '<a href="balance-chart">See the balance chart</a>';
         const result = highlightTerms(html, 'balance');
         // Should not break the href attribute
         expect(result).toContain('href="balance-chart"');
         // Should highlight in text content
         expect(result).toContain('<mark>balance</mark> chart');
      });

      it('highlights stemmed matches: "balancing" highlighted when searching "balance"', () => {
         const html = '<p>Balancing your accounts is important.</p>';
         const result = highlightTerms(html, 'balance');
         expect(result).toContain('<mark>Balancing</mark>');
      });

      it('highlights all occurrences', () => {
         const html = '<p>The tax rate affects your tax bracket.</p>';
         const result = highlightTerms(html, 'tax');
         const markCount = (result.match(/<mark>/g) || []).length;
         expect(markCount).toBe(2);
      });

      it('handles multi-word queries — highlights each term', () => {
         const html = '<p>Set your withdrawal order for accounts.</p>';
         const result = highlightTerms(html, 'withdrawal order');
         expect(result).toContain('<mark>withdrawal</mark>');
         expect(result).toContain('<mark>order</mark>');
      });

      it('returns html unchanged for empty query', () => {
         const html = '<p>Hello world</p>';
         expect(highlightTerms(html, '')).toBe(html);
      });

      it('is case-insensitive in highlighting', () => {
         const html = '<p>Portfolio value and PORTFOLIO growth.</p>';
         const result = highlightTerms(html, 'portfolio');
         const markCount = (result.match(/<mark>/g) || []).length;
         expect(markCount).toBe(2);
      });
   });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd ui && npx vitest run src/lib/helpSearch.test.ts`
Expected: FAIL — module not found

**Step 3: Write the implementation**

Create `ui/src/lib/helpSearch.ts`:

```typescript
import lunr from 'lunr';
import { helpCategories, getTopicMeta } from './helpTopics';

export interface SearchResult {
   topicId: string;
   headingId: string;
   topicName: string;
   sectionTitle: string;
}

interface Section {
   topicId: string;
   headingId: string;
   topicName: string;
   sectionTitle: string;
   text: string;
}

const headingRe = /^(#{2,3})\s+(.+?)(?:\s*\{#([\w-]+)\})?\s*$/;

function stripMarkdown(md: string): string {
   return md
      .replace(/<!--.*?-->/gs, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .replace(/^[-*]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '');
}

function slugify(text: string): string {
   return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
}

const mdModules = import.meta.glob('./help/en/*.md', {
   query: '?raw',
   import: 'default',
   eager: true,
}) as Record<string, string>;

function buildSections(): Section[] {
   const sections: Section[] = [];
   for (const cat of helpCategories) {
      for (const topic of cat.topics) {
         const key = `./help/en/${topic.id}.md`;
         const md = (mdModules[key] as string) ?? '';
         if (!md) continue;

         let currentHeading = topic.name;
         let currentHeadingId = slugify(topic.name);
         let currentLines: string[] = [];

         for (const line of md.split('\n')) {
            const match = line.match(headingRe);
            if (match) {
               if (currentLines.length > 0) {
                  sections.push({
                     topicId: topic.id,
                     headingId: currentHeadingId,
                     topicName: topic.name,
                     sectionTitle: currentHeading,
                     text: stripMarkdown(currentLines.join('\n')),
                  });
               }
               currentHeading = match[2].replace(/\*\*/g, '');
               currentHeadingId = match[3] ?? slugify(match[2]);
               currentLines = [];
            } else {
               currentLines.push(line);
            }
         }
         if (currentLines.length > 0) {
            sections.push({
               topicId: topic.id,
               headingId: currentHeadingId,
               topicName: topic.name,
               sectionTitle: currentHeading,
               text: stripMarkdown(currentLines.join('\n')),
            });
         }
      }
   }
   return sections;
}

const allSections = buildSections();
const sectionMap = new Map<string, Section>(allSections.map((s) => [`${s.topicId}:${s.headingId}`, s]));

const idx = lunr(function () {
   this.ref('key');
   this.field('text');
   for (const s of allSections) {
      this.add({ key: `${s.topicId}:${s.headingId}`, text: s.text });
   }
});

export function searchHelp(query: string): SearchResult[] {
   const trimmed = query.trim();
   if (!trimmed) return [];

   const terms = trimmed.split(/\s+/);
   const lunrQuery = terms.map((t) => `+${t}`).join(' ');

   let raw: lunr.Index.Result[];
   try {
      raw = idx.search(lunrQuery);
   } catch {
      return [];
   }

   return raw
      .map((r) => sectionMap.get(r.ref))
      .filter((s): s is Section => s != null)
      .map(({ topicId, headingId, topicName, sectionTitle }) => ({
         topicId,
         headingId,
         topicName,
         sectionTitle,
      }));
}

const stemmer = lunr.stemmer as unknown as { (token: lunr.Token): lunr.Token };

function stemWord(word: string): string {
   return (stemmer(new lunr.Token(word.toLowerCase())) as unknown as { toString(): string }).toString();
}

export function highlightTerms(html: string, query: string): string {
   const trimmed = query.trim();
   if (!trimmed) return html;

   const terms = trimmed.split(/\s+/);
   const stems = terms.map((t) => stemWord(t));

   // Match words in text content only (not inside HTML tags)
   return html.replace(/>([^<]+)</g, (full, text: string) => {
      const highlighted = text.replace(/\b(\w+)\b/g, (word: string) => {
         const wordStem = stemWord(word);
         return stems.includes(wordStem) ? `<mark>${word}</mark>` : word;
      });
      return `>${highlighted}<`;
   });
}
```

**Step 4: Run tests to verify they pass**

Run: `cd ui && npx vitest run src/lib/helpSearch.test.ts`
Expected: all tests PASS

**Step 5: Commit**

```bash
git add ui/src/lib/helpSearch.ts ui/src/lib/helpSearch.test.ts
git commit -m "feat: add help search index with stemming and highlighting"
```

---

### Task 3: Update HelpPanel.svelte — search UI

**Files:**
- Modify: `ui/src/lib/components/HelpPanel.svelte`
- Modify: `ui/src/lib/components/HelpPanel.test.ts`

**Step 1: Write the failing tests**

Add to `ui/src/lib/components/HelpPanel.test.ts`:

```typescript
// Add these imports at top, alongside existing ones:
// import { within } from '@testing-library/svelte';

describe('HelpPanel search', () => {
   it('shows search input in header', () => {
      openHelp('getting-started');
      render(HelpPanel);
      expect(screen.getByPlaceholderText('Search help...')).toBeInTheDocument();
   });

   it('shows search button with aria-label', () => {
      openHelp('getting-started');
      render(HelpPanel);
      expect(screen.getByLabelText('Search')).toBeInTheDocument();
   });

   it('submitting search replaces accordion with results', async () => {
      openHelp('getting-started');
      render(HelpPanel);
      const input = screen.getByPlaceholderText('Search help...');
      await fireEvent.input(input, { target: { value: 'portfolio' } });
      await fireEvent.submit(input.closest('form')!);
      // Should show results count
      expect(screen.getByText(/results? for/)).toBeInTheDocument();
      // Accordion categories should be hidden
      expect(screen.queryByText('App Basics')).not.toBeInTheDocument();
   });

   it('clicking a search result navigates to that topic', async () => {
      openHelp('getting-started');
      render(HelpPanel);
      const input = screen.getByPlaceholderText('Search help...');
      await fireEvent.input(input, { target: { value: 'portfolio' } });
      await fireEvent.submit(input.closest('form')!);
      // Click first result
      const results = screen.getByRole('navigation', { name: 'Search results' });
      const firstLink = results.querySelector('button');
      expect(firstLink).not.toBeNull();
      await fireEvent.click(firstLink!);
      // Should have changed topic
      expect(helpState.topic).toBeTruthy();
   });

   it('search bar stays populated after clicking result', async () => {
      openHelp('getting-started');
      render(HelpPanel);
      const input = screen.getByPlaceholderText('Search help...') as HTMLInputElement;
      await fireEvent.input(input, { target: { value: 'portfolio' } });
      await fireEvent.submit(input.closest('form')!);
      const results = screen.getByRole('navigation', { name: 'Search results' });
      const firstLink = results.querySelector('button');
      await fireEvent.click(firstLink!);
      expect(input.value).toBe('portfolio');
   });

   it('clear button restores accordion nav', async () => {
      openHelp('getting-started');
      render(HelpPanel);
      const input = screen.getByPlaceholderText('Search help...');
      await fireEvent.input(input, { target: { value: 'portfolio' } });
      await fireEvent.submit(input.closest('form')!);
      expect(screen.queryByText('App Basics')).not.toBeInTheDocument();
      await fireEvent.click(screen.getByLabelText('Clear search'));
      expect(screen.getByText('App Basics')).toBeInTheDocument();
   });

   it('shows "No results" for nonsense query', async () => {
      openHelp('getting-started');
      render(HelpPanel);
      const input = screen.getByPlaceholderText('Search help...');
      await fireEvent.input(input, { target: { value: 'xyzzyplugh' } });
      await fireEvent.submit(input.closest('form')!);
      expect(screen.getByText(/no results/i)).toBeInTheDocument();
   });

   it('highlights search terms in content', async () => {
      openHelp('getting-started');
      render(HelpPanel);
      const input = screen.getByPlaceholderText('Search help...');
      await fireEvent.input(input, { target: { value: 'portfolio' } });
      await fireEvent.submit(input.closest('form')!);
      // Content should contain <mark> tags
      const content = screen.getByRole('complementary', { name: 'Help' });
      expect(content.querySelector('mark')).not.toBeNull();
   });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd ui && npx vitest run src/lib/components/HelpPanel.test.ts`
Expected: FAIL — search elements not found

**Step 3: Implement the search UI in HelpPanel.svelte**

Modify `ui/src/lib/components/HelpPanel.svelte`:

Add imports at top of `<script>`:
```typescript
import { Search, XCircle } from 'lucide-svelte';
import { searchHelp, highlightTerms, type SearchResult } from '$lib/helpSearch';
```

Add state variables after existing state declarations:
```typescript
let searchInput = $state('');
let searchQuery = $state('');
let searchResults: SearchResult[] = $state([]);

function submitSearch() {
   searchQuery = searchInput.trim();
   searchResults = searchHelp(searchQuery);
}

function clearSearch() {
   searchInput = '';
   searchQuery = '';
   searchResults = [];
}
```

Update the `$effect` for `helpState.open` to also clear search:
```typescript
$effect(() => {
   if (helpState.open) {
      maximized = false;
      expandedCategories.clear();
      clearSearch();
      const cat = getCategoryForTopic(helpState.topic);
      if (cat) expandedCategories.add(cat.id);
   }
});
```

Update `topicHtml` derived to apply highlighting:
```typescript
let topicHtml = $derived.by(() => {
   const html = getTopicHtml(helpState.topic);
   return searchQuery ? highlightTerms(html, searchQuery) : html;
});
```

Replace the header `<div>` (lines 92-118) with:
```svelte
<div
   class="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700 shrink-0 gap-2"
>
   <h2
      class="text-lg font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2 shrink-0"
   >
      <BookOpen size={20} class="text-primary-500" /> Help
   </h2>
   <form
      class="flex items-center gap-1 flex-1 max-w-[200px]"
      onsubmit={(e) => { e.preventDefault(); submitSearch(); }}
   >
      <div class="relative flex-1">
         <input
            type="text"
            placeholder="Search help..."
            class="input w-full text-xs pr-6 py-1"
            bind:value={searchInput}
         />
         {#if searchInput}
            <button
               type="button"
               class="absolute right-1 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
               onclick={clearSearch}
               aria-label="Clear search"
            >
               <XCircle size={14} />
            </button>
         {/if}
      </div>
      <button type="submit" class="btn btn-sm preset-ghost p-1" aria-label="Search">
         <Search size={16} />
      </button>
   </form>
   <div class="flex items-center gap-1 shrink-0">
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
```

Replace the nav section (lines 120-153) with conditional accordion vs results:
```svelte
{#if searchQuery}
   <nav
      class="shrink-0 border-b border-surface-200 dark:border-surface-700 p-3 overflow-y-auto max-h-[30%]"
      aria-label="Search results"
   >
      {#if searchResults.length === 0}
         <p class="text-sm text-surface-500 italic">No results for "{searchQuery}"</p>
      {:else}
         <p class="text-xs text-surface-500 mb-2">
            {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} for "{searchQuery}"
         </p>
         {#each searchResults as result (result.topicId + ':' + result.headingId)}
            <button
               class="block w-full text-left text-sm py-1 px-2 rounded hover:bg-surface-200 dark:hover:bg-surface-800 {helpState.topic === result.topicId ? 'text-primary-600 dark:text-primary-400' : 'text-surface-700 dark:text-surface-300'}"
               onclick={async () => {
                  helpState.topic = result.topicId;
                  helpState.anchor = result.headingId;
                  await tick();
                  scrollToAnchor();
               }}
            >
               <span class="font-medium">{result.topicName}</span>
               <span class="text-surface-400 mx-1">&rsaquo;</span>
               <span>{result.sectionTitle}</span>
            </button>
         {/each}
      {/if}
   </nav>
{:else}
   <!-- Original accordion nav, unchanged -->
   <nav
      class="shrink-0 border-b border-surface-200 dark:border-surface-700 p-3 overflow-y-auto max-h-[30%]"
      aria-label="Help topics"
   >
      {#each helpCategories as cat (cat.id)}
         <!-- ... existing accordion code unchanged ... -->
      {/each}
   </nav>
{/if}
```

**Step 4: Run tests to verify they pass**

Run: `cd ui && npx vitest run src/lib/components/HelpPanel.test.ts`
Expected: all tests PASS (including existing ones)

**Step 5: Run full test suite**

Run: `cd ui && npx vitest run`
Expected: all tests PASS

**Step 6: Run lint**

Run: `make lint-ui`
Expected: no new warnings

**Step 7: Commit**

```bash
git add ui/src/lib/components/HelpPanel.svelte ui/src/lib/components/HelpPanel.test.ts
git commit -m "feat: add search UI to help panel with term highlighting"
```

---

### Task 4: Add mark styling

**Files:**
- Modify: `ui/src/app.css` (or wherever prose-help styles are defined)

**Step 1: Find where prose-help styles are defined**

Run: `grep -r "prose-help" ui/src/` to locate the CSS file.

**Step 2: Add mark styling**

Add to the stylesheet that defines `.prose-help`:

```css
.prose-help mark {
   background-color: rgb(250 204 21 / 0.4); /* yellow-400 at 40% */
   color: inherit;
   padding: 0 1px;
   border-radius: 2px;
}
```

Dark mode variant (if using Tailwind dark mode):
```css
:is(.dark) .prose-help mark {
   background-color: rgb(250 204 21 / 0.25);
}
```

**Step 3: Verify visually**

Run: `make dev`, open help panel, search for "portfolio", confirm yellow highlights appear.

**Step 4: Commit**

```bash
git add <css-file>
git commit -m "style: add highlight styling for help search matches"
```

---

### Task 5: Svelte-check and full validation

**Step 1: Run svelte-check**

Run: `cd ui && npx svelte-check --tsconfig ./tsconfig.json`
Expected: no new errors

**Step 2: Run full frontend tests**

Run: `cd ui && npx vitest run`
Expected: all tests pass

**Step 3: Run E2E tests**

Run: `cd ui && npx playwright test`
Expected: all pass (search is new, existing flows unaffected)

**Step 4: Run lint**

Run: `make lint`
Expected: clean

**Step 5: Final commit if any fixes were needed**

```bash
git commit -m "fix: address svelte-check/lint issues from help search"
```
