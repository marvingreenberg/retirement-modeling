# Help Search Design

## Goal

Add full-text search to the help panel. A search box next to the "Help" title lets users find terms across all help topics, with stemming, term highlighting, and navigation to the matching paragraph.

## Search Semantics

- **Case-insensitive**, stemmed via Porter stemmer (lunr.js built-in)
- **Multi-word queries use AND**: "update balance" matches content containing stem("update") AND stem("balance") — words need not be adjacent
- **Submit on Enter or click icon** — not dynamic/live search
- Clear button on input restores normal accordion nav

## Library

**lunr.js** (~8KB gzipped). Established, built-in Porter stemmer, supports position metadata for highlighting. The corpus is ~15 small markdown files — index builds instantly on module load.

## Index Structure

Each help topic's markdown is split into sections by heading (`##` / `###`). Each section becomes an index entry keyed by `topicId:headingId`, containing the plain text (markdown stripped). This enables paragraph-level navigation via existing heading anchors.

## UI Behavior

### Header
```
BookOpen Help                    [search...] 🔍  ⬜ ✕
```
Search input right-justified, submit via Enter or 🔍 click. Small ✕ inside input to clear.

### Nav Area (search active)
Replaces accordion with scrollable results list (same max-height, overflow-y-auto):
```
3 results for "balance"
  Getting Started > Quick Start
  Balance Chart > Reading the Chart
  Spending Strategies > Guardrails
```
Each result is clickable — navigates to topic and scrolls to heading anchor.

### Search stays populated
After clicking a result, the search bar and results list remain visible so the user can navigate through multiple matches.

### Highlighting
Matched terms are wrapped in `<mark>` tags in rendered HTML. Highlights persist even when browsing to related topics (as long as a search query is active). Cleared when search is cleared.

## Files

### New
- `ui/src/lib/helpSearch.ts` — builds lunr index from help markdown, exposes `searchHelp(query)` and `highlightTerms(html, query)`. Strips markdown to plain text for indexing. Returns `{topicId, headingId, topicName, sectionTitle}[]`.
- `ui/src/lib/helpSearch.test.ts` — tests: index building, stemming, AND semantics, highlighting, section splitting, edge cases (no results, empty query).

### Modified
- `ui/src/lib/components/HelpPanel.svelte` — search input in header, conditional nav vs results display, highlight injection on `topicHtml`.
- `ui/src/lib/components/HelpPanel.test.ts` — tests for search UI interaction.
- `ui/package.json` — add `lunr` dependency.

### Unchanged
- `helpContent.ts`, `helpMarkdown.ts`, `helpTopics.ts`, `helpState.svelte.ts` — no changes needed. Search module imports from these directly.
