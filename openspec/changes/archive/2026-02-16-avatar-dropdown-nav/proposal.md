## Why

The avatar dropdown currently shows a single "Settings" link, requiring users to navigate to `/settings` and then pick a section. Expanding the dropdown to mirror the settings page left-nav (Basic Info, Load/Save, Advanced Settings) plus inline toggles for dark mode and auto-save gives quick access to all settings capabilities from any page.

## What Changes

- Replace the single "Settings" link in the avatar dropdown with three section links (Basic Info, Load/Save, Advanced Settings) that navigate to `/settings?section=<id>`
- Add dark mode and auto-save checkbox toggles below a divider in the dropdown
- Settings page reads the `?section=` query param on load to pre-select the active section
- Remove the "Avatar on settings page does nothing" behavior — dropdown works on all pages
- Move dark mode and auto-save toggle logic into a shared utility so both dropdown and settings page can use it

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `app-shell-layout`: Avatar dropdown menu contents change from single Settings link to section nav links + toggle checkboxes; avatar click enabled on all routes
- `settings-page`: Settings page reads `?section=` query param to set initial active section; dark mode toggle also in dropdown

## Impact

- `ui/src/lib/components/AvatarDropdown.svelte` — expanded dropdown content
- `ui/src/lib/components/AppBar.svelte` — remove onSettingsPage guard
- `ui/src/routes/settings/+page.svelte` — read query param for initial section
- `ui/src/lib/darkMode.ts` (new) — shared dark mode toggle logic
- `ui/src/lib/autoSave.ts` (new) — shared auto-save toggle logic
- Tests: AvatarDropdown tests, AppBar tests, settings tests, E2E navigation tests
