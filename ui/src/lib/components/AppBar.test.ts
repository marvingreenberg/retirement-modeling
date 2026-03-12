import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import {
   profile,
   defaultProfile,
   portfolio,
   defaultPortfolio,
} from '$lib/stores';
import { helpState, closeHelp } from '$lib/helpState.svelte';

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

vi.mock('$app/state', () => ({
   page: { url: new URL('http://localhost/') },
}));

// Must import after mock setup
const { default: AppBar } = await import('./AppBar.svelte');

describe('AppBar', () => {
   beforeEach(() => {
      profile.value = structuredClone(defaultProfile);
      portfolio.value = structuredClone(defaultPortfolio);
      closeHelp();
   });

   it('renders the app title', () => {
      render(AppBar);
      expect(screen.getByText('Retirement Planner')).toBeInTheDocument();
   });

   it('renders navigation links', () => {
      render(AppBar);
      expect(
         screen.getByRole('link', { name: /overview/i }),
      ).toBeInTheDocument();
      expect(
         screen.getByRole('link', { name: /compare/i }),
      ).toBeInTheDocument();
      expect(
         screen.getByRole('link', { name: /details/i }),
      ).toBeInTheDocument();
   });

   it('does not show a Spending navigation link', () => {
      render(AppBar);
      expect(
         screen.queryByRole('link', { name: /spending/i }),
      ).not.toBeInTheDocument();
   });

   it('navigation links have correct hrefs', () => {
      render(AppBar);
      expect(screen.getByRole('link', { name: /overview/i })).toHaveAttribute(
         'href',
         '/',
      );
      expect(screen.getByRole('link', { name: /compare/i })).toHaveAttribute(
         'href',
         '/compare',
      );
      expect(screen.getByRole('link', { name: /details/i })).toHaveAttribute(
         'href',
         '/details',
      );
   });

   it('marks overview link as active on root path', () => {
      render(AppBar);
      const overviewLink = screen.getByRole('link', { name: /overview/i });
      expect(overviewLink).toHaveAttribute('aria-current', 'page');
   });

   it('does not render dark mode toggle in bar', () => {
      render(AppBar);
      expect(
         screen.queryByLabelText('Toggle dark mode'),
      ).not.toBeInTheDocument();
   });

   it('renders avatar/profile button', () => {
      render(AppBar);
      expect(screen.getByLabelText('Open profile')).toBeInTheDocument();
   });

   it('renders help button', () => {
      render(AppBar);
      expect(screen.getByLabelText('Open help')).toBeInTheDocument();
   });

   it('help button opens help panel with default topic', async () => {
      render(AppBar);
      expect(helpState.open).toBe(false);
      await fireEvent.click(screen.getByLabelText('Open help'));
      expect(helpState.open).toBe(true);
      expect(helpState.topic).toBe('getting-started');
   });

   it('does not show previous version link when status has no prev info', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
         ok: true,
         json: async () => ({
            version: '2.3.0',
            previous_version_url: '',
            previous_version: '',
         }),
      } as Response);
      render(AppBar);
      await vi.waitFor(() => {
         expect(screen.getByText('v2.3.0')).toBeInTheDocument();
      });
      expect(
         screen.queryByRole('link', { name: /previous version/i }),
      ).not.toBeInTheDocument();
   });

   it('shows previous version link when status returns prev info', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
         ok: true,
         json: async () => ({
            version: '2.3.0',
            previous_version_url: 'https://prev.example.com',
            previous_version: '2.2.0',
         }),
      } as Response);
      render(AppBar);
      await vi.waitFor(() => {
         expect(screen.getByText('v2.3.0')).toBeInTheDocument();
      });
      const link = screen.getByRole('link', { name: /previous version 2\.2\.0/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://prev.example.com');
      expect(link).toHaveAttribute('target', '_blank');
   });

   it('avatar click opens dropdown with section links', async () => {
      profile.value = { primaryName: 'Mike', spouseName: '' };
      render(AppBar);
      await fireEvent.click(screen.getByLabelText('Open profile'));
      expect(
         screen.getByRole('link', { name: /basic info/i }),
      ).toBeInTheDocument();
      expect(
         screen.getByRole('link', { name: /load \/ save/i }),
      ).toBeInTheDocument();
      expect(
         screen.getByRole('link', { name: /advanced settings/i }),
      ).toBeInTheDocument();
   });

   it('dropdown shows dark mode and auto-save toggles', async () => {
      profile.value = { primaryName: 'Mike', spouseName: '' };
      render(AppBar);
      await fireEvent.click(screen.getByLabelText('Open profile'));
      expect(screen.getByLabelText('Toggle dark mode')).toBeInTheDocument();
      expect(screen.getByLabelText('Toggle auto-save')).toBeInTheDocument();
   });
});
