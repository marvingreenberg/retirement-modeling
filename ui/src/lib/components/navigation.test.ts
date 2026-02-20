import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';

Object.defineProperty(window, 'matchMedia', {
   writable: true,
   value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
   })),
});

describe('Route pages render expected content', () => {
   it('/compare page renders CompareView', async () => {
      const { default: ComparePage } =
         await import('../../routes/compare/+page.svelte');
      render(ComparePage);
      expect(screen.getByText('No comparisons yet')).toBeInTheDocument();
   });

   // Budget is now inline in PortfolioEditor, not a separate route
   // Details page rendering tested in src/routes/details/details.test.ts
   // Dynamic import from this context hangs due to lucide-svelte module resolution
});
