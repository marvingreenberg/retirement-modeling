import '@testing-library/jest-dom/vitest';

// @testing-library/svelte auto-cleanup only works when vitest globals are
// enabled (globals: true in vitest config). Without globals, rendered
// components accumulate across tests causing "multiple elements found" errors.
// This vitest-specific import registers beforeEach/afterEach hooks that handle
// setup and cleanup without requiring globals.
// See: https://github.com/testing-library/svelte-testing-library/issues/270
import '@testing-library/svelte/vitest';
