## Why

Three UX issues with the current settings panel and AppBar:

1. **Strategy and Advanced sections are flat** — Strategy controls sit exposed between the primary row and Advanced toggle. When the user isn't actively changing their withdrawal approach, these take up screen real estate. Similarly, the Advanced section shows no indication of its current state when collapsed. Both should be independently collapsible with summary text showing current values.

2. **Avatar button is non-functional** — The person icon in the AppBar does nothing. It should show user initials (e.g., "M,K" for a couple, "M" for single) and open a profile drawer containing people/timeline settings (names, ages, simulation years) and other rarely-changed configuration.

3. **Dark mode toggle clutters the AppBar** — The dark/light mode toggle takes prominent AppBar space for something rarely changed. It belongs in the profile drawer.

## What Changes

### Collapsible strategy and advanced sections
- Withdrawal Strategy becomes a collapsible section with summary when collapsed (e.g., "Withdrawal Strategy — Fixed $140K")
- Advanced becomes a collapsible section with summary when collapsed (e.g., "Advanced — defaults" or "Advanced — custom brackets")
- Both start collapsed by default, expand on click
- Strategy dropdown and conditional params appear on the same row when expanded (two rows for guardrails)

### Profile drawer via avatar
- Avatar shows user initials in a circle (derived from name fields)
- Clicking avatar opens a slide-out drawer with: names, ages, simulation years, dark/light toggle
- SetupView captures names (first name for primary, optional spouse first name)
- Dark mode toggle removed from AppBar, lives only in the profile drawer

## Capabilities

### Modified Capabilities
- `simulate-tab-layout`: Strategy and Advanced sections independently collapsible with summary text
- `app-bar`: Avatar shows initials, opens profile drawer; dark mode toggle removed from bar

### New Capabilities
- `profile-drawer`: Slide-out drawer for people/timeline settings and preferences

## Impact

- `ui/src/lib/components/SimulateSettings.svelte` — Collapsible strategy/advanced subsections with summaries
- `ui/src/lib/components/AvatarButton.svelte` — Show initials, toggle profile drawer
- `ui/src/lib/components/ProfileDrawer.svelte` — New component: name, age, simulation years, dark mode
- `ui/src/lib/components/AppBar.svelte` — Remove DarkModeToggle, wire up drawer
- `ui/src/lib/components/DarkModeToggle.svelte` — Move into ProfileDrawer (or inline)
- `ui/src/lib/components/SetupView.svelte` — Add name fields to initial setup
- `ui/src/lib/stores.ts` — Add name fields to portfolio config or separate profile store
- `ui/src/lib/types.ts` — Add name fields
- Tests updated to match
