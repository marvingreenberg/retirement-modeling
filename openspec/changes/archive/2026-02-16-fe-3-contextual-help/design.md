## Context

The app has `ApplicationDetails.md` at the project root with 5 detailed topics: Tax Bracket Inflation Indexing, Spending Strategies (4 sub-strategies), Social Security Benefit Formula, and Income Stream COLA. Currently, the UI has small InfoPopovers for quick tooltips on individual fields, but no way to access deeper explanations.

The profile drawer pattern already exists (right-side slide-out, opened via AppBar avatar button), providing a proven UI pattern to build on.

## Goals / Non-Goals

**Goals:**
- Surface ApplicationDetails.md content in the UI via a help drawer
- Contextual: opens to a relevant topic based on the current route
- Maximize toggle for full-width readability of longer content
- Internal navigation between topics within the drawer
- Static content stored in a TS module (no markdown parsing at runtime)

**Non-Goals:**
- Dynamic/user-editable help content
- Search within help
- Markdown rendering (content is pre-authored as Svelte markup)

## Decisions

**Decision: Store content as a TypeScript array of topic objects**
Each topic has an `id`, `title`, `content` (Svelte snippet or HTML string), and `relatedTopics` (ids for internal links). Content is hand-authored from ApplicationDetails.md with light HTML formatting.

Alternative: Import and parse markdown at build time via mdsvex. Rejected — adds a build dependency for 5 static topics, and internal link handling gets complicated.

**Decision: Use the same drawer pattern as ProfileDrawer**
A right-side slide-out panel with a close button. Add a maximize/minimize toggle button that switches between ~420px drawer width and full-viewport overlay.

Alternative: A `/help` route. Rejected as primary approach — breaks context. But maximize mode effectively becomes this, overlaying the full page.

**Decision: Route-to-topic mapping for contextual opening**
A map from route pathname to default topic id:
- `/` → `spending-strategies` (most relevant to simulation settings)
- `/spending` → `spending-strategies`
- `/compare` → `spending-strategies`
- `/details` → `tax-indexing`

The `?` button always opens help; the initial topic depends on the current route. Users can navigate to any topic from there.

**Decision: `?` button in AppBar trail, before avatar**
A `CircleHelp` icon button placed in the AppBar trail slot, before the profile avatar. Consistent with the existing avatar button pattern.

## Risks / Trade-offs

- [Screen real estate on mobile] → Maximize mode helps. On very small screens, the drawer already covers most of the viewport anyway.
- [Content maintenance] → Content lives in a TS file, not markdown. Small burden for 5 topics, would need rethinking if content grew significantly.
