## Context

The SvelteKit UI was built with hand-rolled CSS in scoped `<style>` blocks. It works but looks plain — no color palette, no design tokens, no dark mode. Every component has its own bespoke styling for buttons, inputs, tables, and layout. Skeleton v4 is a Tailwind-based UI toolkit with Svelte-specific components and a theme system.

## Goals / Non-Goals

**Goals:**
- Professional, consistent visual appearance across all views
- Light/dark mode toggle that persists user preference
- Replace hand-rolled components with Skeleton equivalents where they exist
- Establish a design token foundation (colors, spacing, typography) via Skeleton theme

**Non-Goals:**
- Custom theme design — use a Skeleton built-in theme
- Responsive/mobile layout overhaul
- Changing any functional behavior or API interactions
- Adding new UI features beyond theming

## Decisions

### Skeleton v4 + Tailwind v4
**Choice**: Skeleton v4 with Tailwind v4 for the design system.

**Rationale**: Skeleton v4 is built on Tailwind v4, provides Svelte-native components (Tabs, Accordion), and includes 20+ themes with dark mode support. It's the maintained, Svelte 5-compatible version.

### Theme: Cerberus
**Choice**: Use the `cerberus` theme as the default.

**Rationale**: It's Skeleton's default theme with a neutral professional palette that suits a financial tool. Can be swapped later by changing one `data-theme` attribute.

### Migration approach: component-by-component
**Choice**: Migrate each component file individually, replacing `<style>` blocks with Tailwind utility classes and Skeleton components.

**Alternatives considered**:
- Incremental (keep some hand-rolled CSS): Creates inconsistency between old and new styling
- Big bang rewrite: Riskier but since the component count is small (~15 files), a full pass is manageable

**Rationale**: With only ~15 component files, a complete migration in one change avoids visual inconsistency. Each component is self-contained so migration is straightforward.

### Dark mode via Skeleton's mode system
**Choice**: Use Skeleton's built-in mode watcher and a toggle component in the header.

**Rationale**: Skeleton handles `prefers-color-scheme` detection and persists preference to localStorage. No custom implementation needed.

## Component Migration Map

```
Hand-rolled                      → Skeleton/Tailwind
─────────────────────────────────────────────────────
TabNav.svelte                    → Skeleton Tabs / Tab component
CollapsibleSection.svelte        → Skeleton Accordion / AccordionItem
<button> + custom CSS            → <button class="btn preset-filled">
<input> / <select> + custom CSS  → Skeleton form input classes
<table> + custom CSS             → Skeleton table classes
Summary stat cards               → Tailwind card/surface classes
Error messages                   → Skeleton Alert or styled div
File controls buttons            → btn preset-tonal classes
```

## File Changes

- `app.html` — add `data-theme="cerberus"`
- `app.css` (new) — Tailwind + Skeleton imports
- `+layout.svelte` — import app.css
- `+page.svelte` — add dark mode toggle to header
- `TabNav.svelte` — rewrite with Skeleton Tabs
- `CollapsibleSection.svelte` — rewrite with Skeleton Accordion
- All portfolio editor components — replace `<style>` with Tailwind classes
- `SimulateView.svelte` — replace `<style>` with Tailwind classes
- `MonteCarloView.svelte` — replace `<style>` with Tailwind classes
- `CompareView.svelte` — replace `<style>` with Tailwind classes
- `FileControls.svelte` — replace `<style>` with Tailwind classes
- `FieldError.svelte` — replace `<style>` with Tailwind classes
- Chart components — minimal changes (Chart.js renders to canvas)

## Risks / Trade-offs

- **Tailwind learning curve** → Mitigated by Skeleton providing high-level preset classes; raw Tailwind utilities only needed for layout
- **Skeleton v4 is relatively new** → It's the current stable release with active maintenance
- **Bundle size increase** → Tailwind tree-shakes aggressively; Skeleton adds minimal JS for interactive components
- **Chart.js theming** → Chart colors are set in JS, not CSS. Charts won't auto-adapt to dark mode without explicit color configuration. Can address as a follow-up.
