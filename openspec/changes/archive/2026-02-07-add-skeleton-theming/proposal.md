## Why

The SvelteKit UI uses hand-rolled CSS with no design system, resulting in a bland appearance with no dark mode support. Adding a component library and theming now — before the UI grows — avoids a larger migration later.

## What Changes

- Add Tailwind v4 and Skeleton v4 (`@skeletonlabs/skeleton`, `@skeletonlabs/skeleton-svelte`) as dependencies
- Replace hand-rolled TabNav with Skeleton Tab components
- Replace hand-rolled CollapsibleSection with Skeleton Accordion components
- Replace hand-styled buttons, inputs, selects, and tables with Skeleton preset classes and form styling
- Add a theme (cerberus or similar) with design tokens for colors, typography, and spacing
- Add a light/dark mode toggle in the app header
- Remove all hand-written `<style>` blocks that are replaced by Skeleton/Tailwind equivalents

## Capabilities

### New Capabilities
- `ui-theming`: Theme configuration, light/dark mode toggle, Skeleton/Tailwind integration

### Modified Capabilities
- `ui-shell`: Tab navigation replaced with Skeleton Tab component, dark mode toggle added to header layout
- `portfolio-editor`: Collapsible sections replaced with Skeleton Accordion, form inputs and buttons restyled with Skeleton/Tailwind classes
- `simulation-view`: Buttons, summary panels, and detail table restyled with Skeleton/Tailwind classes
- `monte-carlo-view`: Buttons, stats panels, and success rate display restyled with Skeleton/Tailwind classes
- `compare-view`: Strategy checkboxes, buttons, and comparison table restyled with Skeleton/Tailwind classes

## Impact

- **New dependencies**: `tailwindcss`, `@skeletonlabs/skeleton`, `@skeletonlabs/skeleton-svelte`
- **Every `.svelte` component file** in `ui/src/lib/components/` will be modified (style blocks replaced)
- **`ui/src/app.html`**: `data-theme` attribute added
- **`ui/src/app.css`** (or layout CSS): Skeleton and Tailwind imports added
- **No backend changes**
- **No API changes**
- **No functional behavior changes** — this is purely visual
