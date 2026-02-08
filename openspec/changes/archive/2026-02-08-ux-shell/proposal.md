## Why

The current UI is a single-page app with a flat header ("Retirement Simulator" + dark mode toggle) and tab-based navigation. This looks like a developer prototype rather than a polished financial tool. Adopting an AppBar with avatar/profile, route-based navigation, and a Pine theme (Skeleton v4 built-in) gives the app a professional shell that future features (landing page, config drawer, spending page) can plug into.

## What Changes

- Replace the flat header with a Skeleton `AppBar` containing the app title, navigation links, dark mode toggle, and an avatar/profile button
- Switch from in-page tab switching (`TabNav` + `{#if}` blocks) to SvelteKit route-based navigation (`/`, `/spending`, `/compare`, `/details`)
- Change the Skeleton theme from `seafoam` to `pine` for a financial-app aesthetic
- Move the current `+page.svelte` content into route-specific pages
- Add a placeholder avatar component (no auth — just visual identity)
- **BREAKING**: URL structure changes from single-page to multi-route (no external consumers, internal only)

## Capabilities

### New Capabilities
- `app-shell-layout`: AppBar with navigation, avatar, and route-based page layout

### Modified Capabilities
- `ui-shell`: Replaces tab navigation with route-based navigation and AppBar
- `ui-theming`: Changes theme from seafoam to pine

## Impact

- **Routes**: New route files for `/spending`, `/compare`, `/details`; existing `+page.svelte` becomes the landing/simulate page
- **Components**: `TabNav.svelte` removed; new `AppBar.svelte` and `Avatar.svelte` components added
- **Layout**: `+layout.svelte` gains the AppBar and page wrapper
- **Theme**: `app.css` and `app.html` updated for pine theme
- **Tests**: `TabNav` component tests removed; new AppBar/navigation tests added
- **Dependencies**: No new npm packages (Skeleton v4 already has AppBar, Avatar, Navigation)
