import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';

function mockViewport(width: number, height: number) {
   Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: width,
   });
   Object.defineProperty(window, 'innerHeight', {
      writable: true,
      value: height,
   });
}

// Must mock before importing the component (portrait → narrow)
mockViewport(400, 800);
const { default: PortraitBlocker, isNarrow } =
   await import('./PortraitBlocker.svelte');

describe('PortraitBlocker', () => {
   beforeEach(() => {
      cleanup();
   });

   it('renders overlay when viewport is portrait (width < height)', () => {
      mockViewport(400, 800);
      render(PortraitBlocker);
      expect(screen.getByTestId('portrait-blocker')).toBeInTheDocument();
      expect(
         screen.getByText(/requires a landscape layout/),
      ).toBeInTheDocument();
   });

   it('does not render overlay when viewport is landscape (width >= height)', () => {
      mockViewport(1024, 768);
      render(PortraitBlocker);
      expect(screen.queryByTestId('portrait-blocker')).not.toBeInTheDocument();
   });

   it('isNarrow returns true when portrait', () => {
      mockViewport(400, 800);
      render(PortraitBlocker);
      expect(isNarrow()).toBe(true);
   });

   it('isNarrow returns false when landscape', () => {
      mockViewport(1024, 768);
      render(PortraitBlocker);
      expect(isNarrow()).toBe(false);
   });
});
