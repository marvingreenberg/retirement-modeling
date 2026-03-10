import '@testing-library/jest-dom/vitest';

// @testing-library/svelte auto-cleanup only works when vitest globals are
// enabled (globals: true in vitest config). Without globals, rendered
// components accumulate across tests causing "multiple elements found" errors.
// This vitest-specific import registers beforeEach/afterEach hooks that handle
// setup and cleanup without requiring globals.
// See: https://github.com/testing-library/svelte-testing-library/issues/270
import '@testing-library/svelte/vitest';

// Suppress Svelte "binding_property_non_reactive" warnings in tests.
// Testing-library passes plain objects as props (not $state() proxies),
// so bind:value triggers this warning even though components work correctly
// in the real app where props flow from reactive stores.
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
   if (
      typeof args[0] === 'string' &&
      args[0].includes('binding_property_non_reactive')
   )
      return;
   originalWarn.apply(console, args);
};
