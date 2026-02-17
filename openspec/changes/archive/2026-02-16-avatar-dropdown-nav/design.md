## Context

The avatar dropdown currently shows avatar + name, a divider, and a single "Settings" link. The settings page has a left-nav with three sections (Basic Info, Load/Save, Advanced Settings) plus dark mode toggle and Done button. Users must navigate to settings, then pick a section — two clicks.

## Goals / Non-Goals

**Goals:**
- One-click access to any settings section from the dropdown
- Dark mode and auto-save toggles directly in the dropdown (no navigation needed)
- Avatar dropdown works on all pages including `/settings`

**Non-Goals:**
- Changing the settings page layout itself
- Moving any settings content out of the settings page

## Decisions

### 1. Section deep-link via query param
Pass the target section as `?section=basic|loadsave|advanced` in the URL. The settings page reads this on mount and sets `activeSection`. This avoids a shared store and works with browser back/forward.

### 2. Shared dark mode module
Extract dark mode state and toggle into `$lib/darkMode.ts` exporting a reactive `dark` state and `toggleDarkMode()` function. Both the dropdown and settings page import from the same module, keeping state in sync.

### 3. Shared auto-save module
Extract auto-save state and toggle into `$lib/autoSave.ts` exporting reactive `autoSave` state and `toggleAutoSave()`. The settings page Load/Save panel reads from this same state, removing duplication.

### 4. Avatar dropdown works everywhere
Remove the `onSettingsPage` guard in AppBar. The dropdown is useful on the settings page too — the section links navigate with `?section=` which re-selects the section.

### 5. Dropdown layout
Avatar + name at top, divider, three section links with icons (matching settings left-nav), divider, dark mode checkbox, auto-save checkbox. The section links use `<a href="/settings?section=...">` for navigation.

## Risks / Trade-offs

- Adding query param reading adds a small amount of complexity to the settings page, but keeps things stateless and URL-bookmarkable.
- Two shared modules is slightly more files, but eliminates duplicated dark mode / auto-save logic between dropdown and settings page.
