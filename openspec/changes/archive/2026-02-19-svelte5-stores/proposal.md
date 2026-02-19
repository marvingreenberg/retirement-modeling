## Why

The frontend uses Svelte 4 `writable()` stores for all shared state. In Svelte 5, `bind:value` on nested properties of these stores triggers `binding_property_non_reactive` warnings because the store returns plain objects rather than reactive proxies. Current workarounds (focusout handlers that force shallow copies) are fragile and don't fully solve the problem — deep property mutations (e.g., changing an account owner) don't propagate correctly without manual intervention.

## What Changes

- Rename `stores.ts` → `stores.svelte.ts` and replace `writable()` stores with `$state()` runes
- Provide a backward-compatible API wrapper so existing consumers using `$store` auto-subscription, `.set()`, `.update()`, and `get()` continue to work
- Remove focusout workarounds that manually force reactivity (shallow copies in `handleFocusOut`)
- Update test setup to use the new store API

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

(none — this is an internal refactoring that preserves existing behavior)

## Impact

- `ui/src/lib/stores.ts` → renamed to `stores.svelte.ts`, internals rewritten
- `ui/src/lib/autoSave.svelte.ts` — update `get()` calls to direct property access
- `ui/src/lib/components/portfolio/PortfolioEditor.svelte` — remove `handleFocusOut` shallow-copy workaround
- All import paths in `.svelte` and `.ts` files that reference `$lib/stores` — may need updating to `$lib/stores.svelte`
- All test files that use `get()`, `.set()`, `.update()` — update to new API
