import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';

function mockMatchMedia(matches: boolean) {
   Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
         matches,
         media: query,
         addEventListener: vi.fn(),
         removeEventListener: vi.fn(),
      })),
   });
}

// Must mock before importing the component
mockMatchMedia(true);
const { default: PortraitBlocker, isNarrow } =
   await import('./PortraitBlocker.svelte');

describe('PortraitBlocker', () => {
   beforeEach(() => {
      cleanup();
   });

   it('renders overlay when viewport is narrow', () => {
      mockMatchMedia(true);
      render(PortraitBlocker);
      expect(screen.getByTestId('portrait-blocker')).toBeInTheDocument();
      expect(
         screen.getByText(/requires a landscape layout/),
      ).toBeInTheDocument();
   });

   it('does not render overlay when viewport is wide', () => {
      mockMatchMedia(false);
      render(PortraitBlocker);
      expect(screen.queryByTestId('portrait-blocker')).not.toBeInTheDocument();
   });

   it('isNarrow returns true when narrow', () => {
      mockMatchMedia(true);
      render(PortraitBlocker);
      expect(isNarrow()).toBe(true);
   });

   it('isNarrow returns false when wide', () => {
      mockMatchMedia(false);
      render(PortraitBlocker);
      expect(isNarrow()).toBe(false);
   });
});
