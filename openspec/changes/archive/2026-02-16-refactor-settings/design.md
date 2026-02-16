## Context

Settings are currently spread across ProfileDrawer (names, ages, timeline, taxes, dark mode) and FileControls in PortfolioEditor (load/save). First-use is a separate SetupView modal. The avatar uses plain initials.

## Goals / Non-Goals

**Goals:**
- Dedicated `/settings` route with left-nav + content panel layout
- Generated avatar (DiceBear) replacing initials
- Avatar dropdown in AppBar linking to settings (replacing drawer)
- First-use redirects to settings instead of modal
- Consolidated load/save with localStorage auto-save option
- Enter key triggers validation on inputs

**Non-Goals:**
- Saving to filesystem (`~/Library/...`) — browsers can't do this; use download + localStorage
- Multi-user auth or cloud storage
- Changing simulation/results behavior

## Decisions

### 1. Settings route structure
New SvelteKit route at `/settings` with a layout component:
- **Left nav**: Vertical list of section links (Basic Info, Load/Save, Advanced Settings)
- **Content panel**: Renders the selected section's form fields
- **Header**: Avatar image + name(s) at top of left nav
- **Footer**: Dark mode toggle + [Done] button → navigates to `/`
- State management: Use a `$state` variable for active section (no nested routes needed)

### 2. Avatar generation
Use DiceBear HTTP API: `https://api.dicebear.com/9.x/thumbs/svg?seed={name}`.
- Seed derived from `profile.primaryName` (or "user" if empty)
- Avatar URL stored as `$derived` in AvatarButton, not persisted
- Same `<img>` tag used in AppBar button and settings page header
- Fallback: If image fails to load, show a default lucide User icon (current behavior)

### 3. Avatar dropdown (replaces ProfileDrawer)
When clicking avatar in AppBar:
- Show a small dropdown (not a full drawer) anchored to the avatar
- Contains: avatar image, name(s) below, divider, "Settings" link → `/settings`
- Click outside closes dropdown
- On `/settings` route, avatar click does nothing (already there)

### 4. First-use flow
- Remove SetupView.svelte entirely
- When `current_age_primary === 0`, redirect to `/settings` with Basic Info panel active
- Basic Info panel shows a context banner: "Enter your info to get started, or use Load/Save to load saved data."
- Completing Basic Info (name + age + Get Started) updates stores and navigates to `/`
- "Load Sample Data" button also available in the Basic Info panel header

### 5. Settings panels

**Basic Info panel:**
- Your Name, Your Age (required)
- Spouse toggle → Spouse Name, Spouse Age
- Simulation Years, Start Year
- [Get Started] button (only shown when needs setup, i.e., age is 0)
- [Load Sample Data] button (always visible)

**Load/Save panel:**
- Load Portfolio (file picker, JSON)
- Save Portfolio (download JSON — includes profile + portfolio)
- Auto-save toggle (localStorage)
- When auto-save enabled, state persists to localStorage on changes

**Advanced Settings panel:**
- State Tax %, Capital Gains %, RMD Age, IRMAA Limit
- MC Iterations

### 6. Auto-save via localStorage
- New store: `autoSave = writable<boolean>(false)`, persisted to localStorage
- When enabled, an `$effect` watches portfolio + profile stores and writes to localStorage
- On app load, if auto-save data exists in localStorage, load it
- Key: `retirement-sim-state`

### 7. Enter key on inputs
Add a `onkeydown` handler to the settings page container that calls `markFormTouched()` and triggers portfolio update on Enter key. This reuses the existing `handleFocusOut` pattern.

## Component Structure

```
ui/src/routes/settings/
  +page.svelte           — Settings page with left-nav layout
ui/src/lib/components/
  AvatarButton.svelte    — Updated: DiceBear image instead of initials
  AvatarDropdown.svelte  — New: dropdown menu from avatar click
  (ProfileDrawer.svelte) — DELETED
  (SetupView.svelte)     — DELETED
```

## Risks / Trade-offs

- **DiceBear API dependency**: External HTTP call for avatar. Mitigated by graceful fallback to lucide User icon if API unavailable. Could switch to npm package later if needed.
- **localStorage limits**: ~5MB per origin. Portfolio JSON is typically <50KB, well within limits.
- **First-use redirect**: Uses `goto('/settings')` which requires client-side navigation. Works fine in SvelteKit.
