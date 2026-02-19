## Context

The app has 9 `writable()` stores in `stores.ts`. In Svelte 5, `bind:value` on nested properties of store-subscribed values (`$portfolio.config.field`) triggers `binding_property_non_reactive` warnings because `writable()` returns plain objects rather than Svelte 5 reactive proxies. Current workarounds (focusout handlers forcing shallow copies) are fragile.

29 files import from `$lib/stores`. Tests use `.set()`, `.update()`, and `get()` from `svelte/store`.

## Goals / Non-Goals

**Goals:**
- Eliminate `binding_property_non_reactive` warnings
- Make store state deeply reactive via `$state()` runes
- Maintain backward-compatible API (`.set()`, `.update()`, `get()`, `$store` syntax)
- Minimize import path churn

**Non-Goals:**
- Removing all `writable()` usage across the entire codebase (only the shared stores)
- Changing component architecture or prop drilling patterns
- Removing `$effect` blocks that perform legitimate side-effects

## Decisions

### 1. Use `$state()` internally with manual store-compatible wrapper

**Decision**: Create `stores.svelte.ts` with a `reactiveWritable<T>()` helper that uses `$state()` internally and implements `.subscribe()`, `.set()`, `.update()` manually. Keep `stores.ts` as a re-export barrel.

**Note**: `toStore()` from `svelte/store` was tried and failed — `get()` from `svelte/store` returns stale values because `toStore()` uses `$effect`-based subscriptions that don't fire synchronously. The manual approach calls subscribers synchronously in `.set()`/`.update()`, matching `writable()` semantics exactly.

**Pattern**:
```ts
// stores.svelte.ts
function reactiveWritable<T>(initial: T): Writable<T> {
  let _value: T = $state(initial);
  const subs = new Set<Subscriber<T>>();
  return {
    subscribe(fn: Subscriber<T>): Unsubscriber {
      subs.add(fn);
      fn(_value);  // synchronous initial call (store contract)
      return () => { subs.delete(fn); };
    },
    set(v: T) {
      _value = v;
      for (const fn of subs) fn(_value);
    },
    update(fn: (v: T) => T) {
      _value = fn(_value);
      for (const fn of subs) fn(_value);
    }
  };
}
```

`$state()` wraps objects in deep proxies. Components using `$store.nested.prop` get reactive proxies, fixing `bind:value` warnings. Store subscribers are notified synchronously, so `get()` always returns the current value.

**`structuredClone` limitation**: `$state()` proxies cannot be `structuredClone()`'d (throws `DataCloneError`). Export a `snapshot()` utility wrapping `$state.snapshot()` for callers that need plain objects (save-to-file, test assertions).

```ts
// stores.ts (barrel re-export, no changes to import paths)
export * from './stores.svelte';
```

### 2. Remove focusout reactivity workarounds

**Decision**: Remove the `handleFocusOut` function in `PortfolioEditor.svelte` that does `portfolio.update((p) => ({ ...p, config: { ...p.config } }))` to force reactivity. With `$state()`, deep property mutations propagate automatically.

**Rationale**: This workaround was necessary because `writable()` returns plain objects. With `$state()` proxies, mutations like `$portfolio.config.current_age_primary = 60` automatically trigger reactivity.

### 3. Keep helper functions and sample data unchanged

**Decision**: `markTouched()`, `markFormTouched()`, `randomizeForDemo()`, sample scenarios, and default data remain in `stores.svelte.ts` with the same API. They call `.update()` or `.set()` on the new store objects.

## Risks / Trade-offs

- [$state() proxies can't be structuredClone'd] → Export `snapshot()` utility; use `$state.snapshot()` in .svelte files
- [Test files importing from .svelte.ts] → Works with Vitest + Svelte plugin (proven by autoSave.test.ts → autoSave.svelte.ts)
- [Barrel re-export may cause circular dependency] → Unlikely since stores.ts only re-exports from stores.svelte.ts
- [Deep mutations via bind:value don't call store subscribers] → OK: Svelte 5 proxy reactivity propagates across components independently of store subscribers; autoSave $effect tracks deep reads via JSON.stringify
