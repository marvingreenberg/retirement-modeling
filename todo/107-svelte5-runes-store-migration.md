# 107 — Migrate Stores from Svelte 4 Writable to Svelte 5 $state() Runes

## Problem

All test runs emit hundreds of `binding_property_non_reactive` warnings:
```
`bind:value={config.annual_spend_net}` is binding to a non-reactive property
```

The stores in `stores.svelte.ts` use `reactiveWritable<T>()` which wraps `$state()` but exposes the Svelte 4 `Writable` interface (subscribe/set/update). Components consume these with `$portfolio`, `$profile`, etc. — the `$` prefix unwraps via `subscribe()`, producing plain objects. Svelte 5's `bind:value` expects `$state()` proxies for two-way reactivity. The bindings still work because components use `focusout` handlers to manually push updates, but the pattern is deprecated and the warnings are real.

## Prior Art

The `rtaff` project completed this migration in two commits:
- `a419d0d` — Converted auth store: renamed `auth.ts` → `auth.svelte.ts`, replaced `writable()` with `$state()`, exported an object with getters/setters
- `a93d1b9` — Converted all 21 route pages and 11 test files to runes

Pattern used in rtaff:
```typescript
// stores/auth.svelte.ts
let _user = $state<PersonResponse | null>(null);
export const authState = {
   get user() { return _user; },
   set user(v) { _user = v; },
};
```

## Scope for This Project

### Stores to migrate (`stores.svelte.ts`)
- `portfolio: Writable<Portfolio>` — heavily used, ~30+ components
- `profile: Writable<UserProfile>` — ~10 components
- `validationErrors: Writable<FieldErrors>` — ~8 components
- `formTouched: Writable<boolean>` — ~5 components
- `touchedFields: Writable<SvelteSet<string>>` — ~3 components
- `comparisonSnapshots: Writable<ComparisonSnapshot[]>` — ~3 components
- `simulateBlockedSection: Writable<string | null>` — ~2 components
- `numSimulations: Writable<number>` — ~2 components
- `simulationResults: Writable<SimulationResultsState>` — ~3 components

### Consumer changes
Every `$portfolio` becomes `portfolio` (direct property access on the reactive proxy). Every `$portfolio = ...` or `portfolio.set(...)` becomes direct assignment. Every `portfolio.update(fn)` becomes `Object.assign(portfolio, fn(portfolio))` or a direct mutation if the proxy allows it.

### Test changes
Tests currently use `portfolio.set(structuredClone(...))` — will need to change to direct assignment or a reset helper.

## Risks

- **Infinite reactive loops**: The MEMORY.md records that naively making `chart` a `$state()` caused an infinite loop because `buildChart()` writes to `chart` inside an `$effect` that reads `years`. Every `$effect` and `$derived` that reads store values needs to be checked for write-back cycles.
- **Deep reactivity**: `$state()` creates deep proxies. Mutations to nested objects (like `portfolio.config.inflation_rate = 0.03`) will automatically trigger reactivity — which is desirable but means we can remove the manual `portfolio.update()` calls that exist today. Need to verify each component's update pattern.
- **Snapshot/serialization**: Code that calls `structuredClone($portfolio)` or JSON.stringify may need `$state.snapshot()` to unwrap the proxy first.

## Approach

1. Start with a low-usage store (e.g., `numSimulations` or `simulateBlockedSection`) as a pilot
2. Migrate `profile` next (smaller surface area, ~10 consumers)
3. Migrate `portfolio` last (largest surface area, most complex nesting)
4. After each store, run full test suite + svelte-check to verify no regressions
5. Check for reactive loops by running `make dev` and exercising the UI manually

## Verification

- `npx vitest run` — all tests pass with zero `binding_property_non_reactive` warnings
- `npx svelte-check` — no new errors
- `make lint` — clean
- Manual: load data, edit fields, simulate — verify two-way binding works without focusout workarounds
