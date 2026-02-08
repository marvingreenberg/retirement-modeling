## Context

The app currently renders everything on a single page (`+page.svelte`) with `TabNav` switching between Portfolio, Simulate, and Compare views via `{#if}` blocks. The header is a plain `<h1>` plus `DarkModeToggle`. The theme is Skeleton v4's `seafoam`.

The goal is to replace this with a proper app shell: Skeleton `AppBar` with navigation links, avatar, dark mode toggle, and SvelteKit route-based pages. This creates the structural foundation for subsequent changes (landing page redesign, config drawer, spending page).

## Goals / Non-Goals

**Goals:**
- Professional app shell using Skeleton v4's `AppBar` and `Avatar` components
- Route-based navigation replacing tab switching (SvelteKit `+page.svelte` per route)
- Pine theme for a financial-tool aesthetic
- Maintain all existing functionality — just restructured into routes

**Non-Goals:**
- Authentication or user identity (avatar is visual placeholder only)
- Redesigning page content (Portfolio, Simulate, Compare content stays as-is)
- Configuration drawer or settings page (future `ux-config-spending` change)
- Mobile-responsive hamburger menu (can be added later)

## Decisions

### Route structure

Routes map to current tabs plus a future details route:

| Route | Content | Current equivalent |
|-------|---------|-------------------|
| `/` | Portfolio editor + Simulate (landing page) | Portfolio + Simulate tabs |
| `/spending` | Spending strategies | Part of PortfolioEditor |
| `/compare` | Snapshot comparison | Compare tab |
| `/details` | Detailed results breakdown | (placeholder) |

**Rationale**: The current three-tab structure maps naturally to routes. Simulate becomes part of the landing page (not its own route) since running a simulation and viewing results is the primary action. Spending gets its own route because it's complex enough to warrant a dedicated page.

**Alternative considered**: Keep tabs within a single route — rejected because route-based nav is standard for apps of this complexity and enables future deep-linking.

### AppBar layout

```
┌────────────────────────────────────────────────────────┐
│  [Pine icon]  Retirement Simulator    Home  Spending  Compare  Details    [☀/🌙] [Avatar] │
│   lead                                   center/nav                       trail            │
└────────────────────────────────────────────────────────┘
```

Use Skeleton's `AppBar` with:
- `lead`: App icon/title
- Center: Navigation links as plain `<a>` elements with Skeleton `btn` preset classes (`preset-filled` for active, `preset-ghost` for inactive) and `aria-current="page"` for accessibility
- `trail`: Dark mode toggle + Avatar button

**Rationale**: Plain links with Skeleton btn presets are simpler than Skeleton's `Navigation` component and provide equivalent theming. Navigation's main advantage is `layout` variants (rail/sidebar) for responsive layouts, which is a non-goal for this change.

### Component structure

- `AppBar.svelte` — new, contains the full app bar with nav and avatar
- `AvatarButton.svelte` — new, placeholder avatar using Skeleton Avatar with Lucide User fallback (future: profile/settings)
- `DarkModeToggle.svelte` — keep existing, move into AppBar trail slot
- `TabNav.svelte` — remove (replaced by route-based navigation in AppBar)

### Layout approach

`+layout.svelte` becomes the shell: AppBar on top, `{@render children()}` below in a content wrapper. Each route's `+page.svelte` renders its specific content.

### Theme change

Switch from `seafoam` to `pine` in both `app.html` (`data-theme="pine"`) and `app.css` (import path). No custom theme overrides needed initially.

## Risks / Trade-offs

- **State management across routes**: Portfolio state is currently in Svelte stores, which persist across tab switches. Route navigation will unmount/remount components. → Mitigation: Stores already handle this — `$state` in module-level stores persists across route changes. Verify during testing.
- **Bookmark/refresh behavior**: Users can now land directly on `/compare` without having run a simulation. → Mitigation: Each page should handle the "no data yet" state gracefully (already true for Compare, which shows empty state).
- **Test updates**: TabNav tests become invalid; AppBar navigation tests needed. → Mitigation: Part of the task list.
