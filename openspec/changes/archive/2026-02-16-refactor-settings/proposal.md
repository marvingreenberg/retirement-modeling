## Why

The current settings experience is fragmented: profile fields, advanced tax settings, and dark mode are crammed into a narrow slide-out drawer, while file load/save lives in the PortfolioEditor. The avatar uses plain initials. First-use setup is a separate modal dialog that blocks the entire page. This refactoring consolidates all settings into a dedicated route with clear navigation between sections, replaces initials with generated avatars, and unifies the first-use experience.

## What Changes

- **New `/settings` route** with left-nav + content panel layout (inspired by Netflix settings but using the app's existing Skeleton UI theme). Left nav items: Basic Info, Load/Save, Advanced Settings. A [Done] button returns to the main app.
- **Generated avatar** using DiceBear (client-side SVG generation from name seed). Same avatar shown in AppBar button and settings page header.
- **Redesigned avatar dropdown**: Clicking the avatar in AppBar opens a small dropdown menu with the avatar, name(s), and a link to Settings (like the Netflix screenshot). No longer a full drawer.
- **First-use change**: Instead of the SetupView modal, first-use navigates to `/settings` showing the Basic Info panel. A context message says "Enter your info to get started, or use Load to load saved data."
- **Load/Save in settings**: Move file controls into the Load/Save panel. Save all app state (portfolio + profile). Browser cannot write to filesystem directly, so save uses download and load uses file picker. Add localStorage auto-save option for convenience.
- **Dark mode toggle** in settings page (and keep a small toggle accessible somewhere quick, like the settings page footer or each panel).
- **Enter key** on inputs triggers validation/reeval via focusout or explicit keydown handler.
- **Remove**: ProfileDrawer, SetupView (replaced by settings route)

## Capabilities

### New Capabilities
- `settings-page`: Dedicated settings route with left-nav layout, Basic Info / Load-Save / Advanced panels, dark mode toggle, and Done button

### Modified Capabilities
- `app-shell-layout`: Avatar button opens dropdown menu (not drawer), links to /settings, remove ProfileDrawer
- `first-use-flow`: Redirect to /settings Basic Info panel instead of SetupView modal
- `portfolio-editor`: Remove FileControls from PortfolioEditor (moved to settings)

## Impact

- **Frontend**: New route `/settings`, new components (SettingsPage, avatar dropdown, DiceBear integration), remove ProfileDrawer.svelte, SetupView.svelte, FileControls.svelte from PortfolioEditor
- **Stores**: Add avatar seed/URL to profile store, add auto-save preference
- **Dependencies**: Add `@dicebear/core` + a style package (e.g., `@dicebear/collection`) or use DiceBear HTTP API for simplicity
- **Tests**: New settings page tests, update AppBar tests, remove ProfileDrawer tests, update SetupView tests
- **No backend changes**
